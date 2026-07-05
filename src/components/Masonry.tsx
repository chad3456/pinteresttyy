"use client";

import { useState } from "react";
import { GRID_COLUMNS } from "@/lib/config";

export type MasonryItem = {
  id: string;
  title: string;
  url: string;
};

const DESKTOP_COLUMN_CLASSES: Record<number, string> = {
  2: "lg:columns-2",
  3: "lg:columns-3",
  4: "lg:columns-4",
  5: "lg:columns-5",
  6: "lg:columns-6",
};

export default function Masonry({ items }: { items: MasonryItem[] }) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  async function handleDelete(id: string) {
    if (!confirm("Remove this piece from the gallery?")) return;
    setDeleting(id);
    const res = await fetch(`/api/artworks?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setHidden((prev) => new Set(prev).add(id));
    } else {
      alert("Could not delete this piece.");
    }
    setDeleting(null);
  }

  return (
    <div
      className={`columns-2 sm:columns-3 ${DESKTOP_COLUMN_CLASSES[GRID_COLUMNS]} gap-4 [column-fill:_balance]`}
    >
      {items
        .filter((item) => !hidden.has(item.id))
        .map((item) => (
          <div
            key={item.id}
            className="group relative mb-4 break-inside-avoid overflow-hidden bg-neutral-900 shadow-lg shadow-black/40 transition-shadow duration-300 hover:shadow-2xl hover:shadow-black/60"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.title}
              loading="lazy"
              className="w-full h-auto block transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="font-[family-name:var(--font-serif-display)] italic text-base text-[#f3efe6] truncate pr-3">
                {item.title}
              </span>
              <button
                onClick={() => handleDelete(item.id)}
                disabled={deleting === item.id}
                className="pointer-events-auto text-[10px] tracking-[0.15em] uppercase text-neutral-300 hover:text-[var(--accent)] border border-neutral-500 hover:border-[var(--accent)] px-2 py-1 transition-colors disabled:opacity-50"
              >
                {deleting === item.id ? "..." : "Remove"}
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}
