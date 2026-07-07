"use client";

import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { buildPendingPathname } from "@/lib/artwork-path";

export default function UploadPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setPreview(selected ? URL.createObjectURL(selected) : null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const title = String(new FormData(form).get("title") ?? "").trim();

    try {
      await upload(buildPendingPathname(title, file.name), file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      router.push("/");
      router.refresh();
    } catch (err) {
      setError((err as Error).message || "Upload failed.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 pb-16">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-5"
      >
        <h1 className="text-xs tracking-[0.3em] uppercase text-neutral-400 text-center">
          Add to the collection
        </h1>

        <label className="flex flex-col items-center justify-center border border-dashed border-neutral-700 hover:border-neutral-400 transition-colors aspect-square cursor-pointer overflow-hidden bg-neutral-950">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs tracking-[0.15em] uppercase text-neutral-500">
              Choose image
            </span>
          )}
          <input
            type="file"
            name="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            required
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        <input
          type="text"
          name="title"
          placeholder="Title"
          className="bg-transparent border-b border-neutral-700 focus:border-[var(--accent)] outline-none py-2 text-center text-sm tracking-wide text-neutral-100 placeholder:text-neutral-600 transition-colors"
        />

        {error && (
          <p className="text-center text-xs text-neutral-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 text-xs tracking-[0.2em] uppercase border border-neutral-700 hover:border-[var(--accent)] hover:text-[var(--accent)] text-neutral-300 py-2 transition-colors disabled:opacity-50"
        >
          {submitting ? "Uploading..." : "Save"}
        </button>
      </form>
    </main>
  );
}
