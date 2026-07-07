import { copy, del, list } from "@vercel/blob";
import { PENDING_STYLE, PREFIX, encodePart, parsePathname } from "./artwork-path";
import { classifyStyle } from "./style";

// Vercel Blob-backed storage. No separate database: each image's title
// and style are encoded directly into its blob pathname, and the blob's
// own URL is served directly (public), so there's nothing else to host.
//
// Uploads go directly from the browser to Blob storage (see
// @vercel/blob/client in the upload/admin pages) to avoid Vercel's ~4.5MB
// request body limit on serverless functions. The file first lands at a
// "pending" pathname; finalizeUpload() then classifies its style and
// renames it (via copy + delete) to the final pathname.

export type GalleryItem = {
  id: string;
  title: string;
  style: string;
  url: string;
};

export async function listArtworks(): Promise<GalleryItem[]> {
  const { blobs } = await list({ prefix: PREFIX });

  return blobs
    .filter((blob) => !blob.pathname.includes(`__${PENDING_STYLE}__`))
    .map((blob) => {
      const { title, style } = parsePathname(blob.pathname);
      return { id: blob.pathname, title, style, url: blob.url, uploadedAt: blob.uploadedAt };
    })
    .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))
    .map(({ id, title, style, url }) => ({ id, title, style, url }));
}

export async function finalizeUpload(
  blobUrl: string,
  pathname: string,
  contentType: string
) {
  try {
    const response = await fetch(blobUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    const style = await classifyStyle(buffer, contentType);
    const finalPathname = pathname.replace(
      `__${PENDING_STYLE}__`,
      `__${encodePart(style)}__`
    );
    await copy(blobUrl, finalPathname, { access: "public", contentType });
    await del(blobUrl);
  } catch {
    // Leave the pending blob as-is rather than losing the upload; it's
    // filtered out of listArtworks until a retry finalizes it.
  }
}

export async function deleteArtwork(id: string): Promise<boolean> {
  await del(id);
  return true;
}
