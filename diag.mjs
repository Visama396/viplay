import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log("url set:", !!url, "key set:", !!key, "key head:", (key||"").slice(0,12));

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const res = await supabase.auth.admin.createUser({
  email: "diagtest@app.local",
  password: "DiagPass123",
  email_confirm: true,
});
console.log("FULL createUser response:", JSON.stringify(res, null, 2));
