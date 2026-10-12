import { useEffect, useMemo, useState } from "react";
import type { Account } from "../lib/auth";
import type { PlaylistWithSongs, Song } from "../lib/types";
import {
  addSongToPlaylist,
  copyPlaylist,
  createPlaylist,
  deletePlaylist,
  removeSongFromPlaylist,
  updatePlaylistMeta,
} from "../lib/playlists";

interface PlaylistDialogProps {
  /** Manage an existing playlist, or the id of one being loaded after create. */
  playlist: PlaylistWithSongs | null;
  /** True when the dialog is in create mode. */
  creating: boolean;
  songs: Song[];
  account: Account;
  onClose: () => void;
  /** Refresh lists. Receives the new playlist id after create/copy. */
  onChanged: (manageId?: string) => void;
  onPlay: (songs: Song[]) => void;
}

export default function PlaylistDialog({
  playlist,
  creating,
  songs,
  account,
  onClose,
  onChanged,
  onPlay,
}: PlaylistDialogProps) {
  const [name, setName] = useState(playlist?.name ?? "");
  const [description, setDescription] = useState(playlist?.description ?? "");
  const [isPublic, setIsPublic] = useState(playlist?.is_public ?? true);
  const [addQuery, setAddQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(playlist?.name ?? "");
    setDescription(playlist?.description ?? "");
    setIsPublic(playlist?.is_public ?? true);
    setError("");
  }, [playlist?.id]);

  const inPlaylist = useMemo(
    () => new Set((playlist?.songs ?? []).map((s) => s.id)),
    [playlist],
  );

  const addCandidates = useMemo(() => {
    const q = addQuery.trim().toLowerCase();
    return songs.filter(
      (s) =>
        !inPlaylist.has(s.id) &&
        (!q ||
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q)),
    );
  }, [songs, inPlaylist, addQuery]);

  async function handleCreate() {
    setSaving(true);
    setError("");
    const res = await createPlaylist(account, { name, description, isPublic });
    setSaving(false);
    if (res.error || !res.id) {
      setError(res.error ?? "Could not create playlist");
      return;
    }
    onChanged(res.id);
  }

  async function handleSaveMeta() {
    if (!playlist) return;
    setSaving(true);
    setError("");
    const res = await updatePlaylistMeta(playlist, account, {
      name,
      description,
      isPublic,
    });
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onChanged();
  }

  async function handleAdd(songId: string) {
    if (!playlist) return;
    setBusy(true);
    setError("");
    const res = await addSongToPlaylist(playlist, songId, account);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onChanged();
  }

  async function handleRemove(songId: string) {
    if (!playlist) return;
    setBusy(true);
    setError("");
    const res = await removeSongFromPlaylist(playlist, songId, account);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onChanged();
  }

  async function handleDelete() {
    if (!playlist) return;
    if (!confirm(`Delete playlist "${playlist.name}"?`)) return;
    setSaving(true);
    setError("");
    const res = await deletePlaylist(playlist, account);
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onChanged();
    onClose();
  }

  async function handleCopy() {
    if (!playlist) return;
    setSaving(true);
    setError("");
    const res = await copyPlaylist(playlist, account);
    setSaving(false);
    if (res.error || !res.id) {
      setError(res.error ?? "Could not copy playlist");
      return;
    }
    onChanged(res.id);
  }

  const inputClass =
    "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-rose-500";

  return (
    <div className="flex max-h-[85vh] flex-col rounded-2xl bg-zinc-950 p-6 sm:p-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          {creating ? "New playlist" : "Edit playlist"}
        </h2>
        <button
          onClick={onClose}
          className="text-zinc-500 transition hover:text-white"
          aria-label="Close"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {creating ? (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              maxLength={120}
              placeholder="My playlist"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              maxLength={200}
              placeholder="Optional"
            />
          </div>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm">
            <span className="text-zinc-300">
              {isPublic ? "Public — others can see and play" : "Private — only you can see"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => setIsPublic((v) => !v)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                isPublic ? "bg-rose-500" : "bg-zinc-700"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                  isPublic ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </label>
          {error && <p className="text-center text-sm text-red-400">{error}</p>}
          <button
            onClick={handleCreate}
            disabled={saving || !name.trim()}
            className="w-full rounded-xl bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-400 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create playlist"}
          </button>
        </div>
      ) : playlist == null ? (
        <p className="py-8 text-center text-sm text-zinc-500">Loading playlist...</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                maxLength={120}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass}
                maxLength={200}
                placeholder="Optional"
              />
            </div>
          </div>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm">
            <span className="text-zinc-300">
              {isPublic ? "Public — others can see and play" : "Private — only you can see"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => setIsPublic((v) => !v)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                isPublic ? "bg-rose-500" : "bg-zinc-700"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                  isPublic ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </label>
          <button
            onClick={handleSaveMeta}
            disabled={saving || !name.trim()}
            className="rounded-xl bg-zinc-800 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save details"}
          </button>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-200">
                Songs ({playlist.songs.length})
              </h3>
              {playlist.songs.length > 0 && (
                <button
                  onClick={() => onPlay(playlist.songs)}
                  className="text-xs font-medium text-rose-400 transition hover:text-rose-300"
                >
                  Play all
                </button>
              )}
            </div>
            {playlist.songs.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-700 px-4 py-6 text-center text-sm text-zinc-500">
                No songs yet — add some below.
              </p>
            ) : (
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                {playlist.songs.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-zinc-800/60"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-zinc-200">{s.title}</div>
                      <div className="truncate text-xs text-zinc-500">{s.artist}</div>
                    </div>
                    <button
                      onClick={() => handleRemove(s.id)}
                      disabled={busy}
                      className="shrink-0 rounded-full px-2 py-1 text-xs text-zinc-500 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
                      aria-label={`Remove ${s.title}`}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-200">Add songs</h3>
            <input
              value={addQuery}
              onChange={(e) => setAddQuery(e.target.value)}
              placeholder="Search songs..."
              className={`${inputClass} mb-2`}
            />
            <ul className="max-h-48 space-y-1 overflow-y-auto">
              {addCandidates.slice(0, 50).map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-zinc-800/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-zinc-200">{s.title}</div>
                    <div className="truncate text-xs text-zinc-500">{s.artist}</div>
                  </div>
                  <button
                    onClick={() => handleAdd(s.id)}
                    disabled={busy}
                    className="shrink-0 rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-200 transition hover:bg-rose-500 hover:text-white disabled:opacity-50"
                  >
                    Add
                  </button>
                </li>
              ))}
              {addCandidates.length === 0 && (
                <li className="px-2 py-4 text-center text-sm text-zinc-600">
                  {songs.length === 0 ? "No songs available" : "All songs already added"}
                </li>
              )}
            </ul>
          </div>

          {error && <p className="text-center text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 border-t border-zinc-800 pt-4">
            <button
              onClick={handleCopy}
              disabled={saving}
              className="flex-1 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white disabled:opacity-50"
            >
              Make a copy
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex-1 rounded-xl border border-red-900 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
