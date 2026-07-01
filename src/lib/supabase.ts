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
  created_at: string;
};

export function publicUrlFor(path: string) {
  const { data } = getSupabase().storage.from(ARTWORK_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
