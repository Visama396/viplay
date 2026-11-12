# ViPlay

ViPlay is a music player made with Astro, React and Tailwind.

It uses Supabase for authentication and storage. Songs, artwork and lyrics are
stored in Supabase Storage, with metadata kept in Postgres tables.

## Features

- Browse songs and playlists
- Home sections: Recently listened, Most listened, Songs by artist, All songs
  (Recently listened syncs across devices for logged-in users and stays
  per-device for guests; Most listened uses shared play counts and falls back
  to Last Added until songs have been played)
- Search across title, artist, album, and genre; genre filter chips; artist filter
- Artist / album autocomplete comboboxes when uploading or editing (existing
  entries are reused, new ones are created inline), plus album year, genres,
  and optional featured artists for collaborations (shown as
  "Artist feat. Guest")
- Reuse an already uploaded cover when adding or editing a song, so tracks
  from the same album can share one artwork file instead of duplicating it
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
│   ├── catalog.ts        # artists/albums/genres fetch + ensure, recent plays
│   ├── playlists.ts      # playlist CRUD, copy, add/remove songs
│   ├── types.ts          # Song / Playlist types
│   └── lrc.ts            # LRC parser + karaoke sync helpers
    ├── components/
    │   ├── App.tsx           # data loading + queue state + auth gate
    │   ├── AuthScreen.tsx    # login / register (username + password)
    │   ├── UploadDialog.tsx  # in-app song upload form (logged-in users)
    │   ├── PlaylistDialog.tsx # create / edit playlist (logged-in users)
    │   ├── Home.tsx          # browse songs & playlists
    │   ├── MetadataFields.tsx  # artist/album/year/genre inputs (upload + edit)
    │   ├── ArtworkField.tsx    # artwork upload or reuse an existing cover
    │   ├── ui/combobox.tsx     # autocomplete combobox (cmdk-powered)
    │   ├── ui/skeleton.tsx     # skeleton placeholder
    │   ├── Player.tsx        # audio element + controls
    │   └── LyricsViewer.tsx  # synced karaoke lyrics
    ├── layouts/
    └── pages/
        └── index.astro
```

## Setup

### 1. Configuration

Copy your Supabase URL and anon key into `.env`:

```
PUBLIC_SUPABASE_URL=https://<project>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<anon key>
```


### In-app uploads

Logged-in users can also upload songs directly from the app via the **Upload**
button in the header (audio required; artwork and lyrics optional, as a file
or pasted LRC text). This runs client-side with the anon key. Songs uploaded
this way record the uploading account in `songs.uploaded_by`, and lyric edits
reuse the same storage object so no orphan files pile up. Artwork can also be
reused from any existing song: the new row points at the same storage object,
and replacing a cover only deletes the old file once no other song uses it.

### 2. Run

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

A `<mm:ss.xx>` tag with no text after it (before the next tag or end of
line) ends the previous word, leaving a pause gap. E.g.
`[00:09.00]phrase<00:13.00> <00:16.00>Ah` finishes `phrase` at 13s and
starts `Ah` at 16s.

Multiple timestamps on one line and `[offset:]` metadata are supported. Upcoming
lines are dimmed and centered; the active line is enlarged and filled with color
in time with the singer.
