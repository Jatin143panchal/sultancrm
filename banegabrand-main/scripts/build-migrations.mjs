#!/usr/bin/env node
/** Builds supabase/RUN_ALL_MIGRATIONS.sql from migration files (sorted by filename). */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "supabase", "migrations");
const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

let sql = "-- Auto-generated: run this in Supabase SQL Editor (Dashboard → SQL → New query)\n\n";
for (const file of files) {
  sql += `-- ========== ${file} ==========\n`;
  sql += readFileSync(join(migrationsDir, file), "utf8");
  sql += "\n\n";
}

const out = join(__dirname, "..", "supabase", "RUN_ALL_MIGRATIONS.sql");
writeFileSync(out, sql);
console.log(`Wrote ${files.length} migrations to supabase/RUN_ALL_MIGRATIONS.sql`);
