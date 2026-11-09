export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  artist_id: string | null;
  album_id: string | null;
  /** Genre names, attached client-side from song_genres. */
  genres?: string[];
  /** Additional featured artist names, attached client-side (in credit order). */
  featured_artists?: string[];
  /** Catalog ids of the featured artists, attached client-side. */
  featured_artist_ids?: string[];
  duration: number | null;
  audio_path: string;
  artwork_path: string | null;
  lyrics_path: string | null;
  /** Optional second lyrics track (e.g. romanized/transliterated LRC). */
  secondary_lyrics_path: string | null;
  /** Label for the secondary track shown in the toggle (e.g. "Romanized"). */
  secondary_lyrics_label: string | null;
  uploaded_by: string | null;
  /** How many times the song has been played (0 until 0012 is applied). */
  play_count?: number;
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

/** An artwork file already in storage that can be reused as a song cover. */
export interface ArtworkOption {
  path: string;
  title: string;
  artist: string;
  album: string | null;
}
