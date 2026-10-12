# ViPlay

ViPlay is a music player made with Astro, React and Tailwind.

It uses Supabase for authentication and storage. Songs, artwork and lyrics are
stored in Supabase Storage, with metadata kept in Postgres tables.

## Features

- Browse songs and playlists
- Play / pause, previous / next, and seek
- Queue management (play a single song within all songs, or a whole playlist)
- Karaoke-style synced lyrics (LRC format, line-level and word-level
  `<mm:ss.xx>` tags synced to playback)
- Username + password auth (no email) backed by **Supabase Auth** using a
  generated fake email (`${username}@app.local`) — the same trick used in the
  laregion project. Supabase Auth issues signed tokens, so RLS can trust
  `auth.uid()` and admin checks can't be spoofed.
  Login is optional — guests can browse and play; logging in lets you create
  playlists, copy them, and upload songs (in-app dialogs).

## Project Structure

```text
/
├── public/
├── scripts/
│   └── seed.mjs              # uploads files + inserts song rows (needs service role key)
├── supabase/
│   └── migrations/
│       └── 0001_init.sql     # full schema: tables, RLS, buckets, RPCs
├── seed-assets/              # your local songs: one folder per song (see seed.mjs)
└── src/
    ├── lib/
│   ├── supabase.ts       # Supabase client + public URL helpers
│   ├── auth.ts           # Supabase Auth (username + fake email), account link
│   ├── upload.ts         # in-app song/file upload (client-side)
│   ├── playlists.ts      # playlist CRUD, copy, add/remove songs
│   ├── types.ts          # Song / Playlist types
│   └── lrc.ts            # LRC parser + karaoke sync helpers
    ├── components/
    │   ├── App.tsx           # data loading + queue state + auth gate
    │   ├── AuthScreen.tsx    # login / register (username + password)
    │   ├── UploadDialog.tsx  # in-app song upload form (logged-in users)
    │   ├── PlaylistDialog.tsx # create / edit playlist (logged-in users)
    │   ├── Home.tsx          # browse songs & playlists
    │   ├── Player.tsx        # audio element + controls
    │   └── LyricsViewer.tsx  # synced karaoke lyrics
    ├── layouts/
    └── pages/
        └── index.astro
```

## Setup

### 1. Database

Run `supabase/migrations/0001_init.sql` in your Supabase SQL editor. This creates:

- `accounts`, `songs`, `playlists`, and `playlist_songs` tables
- RLS policies (everything publicly readable except private playlists, which
  only their creator sees; playlist writes restricted to the creator;
  song deletion admin-only via RPC)
- `ensure_account_link` and `delete_song` RPCs
- `audio`, `artwork`, and `lyrics` public storage buckets (uploads, lyric/artwork
  edits, and old-file cleanup allowed from the app)

> Existing accounts link to Supabase Auth on first login via the fake-email
> trick. No email is required from the user.

### 2. Configuration

Copy your Supabase URL and anon key into `.env`:

```
PUBLIC_SUPABASE_URL=https://<project>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

### 3. Add content

Place files under `seed-assets/<song-folder>/` with an audio file, optional
artwork, and an optional `.lrc` lyrics file. An optional `meta.json` may set
`title`, `artist`, `album`, and `duration`:

```text
seed-assets/
  my-song/
    audio.mp3
    artwork.jpg
    lyrics.lrc
    meta.json     # optional: { "title": "...", "artist": "...", "album": "..." }
```

Then upload and insert rows (requires the **service role key**):

```bash
SUPABASE_URL=https://<project>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service_role_key> \
bun run scripts/seed.mjs
```

### In-app uploads

Logged-in users can also upload songs directly from the app via the **Upload**
button in the header (audio required; artwork and lyrics optional, as a file
or pasted LRC text). This runs client-side with the anon key. Songs uploaded
this way record the uploading account in `songs.uploaded_by`, and lyric edits
reuse the same storage object so no orphan files pile up.

### 4. Run

```bash
bun install
bun run dev
```

## Lyrics format (LRC)

Lyrics use standard LRC with per-line timestamps, e.g.:

```lrc
[00:12.34]First line of the song
[00:16.10]Second line here
[00:20.05]And a third line
```

Word-level karaoke uses inline tags:

```lrc
[00:12.34] <00:12.34>First <00:12.70>line <00:13.10>of the song
```

Multiple timestamps on one line and `[offset:]` metadata are supported. Upcoming
lines are dimmed and centered; the active line is enlarged and filled with color
in time with the singer.
