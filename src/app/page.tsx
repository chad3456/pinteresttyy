import Masonry from "@/components/Masonry";
import { listArtworks } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  const items = await listArtworks();

  const groups = new Map<string, typeof items>();
  for (const item of items) {
    const key = item.style || "Uncategorized";
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  const clusters = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <main className="flex-1 px-4 sm:px-8 pb-16">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-32 text-center">
          <p className="text-sm text-neutral-500 tracking-wide">
            No artwork yet.
          </p>
          <a
            href="/upload"
            className="text-xs tracking-[0.2em] uppercase text-neutral-300 border border-neutral-700 hover:border-[var(--accent)] hover:text-[var(--accent)] px-4 py-2 transition-colors"
          >
            Add the first piece
          </a>
        </div>
      ) : (
        clusters.map(([style, clusterItems]) => (
          <section key={style} className="mb-20">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="font-[family-name:var(--font-serif-display)] italic text-2xl sm:text-3xl text-[#f3efe6] whitespace-nowrap">
                {style}
              </h2>
              <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
              <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-600">
                {clusterItems.length}
              </span>
            </div>
            <Masonry items={clusterItems} />
          </section>
        ))
      )}
    </main>
  );
}
