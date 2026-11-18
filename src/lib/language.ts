/**
 * Supported UI languages. The default is Spanish; signed-in accounts store
 * their preference so it follows them across devices.
 */
export const LANGUAGES = [
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "gl", label: "Galego" },
  { code: "uk", label: "Українська" },
  { code: "ja", label: "日本語" },
] as const;

export type Language = (typeof LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: Language = "es";

const STORAGE_KEY = "viplay.language";

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((entry) => entry.code === value);
}

/** Last language used in this browser (guests and signed-in users). */
export function readStoredLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isLanguage(raw) ? raw : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function storeLanguage(language: Language): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Private mode / storage full: keep the in-memory choice only.
  }
}
