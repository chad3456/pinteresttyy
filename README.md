# Gallery

A minimal, Pinterest-style gallery for curating your own artwork. No
database, no account, no password — just run it and upload. Images are
stored on the local filesystem under `data/` (gitignored). Each upload is
optionally classified by visual style using Claude, and the gallery groups
similar-style pieces into their own clusters.

## Features

- Masonry-style responsive grid, dark and minimal, sectioned by style
- Zero-setup storage: images + metadata saved locally, no cloud account
  required
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

No signup required to get started:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — that's it. Click
**+ Upload artwork** (or go to `/admin` for bulk uploads) and pieces show
up on the gallery immediately.

### Optional: style classification

To have uploads automatically tagged and clustered by visual style, create
a key at [console.anthropic.com](https://console.anthropic.com) and set it:

```bash
ANTHROPIC_API_KEY=your-anthropic-api-key
```

Copy `.env.example` to `.env.local` for this (and the optional branding
vars below). Without a key, everything still works — pieces just land in
a single "Uncategorized" section.

### Optional: branding

```bash
NEXT_PUBLIC_SITE_NAME=Gallery         # shown in the header and browser tab
NEXT_PUBLIC_ACCENT_COLOR=#c9a227      # hex color used for hover states/buttons
NEXT_PUBLIC_GRID_COLUMNS=4            # desktop column count, 2-6
```

## How it works

- `/upload` and `/admin` both post to `/api/upload`, which sends the image
  to Claude for a one-word style tag (`src/lib/style.ts`), then saves the
  file under `data/images/` and appends a record to `data/artworks.json`
  (`src/lib/local-store.ts`).
- `/` (the gallery) reads `data/artworks.json`, groups pieces by `style`,
  and renders one masonry section per style cluster (largest cluster
  first). Each image is served by `/api/images/[filename]`.
- Hovering a piece reveals a "Remove" button, which calls
  `DELETE /api/artworks/[id]` to delete both the file and its record.

## A note on permanence

This stores files on whatever machine runs the server. That's fine for
local use, but it won't survive a typical serverless deployment (e.g.
Vercel's filesystem is read-only/ephemeral) and won't sync across devices.
If you later want the gallery to be permanent and accessible from
anywhere, swap `src/lib/local-store.ts` for a cloud storage backend
(Supabase, S3, Vercel Blob, etc.) — the rest of the app (upload UI, style
classification, clustering) stays the same.
