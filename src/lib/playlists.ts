import { supabase } from "./supabase";
import type { Account } from "./auth";
import type { PlaylistWithSongs } from "./types";

export interface PlaylistInput {
  name: string;
  description?: string;
  isPublic: boolean;
}

export function isPlaylistOwner(
  playlist: { user_id: string | null },
  account: Account | null,
): boolean {
  return account != null && playlist.user_id != null && playlist.user_id === account.id;
}

export async function createPlaylist(
  account: Account,
  input: PlaylistInput,
): Promise<{ id?: string; error?: string }> {
  const name = input.name.trim();
  if (!name) return { error: "Name is required" };

  const { data, error } = await supabase
    .from("playlists")
    .insert({
      name,
      description: input.description?.trim() || null,
      is_public: input.isPublic,
      user_id: account.id,
      creator_name: account.display_name,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id as string };
}

export async function updatePlaylistMeta(
  playlist: { id: string; user_id: string | null },
  account: Account,
  input: PlaylistInput,
): Promise<{ success?: boolean; error?: string }> {
  if (!isPlaylistOwner(playlist, account)) {
    return { error: "Only the creator can edit this playlist" };
  }
  const name = input.name.trim();
  if (!name) return { error: "Name is required" };

  const { error } = await supabase
    .from("playlists")
    .update({
      name,
      description: input.description?.trim() || null,
      is_public: input.isPublic,
    })
    .eq("id", playlist.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deletePlaylist(
  playlist: { id: string; user_id: string | null },
  account: Account,
): Promise<{ success?: boolean; error?: string }> {
  if (!isPlaylistOwner(playlist, account)) {
    return { error: "Only the creator can delete this playlist" };
  }
  const { error } = await supabase.from("playlists").delete().eq("id", playlist.id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function addSongToPlaylist(
  playlist: { id: string; user_id: string | null },
  songId: string,
  account: Account,
): Promise<{ success?: boolean; error?: string }> {
  if (!isPlaylistOwner(playlist, account)) {
    return { error: "Only the creator can edit this playlist" };
  }

  const { data: existing, error: fetchErr } = await supabase
    .from("playlist_songs")
    .select("position")
    .eq("playlist_id", playlist.id)
    .order("position", { ascending: false })
    .limit(1);

  if (fetchErr) return { error: fetchErr.message };
  const nextPosition =
    existing && existing.length > 0 ? (existing[0].position as number) + 1 : 0;

  const { error } = await supabase.from("playlist_songs").insert({
    playlist_id: playlist.id,
    song_id: songId,
    position: nextPosition,
  });

  if (error) {
    if (error.code === "23505") return { error: "Song is already in this playlist" };
    return { error: error.message };
  }
  return { success: true };
}

export async function removeSongFromPlaylist(
  playlist: { id: string; user_id: string | null },
  songId: string,
  account: Account,
): Promise<{ success?: boolean; error?: string }> {
  if (!isPlaylistOwner(playlist, account)) {
    return { error: "Only the creator can edit this playlist" };
  }
  const { error } = await supabase
    .from("playlist_songs")
    .delete()
    .eq("playlist_id", playlist.id)
    .eq("song_id", songId);
  if (error) return { error: error.message };
  return { success: true };
}

/**
 * Copies a visible playlist into a new one owned by `account`. The original
 * is untouched; songs keep their order. Visibility is inherited.
 */
export async function copyPlaylist(
  source: PlaylistWithSongs,
  account: Account,
): Promise<{ id?: string; error?: string }> {
  const { data, error } = await supabase
    .from("playlists")
    .insert({
      name: `${source.name} (copy)`,
      description: source.description,
      is_public: source.is_public,
      user_id: account.id,
      creator_name: account.display_name,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  const newId = data.id as string;

  if (source.songs.length > 0) {
    const { error: songsErr } = await supabase.from("playlist_songs").insert(
      source.songs.map((s, i) => ({
        playlist_id: newId,
        song_id: s.id,
        position: i,
      })),
    );
    if (songsErr) {
      await supabase.from("playlists").delete().eq("id", newId);
      return { error: songsErr.message };
    }
  }

  return { id: newId };
}
