/**
 * One-off: delete all rows from app tables (FK-safe order).
 * Usage: node scripts/wipe-all-tables.mjs
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Delete every row (PostgREST requires a filter). */
async function wipe(table) {
  const { error, count } = await supabase
    .from(table)
    .delete({ count: "exact" })
    .not("id", "is", null);

  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }
  return count ?? 0;
}

const tables = [
  "checkins",
  "team_members",
  "teams",
  "participants",
  "admin_audit_logs",
];

async function main() {
  console.log("Wiping all table rows…");
  for (const table of tables) {
    const deleted = await wipe(table);
    console.log(`  ${table}: deleted ${deleted}`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
