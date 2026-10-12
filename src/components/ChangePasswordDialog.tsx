import { useState } from "react";
import { changePassword } from "../lib/auth";

interface ChangePasswordDialogProps {
  onClose: () => void;
  onChanged: () => void;
}

export default function ChangePasswordDialog({ onClose, onChanged }: ChangePasswordDialogProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (next.length < 4) {
      setError("New password must be at least 4 characters");
      return;
    }
    if (next !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    // First re-authenticate with the current password so updateUser is allowed.
    const reauth = await checkCurrentPassword(current);
    if (reauth) {
      setError(reauth);
      setLoading(false);
      return;
    }

    const result = await changePassword(next);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage("Password updated.");
    setTimeout(onChanged, 700);
  }

  const inputClass =
    "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-rose-500";

  return (
    <div className="flex flex-col rounded-2xl bg-zinc-950 p-6 sm:p-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Change password</h2>
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Current password</label>
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={inputClass}
            required
            autoComplete="current-password"
          />
        </div>
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

        {error && <p className="text-center text-sm text-red-400">{error}</p>}
        {message && <p className="text-center text-sm text-emerald-400">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-400 disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}

// Re-authenticate with the current password. Some Supabase Auth configs require
// a recent sign-in before updateUser; this verifies the current password first
// and refreshes the session. Returns an error string or null on success.
async function checkCurrentPassword(current: string): Promise<string | null> {
  const { data: { user } } = await import("../lib/supabase").then((m) => m.supabase.auth.getUser());
  if (!user?.email) return null;

  const { supabase } = await import("../lib/supabase");
  const { error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current,
  });
  if (error) return "Current password is incorrect";
  return null;
}
