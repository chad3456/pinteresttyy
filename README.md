# Gallery

A minimal, private, Pinterest-style gallery for curating your own artwork.
Images live in a Supabase Storage bucket — there's no static image folder in
the repo, so you add, remove, and rearrange pieces entirely from the app.

## Features

- Masonry-style responsive grid, dark and minimal
- Upload artwork straight to a Supabase Storage bucket (no local/static files)
- Remove pieces from the gallery on hover
- Single shared password gate (via cookie) so the collection stays private

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a free project, then open
the SQL editor and run `supabase/schema.sql` from this repo. That will:

- create the `artworks` table (id, title, storage_path, created_at)
- create a public storage bucket named `artwork`
- set up row-level security so the gallery can be read publicly, while all
  writes go through the server using the service role key

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=       # Project Settings -> API -> Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Project Settings -> API -> anon public key
SUPABASE_SERVICE_ROLE_KEY=      # Project Settings -> API -> service_role key (keep secret)
GALLERY_PASSWORD=               # the password used to view/manage your gallery
```

### 3. Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be asked for
`GALLERY_PASSWORD` before you can see or upload anything.

## How it works

- `middleware.ts` gates every route behind a password cookie, except
  `/login` and `/api/login`.
- `/upload` posts a file + title to `/api/upload`, which uploads the image to
  the `artwork` bucket and inserts a row in `artworks` using the Supabase
  service role key (server-side only).
- `/` (the gallery) reads `artworks` with the public anon key and renders a
  CSS-columns masonry grid of public bucket URLs.
- Hovering a piece reveals a "Remove" button, which calls
  `DELETE /api/artworks/[id]` to delete both the storage object and the row.

## Deploying

Any Next.js host (e.g. Vercel) works — just set the same four environment
variables in the hosting provider's dashboard.
