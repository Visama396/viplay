export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  artist_id: string | null;
  album_id: string | null;
  /** Genre names, attached client-side from song_genres. */
  genres?: string[];
  duration: number | null;
  audio_path: string;
  artwork_path: string | null;
  lyrics_path: string | null;
  /** Optional second lyrics track (e.g. romanized/transliterated LRC). */
  secondary_lyrics_path: string | null;
  /** Label for the secondary track shown in the toggle (e.g. "Romanized"). */
  secondary_lyrics_label: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  user_id: string | null;
  is_public: boolean;
  creator_name: string | null;
  created_at: string;
}

export interface PlaylistSong {
  id: string;
  playlist_id: string;
  song_id: string;
  position: number;
}

export interface PlaylistWithSongs extends Playlist {
  songs: Song[];
}

export interface Artist {
  id: string;
  name: string;
  created_at: string;
}

export interface Album {
  id: string;
  title: string;
  artist_id: string | null;
  year: number | null;
  created_at: string;
}

export interface Genre {
  id: string;
  name: string;
  created_at: string;
}
