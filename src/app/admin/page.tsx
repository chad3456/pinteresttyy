"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent } from "react";

type QueuedFile = {
  key: string;
  file: File;
  title: string;
  preview: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function titleFromFilename(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim();
}

export default function AdminPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) =>
      ALLOWED_TYPES.includes(f.type)
    );
    const next: QueuedFile[] = files.map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
      file,
      title: titleFromFilename(file.name),
      preview: URL.createObjectURL(file),
      status: "pending",
    }));
    setQueue((prev) => [...prev, ...next]);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  function updateTitle(key: string, title: string) {
    setQueue((prev) =>
      prev.map((item) => (item.key === key ? { ...item, title } : item))
    );
  }

  function removeItem(key: string) {
    setQueue((prev) => prev.filter((item) => item.key !== key));
  }

  async function uploadAll() {
    setUploading(true);
    for (const item of queue) {
      if (item.status === "done") continue;
      setQueue((prev) =>
        prev.map((i) => (i.key === item.key ? { ...i, status: "uploading" } : i))
      );

      const formData = new FormData();
      formData.set("file", item.file);
      formData.set("title", item.title || "Untitled");

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Upload failed");
        }
        setQueue((prev) =>
          prev.map((i) => (i.key === item.key ? { ...i, status: "done" } : i))
        );
      } catch (err) {
        setQueue((prev) =>
          prev.map((i) =>
            i.key === item.key
              ? { ...i, status: "error", error: (err as Error).message }
              : i
          )
        );
      }
    }
    setUploading(false);
    router.refresh();
  }

  const pendingCount = queue.filter((i) => i.status !== "done").length;

  return (
    <main className="flex-1 px-4 sm:px-8 pb-16 max-w-4xl mx-auto w-full">
      <h1 className="text-xs tracking-[0.3em] uppercase text-neutral-400 text-center mb-8">
        Bulk upload
      </h1>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 border border-dashed py-16 cursor-pointer transition-colors ${
          dragging
            ? "border-neutral-300 bg-neutral-900"
            : "border-neutral-700 hover:border-neutral-400"
        }`}
      >
        <span className="text-xs tracking-[0.15em] uppercase text-neutral-400">
          Drop images here, or click to browse
        </span>
        <span className="text-[10px] text-neutral-600">
          JPEG, PNG, WEBP, GIF
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {queue.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-8">
            {queue.map((item) => (
              <div
                key={item.key}
                className="flex flex-col gap-2 bg-neutral-950 border border-neutral-800 p-2"
              >
                <div className="relative aspect-square overflow-hidden bg-neutral-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.preview}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  {item.status !== "pending" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-[10px] tracking-[0.15em] uppercase text-neutral-100">
                      {item.status === "uploading" && "Uploading…"}
                      {item.status === "done" && "Saved"}
                      {item.status === "error" && "Failed"}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateTitle(item.key, e.target.value)}
                  disabled={item.status === "done" || uploading}
                  placeholder="Title"
                  className="bg-transparent border-b border-neutral-800 focus:border-neutral-400 outline-none py-1 text-xs text-neutral-100 placeholder:text-neutral-600 disabled:opacity-50"
                />
                {item.status === "error" && (
                  <p className="text-[10px] text-neutral-500">{item.error}</p>
                )}
                {item.status !== "done" && !uploading && (
                  <button
                    onClick={() => removeItem(item.key)}
                    className="text-[10px] tracking-[0.15em] uppercase text-neutral-500 hover:text-[var(--accent)] self-start"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={uploadAll}
              disabled={uploading || pendingCount === 0}
              className="text-xs tracking-[0.2em] uppercase border border-neutral-700 hover:border-[var(--accent)] hover:text-[var(--accent)] text-neutral-300 px-6 py-2 transition-colors disabled:opacity-50"
            >
              {uploading
                ? "Uploading…"
                : pendingCount === 0
                ? "All uploaded"
                : `Upload ${pendingCount} image${pendingCount === 1 ? "" : "s"}`}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
