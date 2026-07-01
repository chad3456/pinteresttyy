import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";

export const ARTWORK_BUCKET = "artwork";

// Client for reading public data (safe to use in server components).
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  return createClient(url, anonKey);
}

// Client with elevated privileges for uploads/deletes. Server-only, never
// expose the service role key to the browser.
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, serviceRoleKey);
}

export type Artwork = {
  id: string;
  title: string;
  storage_path: string;
  style: string;
  created_at: string;
};

export type GalleryItem = {
  id: string;
  title: string;
  style: string;
  url: string;
};

function publicUrlFor(path: string) {
  const { data } = getSupabase().storage.from(ARTWORK_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function listArtworks(): Promise<GalleryItem[]> {
  const { data, error } = await getSupabase()
    .from("artworks")
    .select("id, title, storage_path, style, created_at")
    .order("created_at", { ascending: false });

  const artworks: Artwork[] = error || !data ? [] : data;
  return artworks.map((artwork) => ({
    id: artwork.id,
    title: artwork.title,
    style: artwork.style || "Uncategorized",
    url: publicUrlFor(artwork.storage_path),
  }));
}

export async function addArtwork(
  buffer: Buffer,
  contentType: string,
  originalFilename: string,
  title: string,
  style: string
) {
  const admin = getSupabaseAdmin();
  const extension = originalFilename.split(".").pop() || "jpg";
  const storagePath = `${randomUUID()}.${extension}`;

  const { error: uploadError } = await admin.storage
    .from(ARTWORK_BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  const { error: insertError } = await admin
    .from("artworks")
    .insert({ title: title || "Untitled", storage_path: storagePath, style });

  if (insertError) {
    await admin.storage.from(ARTWORK_BUCKET).remove([storagePath]);
    throw new Error(insertError.message);
  }
}

export async function deleteArtwork(id: string): Promise<boolean> {
  const admin = getSupabaseAdmin();

  const { data: artwork, error: fetchError } = await admin
    .from("artworks")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (fetchError || !artwork) return false;

  await admin.storage.from(ARTWORK_BUCKET).remove([artwork.storage_path]);
  const { error: deleteError } = await admin.from("artworks").delete().eq("id", id);
  if (deleteError) throw new Error(deleteError.message);

  return true;
}
