import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { DEFAULT_LANGUAGE, type Language } from "./language";
import { es, type Dictionary, type MessageKey } from "./i18n/es";
import { de } from "./i18n/de";
import { gl } from "./i18n/gl";
import { uk } from "./i18n/uk";
import { ja } from "./i18n/ja";
import type { Vars } from "./i18n/types";

export type Translate = (key: MessageKey, vars?: Vars) => string;

const DICTIONARIES: Record<Language, Dictionary> = {
  es,
  de,
  gl,
  uk,
  ja,
};

const pluralRules = new Map<Language, Intl.PluralRules>();

function pluralCategory(language: Language, count: number): Intl.LDMLPluralRule {
  let rules = pluralRules.get(language);
  if (!rules) {
    rules = new Intl.PluralRules(language);
    pluralRules.set(language, rules);
  }
  return rules.select(count);
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value == null ? match : String(value);
  });
}

/** Resolves a translation for one language. Kept outside React so tests and
 * error helpers can use it without a provider. */
export function translate(
  language: Language,
  key: MessageKey,
  vars?: Vars,
): string {
  const dictionary = DICTIONARIES[language] ?? DICTIONARIES[DEFAULT_LANGUAGE];
  const entry = dictionary[key] ?? DICTIONARIES.es[key];
  if (typeof entry === "string") return interpolate(entry, vars);
  if (!entry) return key;

  const count = typeof vars?.count === "number" ? vars.count : 0;
  const category = pluralCategory(language, count);
  const form =
    category === "zero" || category === "two"
      ? entry.other
      : entry[category] ?? entry.other;
  return interpolate(form, vars);
}

// Backend helpers (auth/playlists/upload) return human-readable English
// strings. Translating the known ones keeps validation and storage errors in
// the user's language without coupling those modules to React.
const ERROR_KEYS: Record<string, MessageKey> = {
  "Username must be 3-16 characters": "errors.usernameLength",
  "Password must be at least 4 characters": "errors.passwordMin",
  "Username can only contain lowercase letters, numbers, and underscores":
    "errors.usernameChars",
  "Username already taken": "errors.usernameTaken",
  "Could not create account": "errors.createAccount",
  "Could not create profile": "errors.createProfile",
  "Invalid username or password": "errors.invalidCredentials",
  "Account email not confirmed. Supabase Auth requires confirmation for this project.":
    "errors.emailNotConfirmed",
  "Could not load profile": "errors.loadProfile",
  "Display name can't be empty": "errors.displayNameEmpty",
  "Display name must be 20 characters or less": "errors.displayNameLength",
  "Could not update display name": "errors.updateDisplayName",
  "Name is required": "errors.playlistNameRequired",
  "Only the creator can edit this playlist": "errors.playlistOwnerEdit",
  "Only the creator can delete this playlist": "errors.playlistOwnerDelete",
  "Song is already in this playlist": "errors.songAlreadyInPlaylist",
  "Title and artist are required": "errors.titleArtistRequired",
  "An audio file is required": "errors.audioRequired",
  "Song not found": "errors.songNotFound",
  "You don't have permission to delete songs": "errors.deletePermission",
  "Could not create playlist": "errors.createPlaylist",
  "Could not copy playlist": "errors.copyPlaylist",
};

const ERROR_PREFIXES: Array<[RegExp, MessageKey]> = [
  [/^Could not upload audio: (.*)$/, "errors.uploadAudio"],
  [/^Could not upload artwork: (.*)$/, "errors.uploadArtwork"],
  [/^Could not upload lyrics: (.*)$/, "errors.uploadLyrics"],
  [/^Could not save lyrics: (.*)$/, "errors.saveLyrics"],
  [
    /^Could not upload secondary lyrics: (.*)$/,
    "errors.uploadSecondary",
  ],
  [
    /^Could not save secondary lyrics: (.*)$/,
    "errors.saveSecondary",
  ],
  [/^Could not save song: (.*)$/, "errors.saveSong"],
  [/^Could not load song: (.*)$/, "errors.loadSong"],
];

export function translateError(
  language: Language,
  message: string | undefined,
): string {
  if (!message) return translate(language, "errors.generic");

  const key = ERROR_KEYS[message];
  if (key) return translate(language, key);

  for (const [pattern, prefixKey] of ERROR_PREFIXES) {
    const match = message.match(pattern);
    if (match) return translate(language, prefixKey, { message: match[1] });
  }

  // Supabase/network messages are already descriptive; leave them untouched
  // rather than replacing useful detail with a generic error.
  return message;
}

interface I18nValue {
  language: Language;
  t: Translate;
  errorText: (message: string | undefined) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  language,
  children,
}: {
  language: Language;
  children: ReactNode;
}) {
  const t = useCallback<Translate>(
    (key, vars) => translate(language, key, vars),
    [language],
  );
  const errorText = useCallback(
    (message: string | undefined) => translateError(language, message),
    [language],
  );

  const value = useMemo<I18nValue>(
    () => ({ language, t, errorText }),
    [language, t, errorText],
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
}
