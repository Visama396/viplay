/**
 * ViPlay: link existing accounts to their Supabase Auth users.
 *
 * The first migration pass created the Supabase Auth users (they exist and can
 * sign in), but the accounts.auth_id link failed, so the app can't map a login
 * to an accounts row. This script finds each Auth user by its fake email and
 * sets accounts.auth_id.
 *
 * Requires the service role key:
 *   SUPABASE_URL= SUPABASE_SERVICE_ROLE_KEY= bun run scripts/relink-accounts.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const fakeEmail = (username) => `${username}@app.local`;

const { data: accounts, error: fetchErr } = await supabase
  .from("accounts")
  .select("id, username")
  .is("auth_id", null);

if (fetchErr) {
  console.error("Could not fetch accounts:", fetchErr.message);
  process.exit(1);
}

if (!accounts || accounts.length === 0) {
  console.log("No accounts need linking.");
  process.exit(0);
}

// Build an email -> Auth user id map from admin.listUsers.
let usersByEmail = new Map();
let page = null;
do {
  const { data, error } = page
    ? await supabase.auth.admin.listUsers({ page })
    : await supabase.auth.admin.listUsers();
  if (error) {
    console.error("listUsers error:", error.message);
    process.exit(1);
  }
  for (const u of data.users) {
    if (u.email) usersByEmail.set(u.email, u.id);
  }
  page = data.nextPage;
} while (page);

let linked = 0;
for (const acc of accounts) {
  const email = fakeEmail(acc.username);
  const authId = usersByEmail.get(email);

  if (!authId) {
    console.error(`  no Auth user for ${email} — run create first`);
    continue;
  }

  const { error: linkErr } = await supabase
    .from("accounts")
    .update({ auth_id: authId })
    .eq("id", acc.id);

  if (linkErr) {
    console.error(`  failed to link ${acc.username}: ${linkErr.message}`);
    continue;
  }

  console.log(`  linked ${acc.username} -> ${authId}`);
  linked++;
}

console.log(`Done. Linked ${linked} account(s).`);
