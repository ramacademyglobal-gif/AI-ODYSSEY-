/**
 * Apply drop_domain migration against the linked Supabase project.
 * Loads backend/.env (never prints secrets).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");
const sqlPath = join(root, "..", "database", "migrations", "drop_domain.sql");

function loadEnv(file) {
  const out = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const env = loadEnv(envPath);
const supabaseUrl = (env.SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || "";
const sql = readFileSync(sqlPath, "utf8");

if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env");
  process.exit(1);
}

const endpoints = [
  `${supabaseUrl}/pg/query`,
  `${supabaseUrl}/pg-meta/default/query`,
];

let lastError = null;

for (const endpoint of endpoints) {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    const text = await response.text();
    if (response.ok) {
      console.log(`Domain columns dropped via ${endpoint.replace(supabaseUrl, "")}`);
      process.exit(0);
    }
    lastError = `${response.status}: ${text.slice(0, 300)}`;
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err);
  }
}

// Fallback: use PostgREST to call a one-shot SQL helper if DATABASE_URL / pg is available.
const databaseUrl = env.DATABASE_URL || env.SUPABASE_DB_URL || env.POSTGRES_URL;
if (databaseUrl) {
  try {
    const { default: pg } = await import("pg");
    const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();
    await client.query(sql);
    await client.end();
    console.log("Domain columns dropped via DATABASE_URL");
    process.exit(0);
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err);
  }
}

console.error("Could not apply drop_domain.sql automatically.");
console.error(lastError || "No usable SQL endpoint.");
console.error("Open Supabase SQL Editor and run: database/migrations/drop_domain.sql");
process.exit(1);
