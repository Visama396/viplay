import type { Dictionary } from "./es";

export const de = {
  "common.close": "Schließen",
  "common.cancel": "Abbrechen",
  "common.by": "von {name}",
  "common.unknown": "Unbekannt",
  "common.optional": "(optional)",
  "common.play": "Abspielen",
  "common.pause": "Pausieren",
  "common.delete": "Löschen",
  "common.edit": "Bearbeiten",
  "common.remove": "Entfernen",
  "common.add": "Hinzufügen",
  "common.file": "Datei",
  "common.write": "Schreiben",
  "common.upload": "Hochladen",
  "common.saving": "Wird gespeichert...",
  "common.artworkAlt": "Cover von {title}",
  "common.scrollLeft": "Nach links scrollen",
  "common.scrollRight": "Nach rechts scrollen",
  "common.playAll": "Alle abspielen",
  "common.songsCount": "Songs ({count})",
  "common.searchSongs": "Songs suchen...",

  "home.subtitle": "Songs und Playlists entdecken",
  "home.upload": "Hochladen",
  "home.searchPlaceholder": "Songs suchen...",
  "home.clearArtistFilter": "Künstlerfilter entfernen",
  "home.recentlyListened": "Zuletzt gehört",
  "home.mostListened": "Meistgehört",
  "home.lastAdded": "Zuletzt hinzugefügt",
  "home.allSongs": "Alle Songs",
  "home.loadingSong": "Song wird geladen",
  "home.noSongsFound": "Keine Songs gefunden",
  "home.addToPlaylist": "Zu Playlist hinzufügen",
  "home.addSongToPlaylist": "{title} zu einer Playlist hinzufügen",
  "home.noPlaylistsYet": "Noch keine Playlists",
  "home.newPlaylist": "+ Neue Playlist",
  "home.songCount": {
    one: "{count} Song",
    other: "{count} Songs",
  },
  "home.plays": {
    one: "{count} Wiedergabe",
    other: "{count} Wiedergaben",
  },

  "sidebar.close": "Seitenleiste schließen",
  "sidebar.genres": "Genres",
  "sidebar.playlists": "Playlists",
  "sidebar.newPlaylist": "Neue Playlist",
  "sidebar.loadingPlaylists": "Playlists werden geladen",
  "sidebar.noPlaylistsYet": "Noch keine Playlists",
  "sidebar.songsByArtist": "Songs nach Künstler",
  "sidebar.all": "Alle",
  "sidebar.account": "Konto",
  "sidebar.logout": "Abmelden",
  "sidebar.login": "Anmelden",
  "sidebar.editPlaylistTitle": "Playlist bearbeiten",
  "sidebar.copyPlaylistTitle": "Kopie erstellen",
  "sidebar.editPlaylistAria": "{name} bearbeiten",
  "sidebar.copyPlaylistAria": "{name} kopieren",

  "player.seek": "Position wählen",
  "player.expand": "Player vergrößern",
  "player.previous": "Zurück",
  "player.next": "Weiter",
  "player.viewPlaylist": "Playlist {name} anzeigen",
  "player.viewPlaylistSongs": "Songs der Playlist anzeigen",
  "player.shuffleOn": "Zufallswiedergabe an",
  "player.shuffle": "Zufallswiedergabe aktivieren",
  "player.loopOff": "Wiederholung aus",
  "player.loopSong": "Song wiederholen",
  "player.loopPlaylist": "Playlist wiederholen",
  "player.volume": "Lautstärke",
  "player.backToBrowse": "Zurück zum Entdecken",
  "player.browse": "Entdecken",
  "player.syncLyrics": "Songtext synchronisieren",
  "player.editLyricsFor": "Songtext für {title} bearbeiten",
  "player.editLyricsTitle":
    "Songtext während der Wiedergabe bearbeiten",
  "player.edit": "Bearbeiten",
  "player.editSongTitle": "Song bearbeiten",
  "player.delete": "Löschen",
  "player.deleteSongTitle": "Song löschen",

  "lyrics.none": "Kein Songtext verfügbar",
  "lyrics.unsynced": "Nicht synchronisiert",
  "lyrics.follow": "Songtext folgen",
  "lyrics.karaoke": "Karaoke",
  "lyrics.synced": "Synchronisiert",
  "lyrics.original": "Original",
  "lyrics.defaultSecondary": "Romanisiert",

  "lyricsEditor.title": "Songtext bearbeiten",
  "lyricsEditor.back3": "3 Sekunden zurück",
  "lyricsEditor.forward3": "3 Sekunden vor",
  "lyricsEditor.stampLine": "Zeile stempeln",
  "lyricsEditor.stampLineTitle":
    "Zeitstempel der aktuellen Zeile auf die Wiedergabezeit setzen (Alt+T)",
  "lyricsEditor.insertWordTag": "Wort-Tag einfügen",
  "lyricsEditor.insertWordTagTitle":
    "Ein <mm:ss.xx>-Tag auf Wortebene an der Cursorposition einfügen (Alt+W)",
  "lyricsEditor.line": "Zeile {number}",
  "lyricsEditor.timed": "gestempelt",
  "lyricsEditor.noTimestamp": "kein Zeitstempel",
  "lyricsEditor.jumpToLine": "Zur Zeile springen",
  "lyricsEditor.aria": "Songtext im LRC-Format",
  "lyricsEditor.placeholder":
    "[00:12.34]Erste Zeile\n[00:18.90]Zweite Zeile",
  "lyricsEditor.help":
    "Spiele den Song ab und drücke Zeile stempeln, um den Zeitstempel der aktuellen Zeile neu zu schreiben. Wort-Tag einfügen setzt ein <mm:ss.xx> an der Cursorposition für Karaoke-Timing.",
  "lyricsEditor.discard":
    "Nicht gespeicherte Änderungen am Songtext verwerfen?",
  "lyricsEditor.save": "Songtext speichern",

  "playlistView.songs": "Songs ({count})",
  "playlistView.empty": "Diese Playlist hat noch keine Songs.",
  "playlistView.nowPlaying": "{title} wird abgespielt",
  "playlistView.playSong": "{title} abspielen",

  "playlistDialog.newTitle": "Neue Playlist",
  "playlistDialog.editTitle": "Playlist bearbeiten",
  "playlistDialog.nameLabel": "Name *",
  "playlistDialog.descriptionLabel": "Beschreibung",
  "playlistDialog.namePlaceholder": "Meine Playlist",
  "playlistDialog.optionalPlaceholder": "Optional",
  "playlistDialog.public":
    "Öffentlich — andere können sie sehen und abspielen",
  "playlistDialog.private": "Privat — nur du kannst sie sehen",
  "playlistDialog.create": "Playlist erstellen",
  "playlistDialog.creating": "Wird erstellt...",
  "playlistDialog.loading": "Playlist wird geladen...",
  "playlistDialog.saveDetails": "Details speichern",
  "playlistDialog.noSongs":
    "Noch keine Songs — füge unten welche hinzu.",
  "playlistDialog.removeSongAria": "{title} entfernen",
  "playlistDialog.addSongs": "Songs hinzufügen",
  "playlistDialog.noSongsAvailable": "Keine Songs verfügbar",
  "playlistDialog.allSongsAdded":
    "Alle Songs sind bereits hinzugefügt",
  "playlistDialog.makeCopy": "Kopie erstellen",
  "playlistDialog.deleteConfirm": "Playlist \"{name}\" löschen?",

  "upload.title": "Song hochladen",
  "upload.uploadingFiles": "Dateien werden hochgeladen...",
  "upload.titleLabel": "Titel *",
  "upload.songTitlePlaceholder": "Songtitel",
  "upload.audioFile": "Audiodatei *",
  "upload.lyricsLabel": "Songtext",
  "upload.lrcPlaceholder": "[00:12.50]Hallo",
  "upload.lrcHelp":
    "LRC-Format, z. B. [00:12.50]Hallo. Leer lassen für keinen Songtext.",
  "upload.lyricsFile": "Songtext (.lrc)",
  "upload.secondary": "Sekundärer Songtext",
  "upload.secondaryHint":
    "(optional — z. B. romanisiert, Transliteration)",
  "upload.buttonLabel": "Button-Beschriftung",
  "upload.romanizedPlaceholder": "Romanisiert",
  "upload.secondaryPlaceholder": "[00:12.50]Romanisierter Text...",
  "upload.secondaryHelp":
    "Dieselben LRC-Zeitstempel wie das Original, aber in einer anderen Schrift.",
  "upload.uploading": "Wird hochgeladen...",
  "upload.submit": "Song hochladen",

  "edit.title": "Song bearbeiten",
  "edit.artworkReplace": "Cover (ersetzen)",
  "edit.lyricsLabel": "Songtext",
  "edit.lrcPlaceholder": "[mm:ss.xx]Zeile 1\n[mm:ss.xx]Zeile 2",
  "edit.lrcHelp":
    "LRC-Format — ein Eintrag pro Zeitstempel, z. B. [00:12.50]Hallo. Leer lassen löscht den Songtext. Um Zeitstempel beim Hören zu synchronisieren, nutze Songtext synchronisieren im Player.",
  "edit.currentKept": "Der aktuelle Songtext bleibt erhalten.",
  "edit.secondary": "Sekundärer Songtext",
  "edit.secondaryHint": "(romanisiert / Transliteration)",
  "edit.buttonLabel": "Button-Beschriftung",
  "edit.romanizedPlaceholder": "Romanisiert",
  "edit.secondaryPlaceholder":
    "[mm:ss.xx]Romanisierte Zeile 1\n[mm:ss.xx]Romanisierte Zeile 2",
  "edit.secondaryHelp":
    "Dieselben Zeitstempel wie das Original, andere Schrift. Leer lassen löscht den sekundären Songtext.",
  "edit.currentSecondaryKept":
    "Der aktuelle sekundäre Songtext bleibt erhalten.",
  "edit.saveChanges": "Änderungen speichern",

  "artwork.label": "Cover",
  "artwork.upload": "Hochladen",
  "artwork.useExisting": "Vorhandenes verwenden",
  "artwork.currentKept": "Das aktuelle Cover bleibt erhalten.",
  "artwork.searchPlaceholder":
    "Covers dieses Künstlers nach Song oder Album suchen...",
  "artwork.noMatches":
    "Keine Covers dieses Künstlers passen zur Suche.",
  "artwork.useCoverAria": "Cover von {credit} verwenden",
  "artwork.reused":
    "Dieses Cover wird wiederverwendet — es wird keine neue Datei hochgeladen.",

  "metadata.artist": "Künstler *",
  "metadata.artistPlaceholder": "Künstlername",
  "metadata.searchArtists": "Künstler suchen...",
  "metadata.newArtist": "Neuer Künstler \"{name}\"",
  "metadata.album": "Album",
  "metadata.albumPlaceholder": "Album (optional)",
  "metadata.searchAlbums": "Alben suchen...",
  "metadata.newAlbum": "Neues Album \"{name}\"",
  "metadata.featured": "Gastkünstler",
  "metadata.optional": "(optional)",
  "metadata.addFeatured": "Gastkünstler hinzufügen...",
  "metadata.feat": "feat. {name}",
  "metadata.removeFeatured": "Gastkünstler {name} entfernen",
  "metadata.albumYear": "Albumjahr",
  "metadata.yearPlaceholder": "z. B. 2024",
  "metadata.addGenre": "Genre hinzufügen",
  "metadata.genrePlaceholder": "Genre eingeben oder auswählen...",
  "metadata.searchGenres": "Genres suchen...",
  "metadata.newGenre": "Neues Genre \"{name}\"",
  "metadata.suggested": "Vorgeschlagene Genres",
  "metadata.fromAlbum": "aus anderen Songs dieses Albums",
  "metadata.fromArtist": "aus den Songs dieses Künstlers",
  "metadata.addAll": "Alle hinzufügen",
  "metadata.removeGenre": "Genre {name} entfernen",

  "account.title": "Konto",
  "account.usernameNote":
    "(Benutzernamen können nicht geändert werden)",
  "account.displayName": "Anzeigename",
  "account.displayNameHelp":
    "Wird als Autorname bei deinen Playlists angezeigt.",
  "account.displayNamePlaceholder": "So sehen dich andere",
  "account.saveDisplayName": "Anzeigename speichern",
  "account.displayNameUpdated": "Anzeigename aktualisiert.",
  "account.language": "Sprache",
  "account.languageHelp": "Gilt für alle deine Geräte.",
  "account.languageUpdated": "Sprache aktualisiert.",
  "account.changePassword": "Passwort ändern",
  "account.changePasswordHelp":
    "Deine anderen Geräte werden abgemeldet.",
  "account.newPassword": "Neues Passwort",
  "account.confirmPassword": "Neues Passwort bestätigen",
  "account.updatePassword": "Passwort aktualisieren",
  "account.updating": "Wird aktualisiert...",
  "account.passwordMin":
    "Das neue Passwort muss mindestens 4 Zeichen haben",
  "account.passwordMismatch": "Die Passwörter stimmen nicht überein",
  "account.passwordUpdated":
    "Passwort aktualisiert. Die anderen Sitzungen wurden abgemeldet.",
  "account.passwordUpdatedPartial":
    "Passwort aktualisiert, aber die anderen Sitzungen konnten nicht abgemeldet werden.",

  "auth.welcome":
    "Willkommen zurück. Melde dich an, um Playlists zu verwalten.",
  "auth.noEmailCreate": "Keine E-Mail nötig. Erstelle ein Konto.",
  "auth.login": "Anmelden",
  "auth.register": "Registrieren",
  "auth.username": "Benutzername",
  "auth.usernamePlaceholder": "Benutzername eingeben",
  "auth.displayName": "Anzeigename",
  "auth.displayNamePlaceholder": "So sehen dich andere",
  "auth.password": "Passwort",
  "auth.passwordPlaceholder": "Passwort eingeben",
  "auth.createAccount": "Konto erstellen",
  "auth.somethingWrong": "Etwas ist schiefgelaufen",
  "auth.noEmailNote":
    "Keine E-Mail nötig. Vergiss dein Passwort nicht!",

  "errors.generic": "Etwas ist schiefgelaufen",
  "errors.usernameLength":
    "Der Benutzername muss 3–16 Zeichen lang sein",
  "errors.passwordMin":
    "Das Passwort muss mindestens 4 Zeichen haben",
  "errors.usernameChars":
    "Der Benutzername darf nur Kleinbuchstaben, Zahlen und Unterstriche enthalten",
  "errors.usernameTaken":
    "Dieser Benutzername ist bereits vergeben",
  "errors.createAccount": "Konto konnte nicht erstellt werden",
  "errors.createProfile": "Profil konnte nicht erstellt werden",
  "errors.invalidCredentials":
    "Benutzername oder Passwort ist falsch",
  "errors.emailNotConfirmed":
    "Die E-Mail des Kontos ist nicht bestätigt. Supabase Auth verlangt in diesem Projekt eine Bestätigung.",
  "errors.loadProfile": "Profil konnte nicht geladen werden",
  "errors.displayNameEmpty":
    "Der Anzeigename darf nicht leer sein",
  "errors.displayNameLength":
    "Der Anzeigename darf höchstens 20 Zeichen haben",
  "errors.updateDisplayName":
    "Anzeigename konnte nicht aktualisiert werden",
  "errors.playlistNameRequired": "Name ist erforderlich",
  "errors.playlistOwnerEdit":
    "Nur der Ersteller kann diese Playlist bearbeiten",
  "errors.playlistOwnerDelete":
    "Nur der Ersteller kann diese Playlist löschen",
  "errors.songAlreadyInPlaylist":
    "Der Song ist bereits in dieser Playlist",
  "errors.titleArtistRequired":
    "Titel und Künstler sind erforderlich",
  "errors.audioRequired": "Eine Audiodatei ist erforderlich",
  "errors.songNotFound": "Song nicht gefunden",
  "errors.deletePermission":
    "Du hast keine Berechtigung, Songs zu löschen",
  "errors.createPlaylist":
    "Playlist konnte nicht erstellt werden",
  "errors.copyPlaylist": "Playlist konnte nicht kopiert werden",
  "errors.updateLanguage": "Sprache konnte nicht gespeichert werden",
  "errors.uploadAudio":
    "Audio konnte nicht hochgeladen werden: {message}",
  "errors.uploadArtwork":
    "Cover konnte nicht hochgeladen werden: {message}",
  "errors.uploadLyrics":
    "Songtext konnte nicht hochgeladen werden: {message}",
  "errors.saveLyrics":
    "Songtext konnte nicht gespeichert werden: {message}",
  "errors.uploadSecondary":
    "Sekundärer Songtext konnte nicht hochgeladen werden: {message}",
  "errors.saveSecondary":
    "Sekundärer Songtext konnte nicht gespeichert werden: {message}",
  "errors.saveSong":
    "Song konnte nicht gespeichert werden: {message}",
  "errors.loadSong":
    "Song konnte nicht geladen werden: {message}",
} satisfies Dictionary;
