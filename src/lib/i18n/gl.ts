import type { Dictionary } from "./es";

export const gl = {
  "common.close": "Pechar",
  "common.cancel": "Cancelar",
  "common.by": "por {name}",
  "common.unknown": "Descoñecido",
  "common.optional": "(opcional)",
  "common.play": "Reproducir",
  "common.pause": "Pausar",
  "common.delete": "Eliminar",
  "common.edit": "Editar",
  "common.remove": "Quitar",
  "common.add": "Engadir",
  "common.file": "Ficheiro",
  "common.write": "Escribir",
  "common.upload": "Subir",
  "common.saving": "Gardando...",
  "common.artworkAlt": "Cuberta de {title}",
  "common.scrollLeft": "Desprazar á esquerda",
  "common.scrollRight": "Desprazar á dereita",
  "common.playAll": "Reproducir todo",
  "common.songsCount": "Cancións ({count})",
  "common.searchSongs": "Buscar cancións...",

  "home.subtitle": "Explora cancións e listas",
  "home.upload": "Subir",
  "home.searchPlaceholder": "Buscar cancións...",
  "home.clearArtistFilter": "Quitar filtro de artista",
  "home.recentlyListened": "Escoitado recentemente",
  "home.mostListened": "Máis escoitado",
  "home.lastAdded": "Últimos engadidos",
  "home.allSongs": "Todas as cancións",
  "home.loadingSong": "Cargando canción",
  "home.noSongsFound": "Non se atoparon cancións",
  "home.addToPlaylist": "Engadir á lista",
  "home.addSongToPlaylist": "Engadir {title} a unha lista",
  "home.noPlaylistsYet": "Aínda non hai listas",
  "home.newPlaylist": "+ Nova lista",
  "home.songCount": {
    one: "{count} canción",
    other: "{count} cancións",
  },
  "home.plays": {
    one: "{count} reprodución",
    other: "{count} reproducións",
  },

  "sidebar.close": "Pechar barra lateral",
  "sidebar.genres": "Xéneros",
  "sidebar.playlists": "Listas",
  "sidebar.newPlaylist": "Nova lista",
  "sidebar.loadingPlaylists": "Cargando listas",
  "sidebar.noPlaylistsYet": "Aínda non hai listas",
  "sidebar.songsByArtist": "Cancións por artista",
  "sidebar.all": "Todas",
  "sidebar.account": "Conta",
  "sidebar.logout": "Pechar sesión",
  "sidebar.login": "Iniciar sesión",
  "sidebar.editPlaylistTitle": "Editar lista",
  "sidebar.copyPlaylistTitle": "Facer unha copia",
  "sidebar.editPlaylistAria": "Editar {name}",
  "sidebar.copyPlaylistAria": "Copiar {name}",

  "player.seek": "Buscar posición",
  "player.expand": "Ampliar reprodutor",
  "player.previous": "Anterior",
  "player.next": "Seguinte",
  "player.viewPlaylist": "Ver lista {name}",
  "player.viewPlaylistSongs": "Ver cancións da lista",
  "player.shuffleOn": "Aleatorio activado",
  "player.shuffle": "Activar aleatorio",
  "player.loopOff": "Repetición desactivada",
  "player.loopSong": "Repetir canción",
  "player.loopPlaylist": "Repetir lista",
  "player.volume": "Volume",
  "player.backToBrowse": "Volver a explorar",
  "player.browse": "Explorar",
  "player.syncLyrics": "Sincronizar letra",
  "player.editLyricsFor": "Editar a letra de {title}",
  "player.editLyricsTitle":
    "Editar a letra mentres soa a canción",
  "player.edit": "Editar",
  "player.editSongTitle": "Editar canción",
  "player.delete": "Eliminar",
  "player.deleteSongTitle": "Eliminar canción",

  "lyrics.none": "Non hai letra dispoñible",
  "lyrics.unsynced": "Sen sincronizar",
  "lyrics.follow": "Seguir letra",
  "lyrics.karaoke": "Karaoke",
  "lyrics.synced": "Sincronizada",
  "lyrics.original": "Orixinal",
  "lyrics.defaultSecondary": "Romanizada",

  "lyricsEditor.title": "Editar letra",
  "lyricsEditor.back3": "Retroceder 3 segundos",
  "lyricsEditor.forward3": "Avanzar 3 segundos",
  "lyricsEditor.stampLine": "Marcar liña",
  "lyricsEditor.stampLineTitle":
    "Fixar a marca de tempo da liña actual no tempo de reprodución (Alt+T)",
  "lyricsEditor.insertWordTag": "Inserir marca de palabra",
  "lyricsEditor.insertWordTagTitle":
    "Inserir unha etiqueta <mm:ss.xx> a nivel de palabra no cursor (Alt+W)",
  "lyricsEditor.line": "Liña {number}",
  "lyricsEditor.timed": "sincronizada",
  "lyricsEditor.noTimestamp": "sen marca de tempo",
  "lyricsEditor.jumpToLine": "Ir á liña",
  "lyricsEditor.aria": "Letra en formato LRC",
  "lyricsEditor.placeholder":
    "[00:12.34]Primeira liña\n[00:18.90]Segunda liña",
  "lyricsEditor.help":
    "Reproduce a canción e preme Marcar liña para reescribir a marca de tempo da liña actual. Inserir marca de palabra coloca unha etiqueta <mm:ss.xx> no cursor para a sincronización karaoke.",
  "lyricsEditor.discard":
    "¿Descartar os cambios sen gardar da letra?",
  "lyricsEditor.save": "Gardar letra",

  "playlistView.songs": "Cancións ({count})",
  "playlistView.empty": "Esta lista aínda non ten cancións.",
  "playlistView.nowPlaying": "Reproducindo {title}",
  "playlistView.playSong": "Reproducir {title}",

  "playlistDialog.newTitle": "Nova lista",
  "playlistDialog.editTitle": "Editar lista",
  "playlistDialog.nameLabel": "Nome *",
  "playlistDialog.descriptionLabel": "Descrición",
  "playlistDialog.namePlaceholder": "A miña lista",
  "playlistDialog.optionalPlaceholder": "Opcional",
  "playlistDialog.public":
    "Pública: os demais poden vela e reproducila",
  "playlistDialog.private": "Privada: só ti podes vela",
  "playlistDialog.create": "Crear lista",
  "playlistDialog.creating": "Creando...",
  "playlistDialog.loading": "Cargando lista...",
  "playlistDialog.saveDetails": "Gardar detalles",
  "playlistDialog.noSongs":
    "Aínda non hai cancións: engade algunha abaixo.",
  "playlistDialog.removeSongAria": "Quitar {title}",
  "playlistDialog.addSongs": "Engadir cancións",
  "playlistDialog.noSongsAvailable":
    "Non hai cancións dispoñibles",
  "playlistDialog.allSongsAdded":
    "Todas as cancións xa están engadidas",
  "playlistDialog.makeCopy": "Facer unha copia",
  "playlistDialog.deleteConfirm": "¿Eliminar a lista \"{name}\"?",

  "upload.title": "Subir unha canción",
  "upload.uploadingFiles": "Subindo ficheiros...",
  "upload.titleLabel": "Título *",
  "upload.songTitlePlaceholder": "Título da canción",
  "upload.audioFile": "Ficheiro de audio *",
  "upload.lyricsLabel": "Letra",
  "upload.lrcPlaceholder": "[00:12.50]Ola",
  "upload.lrcHelp":
    "Formato LRC, p. ex. [00:12.50]Ola. Déixao baleiro se non hai letra.",
  "upload.lyricsFile": "Letra (.lrc)",
  "upload.secondary": "Letra secundaria",
  "upload.secondaryHint":
    "(opcional: p. ex., romanizada, transliteración)",
  "upload.buttonLabel": "Etiqueta do botón",
  "upload.romanizedPlaceholder": "Romanizada",
  "upload.secondaryPlaceholder": "[00:12.50]Letra romanizada...",
  "upload.secondaryHelp":
    "As mesmas marcas de tempo LRC que o orixinal, pero noutro alfabeto.",
  "upload.uploading": "Subindo...",
  "upload.submit": "Subir canción",

  "edit.title": "Editar canción",
  "edit.artworkReplace": "Cuberta (substituír)",
  "edit.lyricsLabel": "Letra",
  "edit.lrcPlaceholder": "[mm:ss.xx]Liña 1\n[mm:ss.xx]Liña 2",
  "edit.lrcHelp":
    "Formato LRC: unha liña por marca de tempo, p. ex. [00:12.50]Ola. Se o deixas baleiro, bórrase a letra. Para sincronizar as marcas mentres escoitas, usa Sincronizar letra no reprodutor.",
  "edit.currentKept": "Conservarase a letra actual.",
  "edit.secondary": "Letra secundaria",
  "edit.secondaryHint": "(romanizada / transliteración)",
  "edit.buttonLabel": "Etiqueta do botón",
  "edit.romanizedPlaceholder": "Romanizada",
  "edit.secondaryPlaceholder":
    "[mm:ss.xx]Liña romanizada 1\n[mm:ss.xx]Liña romanizada 2",
  "edit.secondaryHelp":
    "As mesmas marcas de tempo que o orixinal, noutro alfabeto. Se o deixas baleiro, bórrase a letra secundaria.",
  "edit.currentSecondaryKept":
    "Conservarase a letra secundaria actual.",
  "edit.saveChanges": "Gardar cambios",

  "artwork.label": "Cuberta",
  "artwork.upload": "Subir",
  "artwork.useExisting": "Usar existente",
  "artwork.currentKept": "Conservarase a cuberta actual.",
  "artwork.searchPlaceholder":
    "Buscar cubertas deste artista por canción ou álbum...",
  "artwork.noMatches":
    "Ningunha cuberta deste artista coincide coa busca.",
  "artwork.useCoverAria": "Usar a cuberta de {credit}",
  "artwork.reused":
    "Reutilizarase esta cuberta: non se subirá ningún ficheiro novo.",

  "metadata.artist": "Artista *",
  "metadata.artistPlaceholder": "Nome do artista",
  "metadata.searchArtists": "Buscar artistas...",
  "metadata.newArtist": "Novo artista \"{name}\"",
  "metadata.album": "Álbum",
  "metadata.albumPlaceholder": "Álbum (opcional)",
  "metadata.searchAlbums": "Buscar álbums...",
  "metadata.newAlbum": "Novo álbum \"{name}\"",
  "metadata.featured": "Artistas convidados",
  "metadata.optional": "(opcional)",
  "metadata.addFeatured": "Engadir un artista convidado...",
  "metadata.feat": "feat. {name}",
  "metadata.removeFeatured": "Quitar artista convidado {name}",
  "metadata.albumYear": "Ano do álbum",
  "metadata.yearPlaceholder": "p. ex. 2024",
  "metadata.addGenre": "Engadir xénero",
  "metadata.genrePlaceholder": "Escribe ou escolle un xénero...",
  "metadata.searchGenres": "Buscar xéneros...",
  "metadata.newGenre": "Novo xénero \"{name}\"",
  "metadata.suggested": "Xéneros suxeridos",
  "metadata.fromAlbum": "doutras cancións deste álbum",
  "metadata.fromArtist": "das cancións deste artista",
  "metadata.addAll": "Engadir todos",
  "metadata.removeGenre": "Quitar xénero {name}",

  "account.title": "Conta",
  "account.usernameNote":
    "(os nomes de usuario non se poden cambiar)",
  "account.displayName": "Nome visible",
  "account.displayNameHelp":
    "Móstrase como nome de autor nas túas listas.",
  "account.displayNamePlaceholder": "Como te ven os demais",
  "account.saveDisplayName": "Gardar nome visible",
  "account.displayNameUpdated": "Nome visible actualizado.",
  "account.language": "Idioma",
  "account.languageHelp": "Aplícase a todos os teus dispositivos.",
  "account.languageUpdated": "Idioma actualizado.",
  "account.changePassword": "Cambiar contrasinal",
  "account.changePasswordHelp":
    "Pecharase a sesión nos teus outros dispositivos.",
  "account.newPassword": "Novo contrasinal",
  "account.confirmPassword": "Confirmar novo contrasinal",
  "account.updatePassword": "Actualizar contrasinal",
  "account.updating": "Actualizando...",
  "account.passwordMin":
    "O novo contrasinal debe ter polo menos 4 caracteres",
  "account.passwordMismatch": "Os contrasinais non coinciden",
  "account.passwordUpdated":
    "Contrasinal actualizado. Pechouse a sesión nos outros dispositivos.",
  "account.passwordUpdatedPartial":
    "Contrasinal actualizado, pero non se puido pechar a sesión nos outros dispositivos.",

  "auth.welcome":
    "Benvido de novo. Inicia sesión para xestionar as túas listas.",
  "auth.noEmailCreate": "Non fai falta correo. Crea unha conta.",
  "auth.login": "Iniciar sesión",
  "auth.register": "Rexistrarse",
  "auth.username": "Nome de usuario",
  "auth.usernamePlaceholder": "Introduce o nome de usuario",
  "auth.displayName": "Nome visible",
  "auth.displayNamePlaceholder": "Como te ven os demais",
  "auth.password": "Contrasinal",
  "auth.passwordPlaceholder": "Introduce o contrasinal",
  "auth.createAccount": "Crear conta",
  "auth.somethingWrong": "Algo saíu mal",
  "auth.noEmailNote":
    "Non fai falta correo. ¡Non esquezas o teu contrasinal!",

  "errors.generic": "Algo saíu mal",
  "errors.usernameLength":
    "O nome de usuario debe ter entre 3 e 16 caracteres",
  "errors.passwordMin":
    "O contrasinal debe ter polo menos 4 caracteres",
  "errors.usernameChars":
    "O nome de usuario só pode conter letras minúsculas, números e guións baixos",
  "errors.usernameTaken": "Ese nome de usuario xa está en uso",
  "errors.createAccount": "Non se puido crear a conta",
  "errors.createProfile": "Non se puido crear o perfil",
  "errors.invalidCredentials":
    "Nome de usuario ou contrasinal incorrectos",
  "errors.emailNotConfirmed":
    "O correo da conta non está confirmado. Supabase Auth esixe confirmación neste proxecto.",
  "errors.loadProfile": "Non se puido cargar o perfil",
  "errors.displayNameEmpty":
    "O nome visible non pode estar baleiro",
  "errors.displayNameLength":
    "O nome visible debe ter 20 caracteres ou menos",
  "errors.updateDisplayName":
    "Non se puido actualizar o nome visible",
  "errors.playlistNameRequired": "O nome é obrigatorio",
  "errors.playlistOwnerEdit":
    "Só o creador pode editar esta lista",
  "errors.playlistOwnerDelete":
    "Só o creador pode eliminar esta lista",
  "errors.songAlreadyInPlaylist": "A canción xa está nesta lista",
  "errors.titleArtistRequired":
    "O título e o artista son obrigatorios",
  "errors.audioRequired": "Requírese un ficheiro de audio",
  "errors.songNotFound": "Non se atopou a canción",
  "errors.deletePermission":
    "Non tes permiso para eliminar cancións",
  "errors.createPlaylist": "Non se puido crear a lista",
  "errors.copyPlaylist": "Non se puido copiar a lista",
  "errors.updateLanguage": "Non se puido gardar o idioma",
  "errors.uploadAudio": "Non se puido subir o audio: {message}",
  "errors.uploadArtwork":
    "Non se puido subir a cuberta: {message}",
  "errors.uploadLyrics": "Non se puido subir a letra: {message}",
  "errors.saveLyrics": "Non se puido gardar a letra: {message}",
  "errors.uploadSecondary":
    "Non se puido subir a letra secundaria: {message}",
  "errors.saveSecondary":
    "Non se puido gardar a letra secundaria: {message}",
  "errors.saveSong": "Non se puido gardar a canción: {message}",
  "errors.loadSong": "Non se puido cargar a canción: {message}",
} satisfies Dictionary;
