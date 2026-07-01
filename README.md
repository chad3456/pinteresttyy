# Gallery

A minimal, private, Pinterest-style gallery for curating your own artwork.
There's no static image folder baked into the app — you add, remove, and
rearrange pieces entirely from the UI, and images are stored outside of git.

## Features

- Masonry-style responsive grid, dark and minimal
- `/upload` — add one piece at a time
- `/admin` — drag-and-drop bulk uploader for seeding many pieces at once
- Remove pieces from the gallery on hover
- Single shared password gate (via cookie) so the collection stays private

## Running locally (no cloud setup required)

By default the app stores images and metadata on your local filesystem
under `data/` (gitignored) — nothing to configure, nothing to sign up for.

```bash
npm install
GALLERY_PASSWORD=choose-a-password npm run dev
```

Or copy `.env.example` to `.env.local` and set `GALLERY_PASSWORD` there
instead of passing it inline.

Open [http://localhost:3000](http://localhost:3000), enter your password,
then use `/upload` or `/admin` to add artwork — it'll show up on the
gallery immediately.

`data/images/` holds the uploaded files and `data/artworks.json` holds the
title/order metadata. Delete that folder any time to start fresh.

## How it works (local mode)

- `src/proxy.ts` gates every route behind a password cookie, except
  `/login` and `/api/login`.
- `/upload` and `/admin` both post to `/api/upload`, which saves the file
  under `data/images/` and appends a record to `data/artworks.json`
  (see `src/lib/local-store.ts`).
- `/` (the gallery) reads `data/artworks.json` and renders a CSS-columns
  masonry grid, with each image served by `/api/images/[filename]`.
- Hovering a piece reveals a "Remove" button, which calls
  `DELETE /api/artworks/[id]` to delete both the file and its record.

## Moving to Supabase for production

Local filesystem storage doesn't survive most cloud deployments (e.g.
Vercel's filesystem is read-only/ephemeral), so before deploying, swap in
the Supabase-backed storage:

1. Create a free project at [supabase.com](https://supabase.com) and run
   `supabase/schema.sql` in its SQL editor. That creates the `artworks`
   table, a public `artwork` storage bucket, and the row-level security
   policies needed for public reads.
2. Set these environment variables (see `.env.example`):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   GALLERY_PASSWORD=
   ```
3. Swap the `@/lib/local-store` calls in `src/app/page.tsx`,
   `src/app/api/upload/route.ts`, and `src/app/api/artworks/[id]/route.ts`
   for the equivalent functions in `src/lib/supabase.ts`.
4. Deploy to any Next.js host (e.g. Vercel) and set the same environment
   variables in its dashboard.
