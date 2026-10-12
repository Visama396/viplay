/**
 * ViPlay: migrate pre-existing accounts to Supabase Auth.
 *
 * Pre-Auth accounts (created with the old custom SHA-256 password_hash system)
 * have no corresponding Supabase Auth user, so they can't log in through
 * supabase.auth.signInWithPassword. This script creates a Supabase Auth user
 * for each such account and links it via accounts.auth_id.
 *
 * Because the original plaintext passwords are not recoverable, each created
 * user is given the same temporary password (TEMP_PASSWORD env). Log in once,
 * then change it.
 *
 * Requires the service role key:
 *   SUPABASE_URL=https://<project>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role_key> \
 *   TEMP_PASSWORD='ChangeMe!123' \
 *   bun run scripts/migrate-accounts.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const tempPassword = process.env.TEMP_PASSWORD;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
if (!tempPassword) {
  console.error("Missing TEMP_PASSWORD. Set the temporary password for migrated accounts.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const fakeEmail = (username) => `${username}@app.local`;

const { data: accounts, error: fetchErr } = await supabase
  .from("accounts")
  .select("id, username, display_name, auth_id")
  .is("auth_id", null);

if (fetchErr) {
  console.error("Could not fetch accounts:", fetchErr.message);
  process.exit(1);
}

if (!accounts || accounts.length === 0) {
  console.log("No accounts need migration.");
  process.exit(0);
}

let migrated = 0;
for (const acc of accounts) {
  const email = fakeEmail(acc.username);

  const { data: user, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { username: acc.username, display_name: acc.display_name },
  });

  if (createErr) {
    console.error(`  failed to create auth user for ${acc.username}: ${createErr.message}`);
    continue;
  }

  const { error: linkErr } = await supabase
    .from("accounts")
    .update({ auth_id: user.id })
    .eq("id", acc.id);

  if (linkErr) {
    console.error(`  created auth user for ${acc.username} but failed to link: ${linkErr.message}`);
    continue;
  }

  console.log(`  migrated ${acc.username} -> ${user.id}`);
  migrated++;
}

console.log(`Done. Migrated ${migrated} account(s).`);
console.log(`Log in with username + the temporary password, then change it.`);
