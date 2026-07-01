import Masonry from "@/components/Masonry";
import { getSupabase, publicUrlFor, type Artwork } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data, error } = await getSupabase()
    .from("artworks")
    .select("id, title, storage_path, created_at")
    .order("created_at", { ascending: false });

  const artworks: Artwork[] = error || !data ? [] : data;
  const items = artworks.map((artwork) => ({
    id: artwork.id,
    title: artwork.title,
    url: publicUrlFor(artwork.storage_path),
  }));

  return (
    <main className="flex-1 px-4 sm:px-8 pb-16">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-32 text-center">
          <p className="text-sm text-neutral-500 tracking-wide">
            No artwork yet.
          </p>
          <a
            href="/upload"
            className="text-xs tracking-[0.2em] uppercase text-neutral-300 border border-neutral-700 hover:border-neutral-300 px-4 py-2 transition-colors"
          >
            Add the first piece
          </a>
        </div>
      ) : (
        <Masonry items={items} />
      )}
    </main>
  );
}
