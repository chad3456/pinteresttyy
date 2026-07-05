# Gallery

A minimal, Pinterest-style gallery for curating your own artwork. Images
are stored permanently in Vercel Blob storage — no Supabase, no separate
database, no password. Each upload is optionally classified by visual
style using Claude, and the gallery groups similar-style pieces into their
own clusters.

## Features

- Masonry-style responsive grid, dark and minimal, sectioned by style
- Permanent, cross-device storage via Vercel Blob — no separate database;
  each image's title and style are encoded in its own blob path
- No password gate — open and upload immediately
- `/upload` — add one piece at a time
- `/admin` — drag-and-drop bulk uploader for seeding many pieces at once
- Automatic style tagging on upload (Minimalist, Abstract, Realism,
  Impressionist, Line Art, Pop Art, Photography, Sketch, Digital Art,
  Surreal) using Claude's vision model — optional, degrades gracefully to
  "Uncategorized" without an API key
- Remove pieces from the gallery on hover
- Re-skinnable via env vars: site name, accent color, grid density — no
  code changes needed

## Setup

### 1. Connect a Vercel Blob store

In your Vercel project: **Storage** tab → **Create Database** → **Blob** →
connect it to this project. Vercel automatically injects
`BLOB_READ_WRITE_TOKEN` into your project's environment variables — no
manual copying needed once it's connected.

For local development, copy the same token into `.env.local` (see
`.env.example`).

### 2. Optional: style classification

To have uploads automatically tagged and clustered by visual style, create
a key at [console.anthropic.com](https://console.anthropic.com) and set
`ANTHROPIC_API_KEY`. Without it, everything still works — pieces just land
in a single "Uncategorized" section.

### 3. Optional: branding

```bash
NEXT_PUBLIC_SITE_NAME=Gallery         # shown in the header and browser tab
NEXT_PUBLIC_ACCENT_COLOR=#c9a227      # hex color used for hover states/buttons
NEXT_PUBLIC_GRID_COLUMNS=4            # desktop column count, 2-6
```

### 4. Run it

```bash
npm install
npm run dev
```

## How it works

- `/upload` and `/admin` both post to `/api/upload`, which sends the image
  to Claude for a one-word style tag (`src/lib/style.ts`), then uploads it
  to Vercel Blob (`src/lib/blob-store.ts`) at a path like
  `artworks/<title>__<style>__<uuid>.jpg` — the title and style live in
  the path itself, so there's no separate database to keep in sync.
- `/` (the gallery) lists blobs under `artworks/`, groups them by the
  style encoded in their path, and renders one masonry section per style
  cluster (largest cluster first), using each blob's public URL directly.
- Hovering a piece reveals a "Remove" button, which calls
  `DELETE /api/artworks?id=<blob-pathname>` to delete the blob.

## Deploying

Push to the branch your Vercel project tracks. As long as a Blob store is
connected (step 1), no other configuration is needed — Vercel injects the
storage token automatically at build and runtime.
