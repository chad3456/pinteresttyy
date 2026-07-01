import Masonry from "@/components/Masonry";
import { imageUrlFor, listArtworks } from "@/lib/local-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const artworks = await listArtworks();
  const items = artworks.map((artwork) => ({
    id: artwork.id,
    title: artwork.title,
    url: imageUrlFor(artwork.filename),
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
