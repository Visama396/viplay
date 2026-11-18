import type { Dictionary } from "./es";

export const uk = {
  "common.close": "Закрити",
  "common.cancel": "Скасувати",
  "common.by": "від {name}",
  "common.unknown": "Невідомо",
  "common.optional": "(необов'язково)",
  "common.play": "Відтворити",
  "common.pause": "Пауза",
  "common.delete": "Видалити",
  "common.edit": "Редагувати",
  "common.remove": "Прибрати",
  "common.add": "Додати",
  "common.file": "Файл",
  "common.write": "Написати",
  "common.upload": "Завантажити",
  "common.saving": "Збереження...",
  "common.artworkAlt": "Обкладинка {title}",
  "common.scrollLeft": "Прокрутити ліворуч",
  "common.scrollRight": "Прокрутити праворуч",
  "common.playAll": "Відтворити все",
  "common.songsCount": "Пісні ({count})",
  "common.searchSongs": "Пошук пісень...",

  "home.subtitle": "Огляд пісень і плейлистів",
  "home.upload": "Завантажити",
  "home.searchPlaceholder": "Пошук пісень...",
  "home.clearArtistFilter": "Прибрати фільтр виконавця",
  "home.recentlyListened": "Нещодавно прослухано",
  "home.mostListened": "Найбільше прослухано",
  "home.lastAdded": "Останні додані",
  "home.allSongs": "Усі пісні",
  "home.loadingSong": "Завантаження пісні",
  "home.noSongsFound": "Пісень не знайдено",
  "home.addToPlaylist": "Додати до плейлиста",
  "home.addSongToPlaylist": "Додати {title} до плейлиста",
  "home.noPlaylistsYet": "Плейлистів ще немає",
  "home.newPlaylist": "+ Новий плейлист",
  "home.songCount": {
    one: "{count} пісня",
    few: "{count} пісні",
    many: "{count} пісень",
    other: "{count} пісні",
  },
  "home.plays": {
    one: "{count} прослуховування",
    few: "{count} прослуховування",
    many: "{count} прослуховувань",
    other: "{count} прослуховування",
  },

  "sidebar.close": "Закрити бічну панель",
  "sidebar.genres": "Жанри",
  "sidebar.playlists": "Плейлисти",
  "sidebar.newPlaylist": "Новий плейлист",
  "sidebar.loadingPlaylists": "Завантаження плейлистів",
  "sidebar.noPlaylistsYet": "Плейлистів ще немає",
  "sidebar.songsByArtist": "Пісні за виконавцем",
  "sidebar.all": "Усі",
  "sidebar.account": "Обліковий запис",
  "sidebar.logout": "Вийти",
  "sidebar.login": "Увійти",
  "sidebar.editPlaylistTitle": "Редагувати плейлист",
  "sidebar.copyPlaylistTitle": "Створити копію",
  "sidebar.editPlaylistAria": "Редагувати {name}",
  "sidebar.copyPlaylistAria": "Копіювати {name}",

  "player.seek": "Позиція відтворення",
  "player.expand": "Розгорнути плеєр",
  "player.previous": "Попередня",
  "player.next": "Наступна",
  "player.viewPlaylist": "Переглянути плейлист {name}",
  "player.viewPlaylistSongs": "Переглянути пісні плейлиста",
  "player.shuffleOn": "Перемішування ввімкнено",
  "player.shuffle": "Увімкнути перемішування",
  "player.loopOff": "Повтор вимкнено",
  "player.loopSong": "Повторювати пісню",
  "player.loopPlaylist": "Повторювати плейлист",
  "player.volume": "Гучність",
  "player.backToBrowse": "Назад до огляду",
  "player.browse": "Огляд",
  "player.syncLyrics": "Синхронізувати текст",
  "player.editLyricsFor": "Редагувати текст {title}",
  "player.editLyricsTitle":
    "Редагувати текст під час відтворення",
  "player.edit": "Редагувати",
  "player.editSongTitle": "Редагувати пісню",
  "player.delete": "Видалити",
  "player.deleteSongTitle": "Видалити пісню",

  "lyrics.none": "Текст недоступний",
  "lyrics.unsynced": "Без синхронізації",
  "lyrics.follow": "Стежити за текстом",
  "lyrics.karaoke": "Караоке",
  "lyrics.synced": "Синхронізовано",
  "lyrics.original": "Оригінал",
  "lyrics.defaultSecondary": "Романізація",

  "lyricsEditor.title": "Редагувати текст",
  "lyricsEditor.back3": "Назад на 3 секунди",
  "lyricsEditor.forward3": "Уперед на 3 секунди",
  "lyricsEditor.stampLine": "Позначити рядок",
  "lyricsEditor.stampLineTitle":
    "Встановити позначку часу поточного рядка на час відтворення (Alt+T)",
  "lyricsEditor.insertWordTag": "Вставити позначку слова",
  "lyricsEditor.insertWordTagTitle":
    "Вставити тег <mm:ss.xx> на рівні слова в позиції курсора (Alt+W)",
  "lyricsEditor.line": "Рядок {number}",
  "lyricsEditor.timed": "з позначкою",
  "lyricsEditor.noTimestamp": "без позначки часу",
  "lyricsEditor.jumpToLine": "Перейти до рядка",
  "lyricsEditor.aria": "Текст у форматі LRC",
  "lyricsEditor.placeholder":
    "[00:12.34]Перший рядок\n[00:18.90]Другий рядок",
  "lyricsEditor.help":
    "Відтворіть пісню й натисніть Позначити рядок, щоб переписати позначку часу поточного рядка. Вставити позначку слова додає <mm:ss.xx> у позицію курсора для караоке-синхронізації.",
  "lyricsEditor.discard":
    "Відкинути незбережені зміни тексту?",
  "lyricsEditor.save": "Зберегти текст",

  "playlistView.songs": "Пісні ({count})",
  "playlistView.empty": "У цьому плейлисті ще немає пісень.",
  "playlistView.nowPlaying": "Відтворюється {title}",
  "playlistView.playSong": "Відтворити {title}",

  "playlistDialog.newTitle": "Новий плейлист",
  "playlistDialog.editTitle": "Редагувати плейлист",
  "playlistDialog.nameLabel": "Назва *",
  "playlistDialog.descriptionLabel": "Опис",
  "playlistDialog.namePlaceholder": "Мій плейлист",
  "playlistDialog.optionalPlaceholder": "Необов'язково",
  "playlistDialog.public":
    "Публічний — інші можуть бачити й відтворювати",
  "playlistDialog.private": "Приватний — бачите лише ви",
  "playlistDialog.create": "Створити плейлист",
  "playlistDialog.creating": "Створення...",
  "playlistDialog.loading": "Завантаження плейлиста...",
  "playlistDialog.saveDetails": "Зберегти деталі",
  "playlistDialog.noSongs":
    "Пісень ще немає — додайте нижче.",
  "playlistDialog.removeSongAria": "Прибрати {title}",
  "playlistDialog.addSongs": "Додати пісні",
  "playlistDialog.noSongsAvailable": "Немає доступних пісень",
  "playlistDialog.allSongsAdded": "Усі пісні вже додані",
  "playlistDialog.makeCopy": "Створити копію",
  "playlistDialog.deleteConfirm": "Видалити плейлист \"{name}\"?",

  "upload.title": "Завантажити пісню",
  "upload.uploadingFiles": "Завантаження файлів...",
  "upload.titleLabel": "Назва *",
  "upload.songTitlePlaceholder": "Назва пісні",
  "upload.audioFile": "Аудіофайл *",
  "upload.lyricsLabel": "Текст",
  "upload.lrcPlaceholder": "[00:12.50]Привіт",
  "upload.lrcHelp":
    "Формат LRC, напр. [00:12.50]Привіт. Залиште порожнім, якщо тексту немає.",
  "upload.lyricsFile": "Текст (.lrc)",
  "upload.secondary": "Додатковий текст",
  "upload.secondaryHint":
    "(необов'язково — напр., романізація, транслітерація)",
  "upload.buttonLabel": "Напис на кнопці",
  "upload.romanizedPlaceholder": "Романізація",
  "upload.secondaryPlaceholder":
    "[00:12.50]Романізований текст...",
  "upload.secondaryHelp":
    "Ті самі позначки часу LRC, що й в оригіналі, але іншим письмом.",
  "upload.uploading": "Завантаження...",
  "upload.submit": "Завантажити пісню",

  "edit.title": "Редагувати пісню",
  "edit.artworkReplace": "Обкладинка (замінити)",
  "edit.lyricsLabel": "Текст",
  "edit.lrcPlaceholder": "[mm:ss.xx]Рядок 1\n[mm:ss.xx]Рядок 2",
  "edit.lrcHelp":
    "Формат LRC — один рядок на позначку часу, напр. [00:12.50]Привіт. Порожнє поле очищає текст. Щоб синхронізувати позначки під час прослуховування, використовуйте Синхронізувати текст у плеєрі.",
  "edit.currentKept": "Поточний текст буде збережено.",
  "edit.secondary": "Додатковий текст",
  "edit.secondaryHint": "(романізація / транслітерація)",
  "edit.buttonLabel": "Напис на кнопці",
  "edit.romanizedPlaceholder": "Романізація",
  "edit.secondaryPlaceholder":
    "[mm:ss.xx]Романізований рядок 1\n[mm:ss.xx]Романізований рядок 2",
  "edit.secondaryHelp":
    "Ті самі позначки часу, що й в оригіналі, іншим письмом. Порожнє поле очищає додатковий текст.",
  "edit.currentSecondaryKept":
    "Поточний додатковий текст буде збережено.",
  "edit.saveChanges": "Зберегти зміни",

  "artwork.label": "Обкладинка",
  "artwork.upload": "Завантажити",
  "artwork.useExisting": "Використати наявну",
  "artwork.currentKept": "Поточна обкладинка буде збережена.",
  "artwork.searchPlaceholder":
    "Пошук обкладинок цього виконавця за піснею або альбомом...",
  "artwork.noMatches":
    "Жодна обкладинка цього виконавця не відповідає пошуку.",
  "artwork.useCoverAria": "Використати обкладинку {credit}",
  "artwork.reused":
    "Цю обкладинку буде використано повторно — новий файл не завантажується.",

  "metadata.artist": "Виконавець *",
  "metadata.artistPlaceholder": "Ім'я виконавця",
  "metadata.searchArtists": "Пошук виконавців...",
  "metadata.newArtist": "Новий виконавець \"{name}\"",
  "metadata.album": "Альбом",
  "metadata.albumPlaceholder": "Альбом (необов'язково)",
  "metadata.searchAlbums": "Пошук альбомів...",
  "metadata.newAlbum": "Новий альбом \"{name}\"",
  "metadata.featured": "Запрошені виконавці",
  "metadata.optional": "(необов'язково)",
  "metadata.addFeatured": "Додати запрошеного виконавця...",
  "metadata.feat": "feat. {name}",
  "metadata.removeFeatured":
    "Прибрати запрошеного виконавця {name}",
  "metadata.albumYear": "Рік альбому",
  "metadata.yearPlaceholder": "напр. 2024",
  "metadata.addGenre": "Додати жанр",
  "metadata.genrePlaceholder": "Введіть або виберіть жанр...",
  "metadata.searchGenres": "Пошук жанрів...",
  "metadata.newGenre": "Новий жанр \"{name}\"",
  "metadata.suggested": "Запропоновані жанри",
  "metadata.fromAlbum": "з інших пісень цього альбому",
  "metadata.fromArtist": "з пісень цього виконавця",
  "metadata.addAll": "Додати всі",
  "metadata.removeGenre": "Прибрати жанр {name}",

  "account.title": "Обліковий запис",
  "account.usernameNote":
    "(ім'я користувача змінити не можна)",
  "account.displayName": "Відображуване ім'я",
  "account.displayNameHelp":
    "Показується як ім'я автора ваших плейлистів.",
  "account.displayNamePlaceholder": "Як вас бачать інші",
  "account.saveDisplayName": "Зберегти ім'я",
  "account.displayNameUpdated": "Відображуване ім'я оновлено.",
  "account.language": "Мова",
  "account.languageHelp": "Застосовується на всіх ваших пристроях.",
  "account.languageUpdated": "Мову оновлено.",
  "account.changePassword": "Змінити пароль",
  "account.changePasswordHelp":
    "На інших пристроях буде виконано вихід.",
  "account.newPassword": "Новий пароль",
  "account.confirmPassword": "Підтвердити новий пароль",
  "account.updatePassword": "Оновити пароль",
  "account.updating": "Оновлення...",
  "account.passwordMin":
    "Новий пароль має містити щонайменше 4 символи",
  "account.passwordMismatch": "Паролі не збігаються",
  "account.passwordUpdated":
    "Пароль оновлено. На інших пристроях виконано вихід.",
  "account.passwordUpdatedPartial":
    "Пароль оновлено, але не вдалося виконати вихід на інших пристроях.",

  "auth.welcome":
    "З поверненням. Увійдіть, щоб керувати плейлистами.",
  "auth.noEmailCreate":
    "Пошта не потрібна. Створіть обліковий запис.",
  "auth.login": "Увійти",
  "auth.register": "Зареєструватися",
  "auth.username": "Ім'я користувача",
  "auth.usernamePlaceholder": "Введіть ім'я користувача",
  "auth.displayName": "Відображуване ім'я",
  "auth.displayNamePlaceholder": "Як вас бачать інші",
  "auth.password": "Пароль",
  "auth.passwordPlaceholder": "Введіть пароль",
  "auth.createAccount": "Створити обліковий запис",
  "auth.somethingWrong": "Щось пішло не так",
  "auth.noEmailNote":
    "Пошта не потрібна. Не забудьте пароль!",

  "errors.generic": "Щось пішло не так",
  "errors.usernameLength":
    "Ім'я користувача має містити від 3 до 16 символів",
  "errors.passwordMin":
    "Пароль має містити щонайменше 4 символи",
  "errors.usernameChars":
    "Ім'я користувача може містити лише малі латинські літери, цифри та підкреслення",
  "errors.usernameTaken": "Це ім'я користувача вже зайняте",
  "errors.createAccount":
    "Не вдалося створити обліковий запис",
  "errors.createProfile": "Не вдалося створити профіль",
  "errors.invalidCredentials":
    "Неправильне ім'я користувача або пароль",
  "errors.emailNotConfirmed":
    "Пошту облікового запису не підтверджено. Supabase Auth вимагає підтвердження в цьому проєкті.",
  "errors.loadProfile": "Не вдалося завантажити профіль",
  "errors.displayNameEmpty":
    "Відображуване ім'я не може бути порожнім",
  "errors.displayNameLength":
    "Відображуване ім'я має містити не більше 20 символів",
  "errors.updateDisplayName":
    "Не вдалося оновити відображуване ім'я",
  "errors.playlistNameRequired": "Назва обов'язкова",
  "errors.playlistOwnerEdit":
    "Лише творець може редагувати цей плейлист",
  "errors.playlistOwnerDelete":
    "Лише творець може видалити цей плейлист",
  "errors.songAlreadyInPlaylist":
    "Пісня вже є в цьому плейлисті",
  "errors.titleArtistRequired":
    "Назва й виконавець обов'язкові",
  "errors.audioRequired": "Потрібен аудіофайл",
  "errors.songNotFound": "Пісню не знайдено",
  "errors.deletePermission":
    "У вас немає дозволу видаляти пісні",
  "errors.createPlaylist": "Не вдалося створити плейлист",
  "errors.copyPlaylist": "Не вдалося скопіювати плейлист",
  "errors.updateLanguage": "Не вдалося зберегти мову",
  "errors.uploadAudio":
    "Не вдалося завантажити аудіо: {message}",
  "errors.uploadArtwork":
    "Не вдалося завантажити обкладинку: {message}",
  "errors.uploadLyrics":
    "Не вдалося завантажити текст: {message}",
  "errors.saveLyrics": "Не вдалося зберегти текст: {message}",
  "errors.uploadSecondary":
    "Не вдалося завантажити додатковий текст: {message}",
  "errors.saveSecondary":
    "Не вдалося зберегти додатковий текст: {message}",
  "errors.saveSong": "Не вдалося зберегти пісню: {message}",
  "errors.loadSong": "Не вдалося завантажити пісню: {message}",
} satisfies Dictionary;
