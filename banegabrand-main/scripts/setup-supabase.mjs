/**
 * Run with service role key:
 *   $env:SUPABASE_SERVICE_ROLE_KEY="your-key"; node scripts/setup-supabase.mjs
 *
 * Or add SUPABASE_SERVICE_ROLE_KEY to .env (do not commit)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://joxgjpkuwwalxhxugejg.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const USERS = [
  { email: "banegabrand.owner@gmail.com", password: "BanegaBrand@Owner1", name: "BanegaBrand Owner", role: "owner" },
  { email: "banegabrand.admin@gmail.com", password: "BanegaBrand@Admin1", name: "BanegaBrand Admin", role: "admin" },
  { email: "banegabrand.hr@gmail.com", password: "BanegaBrand@Hr1", name: "BanegaBrand HR", role: "hr_manager" },
  { email: "banegabrand.tl@gmail.com", password: "BanegaBrand@Tl1", name: "BanegaBrand Team Lead", role: "tl" },
  { email: "banegabrand.amit@gmail.com", password: "BanegaBrand@Emp1", name: "Amit Sharma", role: "employee" },
  { email: "banegabrand.priya@gmail.com", password: "BanegaBrand@Emp2", name: "Priya Verma", role: "employee" },
  { email: "banegabrand.raj@gmail.com", password: "BanegaBrand@Emp3", name: "Raj Kumar", role: "employee" },
];

async function seedUsers(supabase) {
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const results = [];

  for (const u of USERS) {
    const found = existingUsers.users.find((x) => x.email?.toLowerCase() === u.email.toLowerCase());
    let userId = found?.id;

    if (found) {
      await supabase.auth.admin.updateUserById(found.id, {
        password: u.password,
        email_confirm: true,
      });
      await supabase.from("profiles").update({ display_name: u.name }).eq("user_id", found.id);
      results.push({ email: u.email, status: "updated", role: u.role });
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.name },
      });
      if (error) {
        results.push({ email: u.email, error: error.message });
        continue;
      }
      userId = data.user?.id;
      results.push({ email: u.email, status: "created", role: u.role });
    }

    if (userId) {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      if (!roles?.some((r) => r.role === u.role)) {
        await supabase.from("user_roles").insert({ user_id: userId, role: u.role });
      }
    }
  }

  return results;
}

async function main() {
  if (!SERVICE_KEY) {
    console.error("\nMissing SUPABASE_SERVICE_ROLE_KEY.");
    console.error("Get it from: Supabase Dashboard → Project Settings → API → service_role");
    console.error("\nPowerShell:");
    console.error('  $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."; node scripts/setup-supabase.mjs seed');
    console.error("\nFor migrations, run SQL in Dashboard → SQL Editor:");
    console.error("  supabase/RUN_PENDING_MIGRATIONS.sql\n");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const mode = process.argv[2] || "seed";

  if (mode === "seed") {
    console.log("Seeding users...");
    const results = await seedUsers(supabase);
    console.log(JSON.stringify(results, null, 2));
    console.log("\nDone! Login accounts:");
    USERS.forEach((u) => console.log(`  ${u.role.padEnd(12)} ${u.email} / ${u.password}`));
  } else {
    console.error("Usage: node scripts/setup-supabase.mjs seed");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
