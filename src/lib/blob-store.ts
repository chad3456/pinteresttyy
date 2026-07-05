import { randomUUID } from "crypto";
import { del, list, put } from "@vercel/blob";

// Vercel Blob-backed storage. No separate database: each image's title
// and style are encoded directly into its blob pathname, and the blob's
// own URL is served directly (public), so there's nothing else to host.

const PREFIX = "artworks/";

export type GalleryItem = {
  id: string;
  title: string;
  style: string;
  url: string;
};

function encodePart(value: string) {
  return encodeURIComponent(value).replace(/__/g, "%5F%5F");
}

function decodePart(value: string) {
  return decodeURIComponent(value);
}

export async function listArtworks(): Promise<GalleryItem[]> {
  const { blobs } = await list({ prefix: PREFIX });

  return blobs
    .map((blob) => {
      const base = blob.pathname.slice(PREFIX.length);
      const [titleEnc, styleEnc] = base.split("__");
      return {
        id: blob.pathname,
        title: titleEnc ? decodePart(titleEnc) : "Untitled",
        style: styleEnc ? decodePart(styleEnc) : "Uncategorized",
        url: blob.url,
        uploadedAt: blob.uploadedAt,
      };
    })
    .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))
    .map(({ id, title, style, url }) => ({ id, title, style, url }));
}

export async function addArtwork(
  buffer: Buffer,
  contentType: string,
  originalFilename: string,
  title: string,
  style: string
) {
  const extension = originalFilename.split(".").pop() || "jpg";
  const pathname = `${PREFIX}${encodePart(title || "Untitled")}__${encodePart(
    style || "Uncategorized"
  )}__${randomUUID()}.${extension}`;

  await put(pathname, buffer, {
    access: "public",
    contentType,
    addRandomSuffix: false,
  });
}

export async function deleteArtwork(id: string): Promise<boolean> {
  await del(id);
  return true;
}
