import { useState } from "react";
import type { Account } from "../lib/auth";
import {
  changePassword,
  updateAccountLanguage,
  updateDisplayName,
} from "../lib/auth";
import { LANGUAGES, type Language } from "../lib/language";
import { useI18n } from "../lib/i18n";

interface AccountDialogProps {
  account: Account;
  onClose: () => void;
  onAccountUpdated: (account: Account) => void;
}

export default function AccountDialog({ account, onClose, onAccountUpdated }: AccountDialogProps) {
  const { t, errorText } = useI18n();
  const [name, setName] = useState(account.display_name);
  const [nameError, setNameError] = useState("");
  const [nameMessage, setNameMessage] = useState(false);
  const [nameLoading, setNameLoading] = useState(false);

  const [languageSaving, setLanguageSaving] = useState(false);
  const [languageError, setLanguageError] = useState("");
  const [languageSaved, setLanguageSaved] = useState(false);

  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwMessage, setPwMessage] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameError("");
    setNameMessage(false);
    setNameLoading(true);
    const result = await updateDisplayName(account.username, name);
    setNameLoading(false);
    if (result.error) {
      setNameError(errorText(result.error));
      return;
    }
    if (result.account) {
      onAccountUpdated(result.account);
      setName(result.account.display_name);
      setNameMessage(true);
    }
  }

  async function handleLanguageChange(language: Language) {
    if (language === account.language || languageSaving) return;
    setLanguageError("");
    setLanguageSaved(false);
    setLanguageSaving(true);
    const result = await updateAccountLanguage(language);
    setLanguageSaving(false);
    if (result.error) {
      setLanguageError(errorText(result.error));
      return;
    }
    onAccountUpdated({ ...account, language });
    setLanguageSaved(true);
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwMessage("");

    if (next.length < 4) {
      setPwError(t("account.passwordMin"));
      return;
    }
    if (next !== confirm) {
      setPwError(t("account.passwordMismatch"));
      return;
    }

    setPwLoading(true);
    const result = await changePassword(next);
    setPwLoading(false);
    if (result.error) {
      setPwError(errorText(result.error));
      return;
    }
    setNext("");
    setConfirm("");
    setPwMessage(
      result.othersSignedOut
        ? t("account.passwordUpdated")
        : t("account.passwordUpdatedPartial"),
    );
  }

  const inputClass =
    "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-rose-500";

  return (
    <div className="flex max-h-[85vh] flex-col overflow-y-auto rounded-2xl bg-zinc-950 p-6 sm:p-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{t("account.title")}</h2>
        <button
          onClick={onClose}
          className="text-zinc-500 transition hover:text-white"
          aria-label={t("common.close")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <p className="mb-5 truncate text-sm text-zinc-400">
        @{account.username}{" "}
        <span className="text-zinc-600">{t("account.usernameNote")}</span>
      </p>

      <form onSubmit={handleNameSubmit} className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-200">
          {t("account.displayName")}
        </h3>
        <p className="-mt-2 text-xs text-zinc-500">
          {t("account.displayNameHelp")}
        </p>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">
            {t("account.displayName")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            placeholder={t("account.displayNamePlaceholder")}
            className={inputClass}
            required
          />
        </div>

        {nameError && <p className="text-center text-sm text-red-400">{nameError}</p>}
        {nameMessage && (
          <p className="text-center text-sm text-emerald-400">
            {t("account.displayNameUpdated")}
          </p>
        )}

        <button
          type="submit"
          disabled={nameLoading || !name.trim() || name.trim() === account.display_name}
          className="w-full rounded-xl bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-400 disabled:opacity-50"
        >
          {nameLoading ? t("common.saving") : t("account.saveDisplayName")}
        </button>
      </form>

      <div className="my-6 border-t border-zinc-800" />

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-200">
          {t("account.language")}
        </h3>
        <p className="-mt-2 text-xs text-zinc-500">{t("account.languageHelp")}</p>
        <select
          value={account.language}
          onChange={(e) => void handleLanguageChange(e.target.value as Language)}
          disabled={languageSaving}
          className={inputClass}
        >
          {LANGUAGES.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.label}
            </option>
          ))}
        </select>
        {languageError && (
          <p className="text-center text-sm text-red-400">{languageError}</p>
        )}
        {languageSaved && !languageError && (
          <p className="text-center text-sm text-emerald-400">
            {t("account.languageUpdated")}
          </p>
        )}
      </div>

      <div className="my-6 border-t border-zinc-800" />

      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200">
          {t("account.changePassword")}
        </h3>
        <p className="-mt-2 text-xs text-zinc-500">
          {t("account.changePasswordHelp")}
        </p>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">
            {t("account.newPassword")}
          </label>
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={inputClass}
            required
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">
            {t("account.confirmPassword")}
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
            required
            autoComplete="new-password"
          />
        </div>

        {pwError && <p className="text-center text-sm text-red-400">{pwError}</p>}
        {pwMessage && <p className="text-center text-sm text-emerald-400">{pwMessage}</p>}

        <button
          type="submit"
          disabled={pwLoading}
          className="w-full rounded-xl bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-400 disabled:opacity-50"
        >
          {pwLoading ? t("account.updating") : t("account.updatePassword")}
        </button>
      </form>
    </div>
  );
}

