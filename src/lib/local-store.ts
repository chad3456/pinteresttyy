import { randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

// Local, filesystem-backed storage so the app is fully testable on
// localhost with zero cloud setup. Images and their metadata live under
// data/ (gitignored). Swap this module for a Supabase-backed one later
// without changing any page/route that imports it.

const DATA_DIR = path.join(process.cwd(), "data");
const IMAGES_DIR = path.join(DATA_DIR, "images");
const INDEX_FILE = path.join(DATA_DIR, "artworks.json");

export type ArtworkRecord = {
  id: string;
  title: string;
  filename: string;
  contentType: string;
  createdAt: string;
};

async function ensureReady() {
  await mkdir(IMAGES_DIR, { recursive: true });
  try {
    await readFile(INDEX_FILE, "utf8");
  } catch {
    await writeFile(INDEX_FILE, "[]", "utf8");
  }
}

async function readIndex(): Promise<ArtworkRecord[]> {
  await ensureReady();
  const raw = await readFile(INDEX_FILE, "utf8");
  return JSON.parse(raw) as ArtworkRecord[];
}

async function writeIndex(records: ArtworkRecord[]) {
  await writeFile(INDEX_FILE, JSON.stringify(records, null, 2), "utf8");
}

export async function listArtworks(): Promise<ArtworkRecord[]> {
  const records = await readIndex();
  return records.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function addArtwork(
  file: File,
  title: string
): Promise<ArtworkRecord> {
  await ensureReady();
  const extension = file.name.split(".").pop() || "jpg";
  const filename = `${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(IMAGES_DIR, filename), buffer);

  const record: ArtworkRecord = {
    id: randomUUID(),
    title: title || "Untitled",
    filename,
    contentType: file.type,
    createdAt: new Date().toISOString(),
  };

  const records = await readIndex();
  records.push(record);
  await writeIndex(records);

  return record;
}

export async function deleteArtwork(id: string): Promise<boolean> {
  const records = await readIndex();
  const record = records.find((r) => r.id === id);
  if (!record) return false;

  await unlink(path.join(IMAGES_DIR, record.filename)).catch(() => {});
  await writeIndex(records.filter((r) => r.id !== id));
  return true;
}

export async function readImage(filename: string) {
  await ensureReady();
  // Reject anything that isn't a bare filename to avoid path traversal.
  if (filename.includes("/") || filename.includes("..")) return null;
  const records = await readIndex();
  const record = records.find((r) => r.filename === filename);
  if (!record) return null;

  const buffer = await readFile(path.join(IMAGES_DIR, filename)).catch(() => null);
  if (!buffer) return null;

  return { buffer, contentType: record.contentType };
}

export function imageUrlFor(filename: string) {
  return `/api/images/${filename}`;
}
