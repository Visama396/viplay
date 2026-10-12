import { useState } from "react";
import type { Account } from "../lib/auth";
import { login, register } from "../lib/auth";

interface AuthScreenProps {
  onAuth: (account: Account) => void;
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result =
        mode === "register"
          ? await register(username, password, displayName)
          : await login(username, password);

      if (result.error) {
        setError(result.error);
      } else if (result.account) {
        onAuth(result.account);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-zinc-700 bg-zinc-900 py-2 px-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-rose-500";

  return (
    <div className="flex flex-col items-center rounded-2xl bg-zinc-950 px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-white">ViPlay</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {mode === "login"
            ? "Welcome back. Log in to manage playlists."
            : "No email required. Create an account."}
        </p>
      </div>

      <div className="w-full max-w-sm space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              mode === "login"
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              mode === "register"
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().slice(0, 16))}
              placeholder="Enter username"
              required
              className={inputClass}
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 20))}
                placeholder="How others see you"
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs text-zinc-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className={inputClass}
            />
          </div>

          {error && <p className="text-center text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="w-full rounded-xl bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-400 disabled:opacity-50"
          >
            {loading ? "..." : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>

        <p className="text-center text-[11px] text-zinc-500">
          No email required. Don't forget your password!
        </p>
      </div>
    </div>
  );
}
