import { supabase } from "./supabase";

export interface Account {
  id: string;
  username: string;
  display_name: string;
}

// Username is used as a fake email so Supabase Auth works without requiring a
// real email address (same trick as laregion).
const fakeEmail = (username: string) => `${username}@app.local`;

// The app works with accounts.id as the key (songs/playlists reference it), so
// we look up the accounts row linked to the verified auth.uid().
export async function getCurrentAccount(): Promise<Account | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("accounts")
    .select("id, username, display_name")
    .eq("auth_id", user.id)
    .maybeSingle();

  return data ? (data as Account) : null;
}

export async function register(
  username: string,
  password: string,
  displayName?: string,
): Promise<{ account?: Account; error?: string }> {
  const cleanName = username.trim().toLowerCase();
  if (cleanName.length < 3 || cleanName.length > 16) {
    return { error: "Username must be 3-16 characters" };
  }
  if (password.length < 4) {
    return { error: "Password must be at least 4 characters" };
  }
  if (!/^[a-z0-9_]+$/.test(cleanName)) {
    return { error: "Username can only contain lowercase letters, numbers, and underscores" };
  }

  const { data: existing } = await supabase
    .from("accounts")
    .select("id")
    .eq("username", cleanName)
    .maybeSingle();
  if (existing) return { error: "Username already taken" };

  const { data, error } = await supabase.auth.signUp({
    email: fakeEmail(cleanName),
    password,
    options: {
      data: { username: cleanName, display_name: displayName?.trim() || cleanName },
    },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Could not create account" };

  const account = await linkAccount(cleanName, displayName?.trim() || cleanName);
  return account ? { account } : { error: "Could not create profile" };
}

// Supabase hides details behind generic messages, so map the known ones to
// actionable text instead of swallowing them (helps tell "wrong password"
// apart from "account doesn't exist here" or "email not confirmed").
function friendlyAuthError(message?: string): string {
  if (!message) return "Invalid username or password";
  if (/email not confirmed/i.test(message)) {
    return "Account email not confirmed. Supabase Auth requires confirmation for this project.";
  }
  if (/invalid login credentials/i.test(message)) {
    return "Invalid username or password";
  }
  return message;
}

export async function login(
  username: string,
  password: string,
): Promise<{ account?: Account; error?: string }> {
  const cleanName = username.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: fakeEmail(cleanName),
    password,
  });

  if (error || !data.user) return { error: friendlyAuthError(error?.message) };

  const account = await linkAccount(cleanName, cleanName);
  return account ? { account } : { error: "Could not load profile" };
}

// Ensure the accounts row for the authenticated auth.uid() exists and is linked.
async function linkAccount(
  username: string,
  displayName: string,
): Promise<Account | null> {
  const { data, error } = await supabase.rpc("ensure_account_link", {
    p_username: username,
    p_display_name: displayName,
  });
  if (error || !data) return null;
  const acc = data as Account;
  return { id: acc.id, username: acc.username, display_name: acc.display_name };
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function changePassword(newPassword: string): Promise<{ success?: boolean; error?: string }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { success: true };
}

export { fakeEmail };
