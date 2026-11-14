import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const envPath = join(__dirname, "..", ".env");
    const text = readFileSync(envPath, "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch { /* ignore */ }
}

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://gzvkbrkracajwizmnzgx.supabase.co";
const PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_bHCzjy6RP516IKSLgSYAbw_vfrITeUY";

console.log("Supabase URL:", SUPABASE_URL);
console.log("Using Publishable Key:", PUBLISHABLE_KEY.slice(0, 15) + "...");

const supabase = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const adminEmail = process.argv[2] || "admin@sultancrm.com";
  const adminPass = process.argv[3] || "SultanAdmin@2026";
  const adminName = process.argv[4] || "Sultan CRM Admin";

  console.log(`\nAttempting to create or check Admin User: ${adminEmail}`);

  // Try signing in first
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPass,
  });

  if (signInData?.user) {
    console.log(`✓ Admin user already exists (User ID: ${signInData.user.id})`);
    return;
  }

  // If login failed, try signing up
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: adminEmail,
    password: adminPass,
    options: {
      data: {
        full_name: adminName,
        role: "admin",
        department: "Management",
      },
    },
  });

  if (signUpErr) {
    console.error("SignUp error:", signUpErr.message);
  } else if (signUpData?.user) {
    console.log(`✓ Admin user successfully created!`);
    console.log(`  User ID: ${signUpData.user.id}`);
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPass}`);
    if (!signUpData.session) {
      console.log(`  (Note: Check if email confirmation is enabled in your Supabase dashboard)`);
    }
  }
}

main().catch(console.error);
