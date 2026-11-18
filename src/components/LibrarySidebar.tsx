import type { Account } from "../lib/auth";
import type { ArtistEntry } from "../lib/catalog";
import type { PlaylistWithSongs } from "../lib/types";
import { isPlaylistOwner } from "../lib/playlists";
import { useI18n } from "../lib/i18n";
import { Skeleton } from "./ui/skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";

export interface LibrarySidebarProps {
  allGenres: string[];
  genre: string | null;
  onGenreChange: (genre: string | null) => void;
  playlists: PlaylistWithSongs[];
  loading: boolean;
  account: Account | null;
  onLogin: () => void;
  onLogout: () => void;
  onAccount: () => void;
  onCreatePlaylist: () => void;
  onPlayPlaylist: (playlist: PlaylistWithSongs) => void;
  onManagePlaylist: (playlist: PlaylistWithSongs) => void;
  onCopyPlaylist: (playlist: PlaylistWithSongs) => void;
  artistEntries: ArtistEntry[];
  artistKey: string | null;
  onSelectArtist: (key: string | null) => void;
}

/**
 * Library navigation (genres, playlists, artists, account) shared by the
 * browse view and the song view. It must be rendered inside a SidebarProvider;
 * App owns that provider so both views use the same instance and state.
 */
export default function LibrarySidebar({
  allGenres,
  genre,
  onGenreChange,
  playlists,
  loading,
  account,
  onLogin,
  onLogout,
  onAccount,
  onCreatePlaylist,
  onPlayPlaylist,
  onManagePlaylist,
  onCopyPlaylist,
  artistEntries,
  artistKey,
  onSelectArtist,
}: LibrarySidebarProps) {
  const { t } = useI18n();
  const { isMobile, setOpenMobile } = useSidebar();
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar className="absolute h-full border-zinc-800">
      <SidebarHeader className="shrink-0 flex-row items-center justify-end p-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpenMobile(false)}
          className="rounded-full p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          aria-label={t("sidebar.close")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </SidebarHeader>

      <SidebarContent className="gap-5 overflow-hidden px-4 pt-4 pb-4">
        {allGenres.length > 0 && (
          <SidebarGroup className="min-h-0 flex-1 basis-0 flex-col p-0">
            <SidebarGroupLabel className="mb-3 h-auto shrink-0 px-0 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t("sidebar.genres")}
            </SidebarGroupLabel>
            <SidebarGroupContent className="min-h-0 flex-1 overflow-y-auto pr-1">
              <GenreFilter
                genres={allGenres}
                genre={genre}
                onChange={(next) => {
                  onGenreChange(next);
                  closeOnMobile();
                }}
              />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="min-h-0 flex-1 basis-0 flex-col p-0">
          <div className="mb-3 flex shrink-0 items-center justify-between">
            <SidebarGroupLabel className="h-auto px-0 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t("sidebar.playlists")}
            </SidebarGroupLabel>
            <button
              onClick={() => {
                onCreatePlaylist();
                closeOnMobile();
              }}
              className="rounded-full px-2 py-0.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              aria-label={t("sidebar.newPlaylist")}
              title={t("sidebar.newPlaylist")}
            >
              +
            </button>
          </div>
          <SidebarGroupContent className="min-h-0 flex-1 overflow-y-auto pr-1">
            <SidebarMenu>
              {loading ? (
                <li className="space-y-1" aria-label={t("sidebar.loadingPlaylists")}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="mt-1.5 h-3 w-1/2" />
                      </div>
                      <Skeleton className="ml-2 h-4 w-4 shrink-0" />
                    </div>
                  ))}
                </li>
              ) : (
                playlists.map((pl) => {
                  const owner = isPlaylistOwner(pl, account);
                  return (
                    <SidebarMenuItem key={pl.id}>
                      <div className="group/pl flex w-full items-center gap-1 rounded-lg transition hover:bg-zinc-800/60">
                        <button
                          onClick={() => {
                            onPlayPlaylist(pl);
                            closeOnMobile();
                          }}
                          className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2 text-left"
                        >
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5 truncate text-sm text-zinc-200">
                              {!pl.is_public && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-zinc-500">
                                  <rect x="3" y="11" width="18" height="11" rx="2" />
                                  <path d="M7 11V7a5 5 0 0110 0v4" />
                                </svg>
                              )}
                              <span className="truncate">{pl.name}</span>
                            </span>
                            <span className="block truncate text-[11px] text-zinc-500">
                              {t("common.by", {
                                name: pl.creator_name ?? t("common.unknown"),
                              })}
                            </span>
                          </span>
                          <span className="ml-2 shrink-0 text-xs text-zinc-500">
                            {pl.songs.length}
                          </span>
                        </button>
                        {owner && (
                          <button
                            onClick={() => {
                              onManagePlaylist(pl);
                              closeOnMobile();
                            }}
                            className="shrink-0 rounded-full p-1.5 text-zinc-500 opacity-0 transition hover:bg-zinc-700 hover:text-white group-hover/pl:opacity-100 [@media(hover:none)]:opacity-100"
                            aria-label={t("sidebar.editPlaylistAria", { name: pl.name })}
                            title={t("sidebar.editPlaylistTitle")}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        )}
                        {account && !owner && (
                          <button
                            onClick={() => {
                              onCopyPlaylist(pl);
                              closeOnMobile();
                            }}
                            className="shrink-0 rounded-full p-1.5 text-zinc-500 opacity-0 transition hover:bg-zinc-700 hover:text-white group-hover/pl:opacity-100 [@media(hover:none)]:opacity-100"
                            aria-label={t("sidebar.copyPlaylistAria", { name: pl.name })}
                            title={t("sidebar.copyPlaylistTitle")}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" />
                              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </SidebarMenuItem>
                  );
                })
              )}
              {!loading && playlists.length === 0 && (
                <li className="px-3 text-sm text-zinc-600">{t("sidebar.noPlaylistsYet")}</li>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!loading && artistEntries.length > 0 && (
          <SidebarGroup className="min-h-0 flex-1 basis-0 flex-col p-0">
            <SidebarGroupLabel className="mb-3 h-auto shrink-0 px-0 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t("sidebar.songsByArtist")}
            </SidebarGroupLabel>
            <SidebarGroupContent className="min-h-0 flex-1 overflow-y-auto pr-1">
              <SidebarMenu>
                {artistEntries.map((a) => {
                  const active = a.key === artistKey;
                  return (
                    <SidebarMenuItem key={a.key}>
                      <button
                        onClick={() => {
                          onSelectArtist(active ? null : a.key);
                          closeOnMobile();
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition ${
                          active
                            ? "bg-rose-500/15 text-rose-200"
                            : "text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                            active
                              ? "bg-rose-500/30 text-rose-200"
                              : "bg-rose-500/15 text-rose-300"
                          }`}
                        >
                          {a.name.trim().charAt(0).toUpperCase() || "?"}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm">{a.name}</span>
                        <span className="shrink-0 text-[11px] tabular-nums text-zinc-500">
                          {a.count}
                        </span>
                      </button>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="shrink-0 border-t border-zinc-800 p-4">
        {account ? (
          <div className="flex flex-col gap-2">
            <span className="truncate text-sm font-medium text-zinc-300">
              {account.display_name}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onAccount();
                  closeOnMobile();
                }}
                className="flex-1 rounded-full border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
              >
                {t("sidebar.account")}
              </button>
              <button
                onClick={() => {
                  onLogout();
                  closeOnMobile();
                }}
                className="flex-1 rounded-full border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
              >
                {t("sidebar.logout")}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              onLogin();
              closeOnMobile();
            }}
            className="w-full rounded-full bg-rose-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-rose-400"
          >
            {t("sidebar.login")}
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function GenreFilter({
  genres,
  genre,
  onChange,
}: {
  genres: string[];
  genre: string | null;
  onChange: (genre: string | null) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
          genre === null
            ? "bg-rose-500 text-white"
            : "border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
        }`}
      >
        {t("sidebar.all")}
      </button>
      {genres.map((g) => (
        <button
          key={g}
          onClick={() => onChange(genre === g ? null : g)}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
            genre === g
              ? "bg-rose-500 text-white"
              : "border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
          }`}
        >
          {g}
        </button>
      ))}
    </div>
  );
}
