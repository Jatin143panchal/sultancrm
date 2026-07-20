/**
 * Seed users using publishable key only (no service_role needed).
 * Run: npm run db:seed:public
 */
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

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const USERS = [
   { email: "sultanwellness.owner@gmail.com", password: "SultanWellness@Owner1", name: "Sultan Wellness Owner", role: "owner", company: "SultanWellness" },
  { email: "sultanwellness.admin@gmail.com", password: "SultanWellness@Admin1", name: "Sultan Wellness Admin", role: "admin", company: "SultanWellness" },
  { email: "sultanwellness.hr@gmail.com", password: "SultanWellness@Hr1", name: "Sultan Wellness HR", role: "hr_manager", company: "SultanWellness" },
  { email: "sultanwellness.tl@gmail.com", password: "SultanWellness@Tl1", name: "Sultan Wellness Team Lead", role: "tl", company: "SultanWellness" },
  { email: "sultanwellness.ahmed@gmail.com", password: "SultanWellness@Emp1", name: "Ahmed Khan", role: "employee", company: "SultanWellness" },
  { email: "sultanwellness.fatima@gmail.com", password: "SultanWellness@Emp2", name: "Fatima Noor", role: "employee", company: "SultanWellness" },
  { email: "sultanwellness.omar@gmail.com", password: "SultanWellness@Emp3", name: "Omar Hassan", role: "employee", company: "SultanWellness" },
];

async function ensureUserProfile(

async function main() {
  if (!SUPABASE_URL || !PUBLISHABLE_KEY) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results = [];

  for (const u of USERS) {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: u.email,
      password: u.password,
    });

    if (signInData.user) {
      results.push({ email: u.email, status: "already_exists", id: signInData.user.id });
      await supabase.auth.signOut();
      continue;
    }

    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
      options: { data: { full_name: u.name } },
    });

    if (error) {
      results.push({ email: u.email, status: "error", error: error.message });
    } else {
      results.push({ email: u.email, status: "created", id: data.user?.id });
    }
  }

  console.log(JSON.stringify(results, null, 2));
  console.log("\nLogin accounts ready:");
  USERS.forEach((u) => console.log(`  ${u.email} / ${u.password}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
