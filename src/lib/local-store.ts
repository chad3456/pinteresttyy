import { randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

// Simple filesystem-backed storage: images and their metadata live under
// data/ (gitignored). No external database or account needed.

const DATA_DIR = path.join(process.cwd(), "data");
const IMAGES_DIR = path.join(DATA_DIR, "images");
const INDEX_FILE = path.join(DATA_DIR, "artworks.json");

export type ArtworkRecord = {
  id: string;
  title: string;
  filename: string;
  contentType: string;
  style: string;
  createdAt: string;
};

export type GalleryItem = {
  id: string;
  title: string;
  style: string;
  url: string;
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

export function imageUrlFor(filename: string) {
  return `/api/images/${filename}`;
}

export async function listArtworks(): Promise<GalleryItem[]> {
  const records = await readIndex();
  return records
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((record) => ({
      id: record.id,
      title: record.title,
      style: record.style || "Uncategorized",
      url: imageUrlFor(record.filename),
    }));
}

export async function addArtwork(
  buffer: Buffer,
  contentType: string,
  originalFilename: string,
  title: string,
  style: string
) {
  await ensureReady();
  const extension = originalFilename.split(".").pop() || "jpg";
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(IMAGES_DIR, filename), buffer);

  const record: ArtworkRecord = {
    id: randomUUID(),
    title: title || "Untitled",
    filename,
    contentType,
    style,
    createdAt: new Date().toISOString(),
  };

  const records = await readIndex();
  records.push(record);
  await writeIndex(records);
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
  if (filename.includes("/") || filename.includes("..")) return null;
  const records = await readIndex();
  const record = records.find((r) => r.filename === filename);
  if (!record) return null;

  const buffer = await readFile(path.join(IMAGES_DIR, filename)).catch(() => null);
  if (!buffer) return null;

  return { buffer, contentType: record.contentType };
}
