# Gallery

A minimal, private, Pinterest-style gallery for curating your own artwork.
Images are stored permanently in Supabase (not on any single machine), so
the collection is the same across every device you log in from. Each
upload is automatically classified by visual style using Claude, and the
gallery groups similar-style pieces into their own clusters.

## Features

- Masonry-style responsive grid, dark and minimal, sectioned by style
- Permanent, cross-device storage via Supabase Storage + Postgres
- `/upload` — add one piece at a time
- `/admin` — drag-and-drop bulk uploader for seeding many pieces at once
- Automatic style tagging on upload (Minimalist, Abstract, Realism,
  Impressionist, Line Art, Pop Art, Photography, Sketch, Digital Art,
  Surreal) using Claude's vision model
- Remove pieces from the gallery on hover
- Single shared password gate (via cookie) so the collection stays private

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a free project, then open
the SQL editor and run `supabase/schema.sql` from this repo. That will:

- create the `artworks` table (id, title, storage_path, style, created_at)
- create a public storage bucket named `artwork`
- set up row-level security so the gallery can be read publicly, while all
  writes go through the server using the service role key

### 2. Get an Anthropic API key

Style classification calls Claude's vision model on upload. Create a key at
[console.anthropic.com](https://console.anthropic.com) (this is separate
from any coding-assistant subscription — it's a pay-as-you-go API key for
the app itself). If you skip this, uploads still work, they're just tagged
"Uncategorized" instead of a specific style.

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=       # Project Settings -> API -> Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Project Settings -> API -> anon public key
SUPABASE_SERVICE_ROLE_KEY=      # Project Settings -> API -> service_role key (keep secret)
GALLERY_PASSWORD=               # the password used to view/manage your gallery
ANTHROPIC_API_KEY=              # used to classify each upload's art style
```

### 4. Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be asked for
`GALLERY_PASSWORD` before you can see or upload anything. Log in from any
device with the same env vars pointed at the same Supabase project and
you'll see the same gallery.

## How it works

- `src/proxy.ts` gates every route behind a password cookie, except
  `/login` and `/api/login`.
- `/upload` and `/admin` both post to `/api/upload`, which sends the image
  to Claude for a one-word style tag (`src/lib/style.ts`), then uploads
  the file to the `artwork` Supabase Storage bucket and inserts a row
  (with that style) into `artworks` using the service role key
  (`src/lib/supabase.ts`), server-side only.
- `/` (the gallery) reads `artworks` with the public anon key, groups
  pieces by `style`, and renders one masonry section per style cluster
  (largest cluster first).
- Hovering a piece reveals a "Remove" button, which calls
  `DELETE /api/artworks/[id]` to delete both the storage object and the
  row.

## Deploying

Any Next.js host (e.g. Vercel) works — just set the same five environment
variables in the hosting provider's dashboard.
