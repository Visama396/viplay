import { useState } from "react";
import type { Account } from "../lib/auth";
import { changePassword, updateDisplayName } from "../lib/auth";

interface AccountDialogProps {
  account: Account;
  onClose: () => void;
  onAccountUpdated: (account: Account) => void;
}

export default function AccountDialog({ account, onClose, onAccountUpdated }: AccountDialogProps) {
  const [name, setName] = useState(account.display_name);
  const [nameError, setNameError] = useState("");
  const [nameMessage, setNameMessage] = useState("");
  const [nameLoading, setNameLoading] = useState(false);

  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwMessage, setPwMessage] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameError("");
    setNameMessage("");
    setNameLoading(true);
    const result = await updateDisplayName(account.username, name);
    setNameLoading(false);
    if (result.error) {
      setNameError(result.error);
      return;
    }
    if (result.account) {
      onAccountUpdated(result.account);
      setName(result.account.display_name);
      setNameMessage("Display name updated.");
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwMessage("");

    if (next.length < 4) {
      setPwError("New password must be at least 4 characters");
      return;
    }
    if (next !== confirm) {
      setPwError("Passwords do not match");
      return;
    }

    setPwLoading(true);
    const result = await changePassword(next);
    setPwLoading(false);
    if (result.error) {
      setPwError(result.error);
      return;
    }
    setNext("");
    setConfirm("");
    setPwMessage(
      result.othersSignedOut
        ? "Password updated. Other sessions have been signed out."
        : "Password updated, but the other sessions could not be signed out.",
    );
  }

  const inputClass =
    "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-rose-500";

  return (
    <div className="flex max-h-[85vh] flex-col overflow-y-auto rounded-2xl bg-zinc-950 p-6 sm:p-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Account</h2>
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

      <p className="mb-5 truncate text-sm text-zinc-400">
        @{account.username} <span className="text-zinc-600">(usernames can't be changed)</span>
      </p>

      <form onSubmit={handleNameSubmit} className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-200">Display name</h3>
        <p className="-mt-2 text-xs text-zinc-500">
          Shown as the author name on your playlists.
        </p>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Display name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            placeholder="How others see you"
            className={inputClass}
            required
          />
        </div>

        {nameError && <p className="text-center text-sm text-red-400">{nameError}</p>}
        {nameMessage && <p className="text-center text-sm text-emerald-400">{nameMessage}</p>}

        <button
          type="submit"
          disabled={nameLoading || !name.trim() || name.trim() === account.display_name}
          className="w-full rounded-xl bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-400 disabled:opacity-50"
        >
          {nameLoading ? "Saving..." : "Save display name"}
        </button>
      </form>

      <div className="my-6 border-t border-zinc-800" />

      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200">Change password</h3>
        <p className="-mt-2 text-xs text-zinc-500">Your other devices will be signed out.</p>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">New password</label>
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
          <label className="mb-1 block text-xs text-zinc-400">Confirm new password</label>
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
          {pwLoading ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}

