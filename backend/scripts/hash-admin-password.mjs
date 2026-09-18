/**
 * Usage: node scripts/hash-admin-password.mjs "your-password"
 * Paste the printed hash into ADMIN_PASSWORD_HASH in backend/.env
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const bcrypt = require("bcrypt");

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/hash-admin-password.mjs "your-password"');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
process.stdout.write(`${hash}\n`);
