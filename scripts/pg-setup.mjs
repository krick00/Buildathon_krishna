// Creates the Booklog schema + seed data in a Postgres database.
// Reuses the SQLite schema/seed SQL, transformed to Postgres dialect.
// Usage: DATABASE_URL=postgres://... node scripts/pg-setup.mjs
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { scryptSync, randomBytes } from "node:crypto";
import pg from "pg";

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const sqlPath = resolve(root, "database/booklog_starter_sqlite_schema_and_seed.sql");

function hashPassword(pw) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
const DEMO_PASSWORD = "booklog123";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

// Transform the SQLite schema/seed into Postgres dialect (only two diffs needed).
let sql = readFileSync(sqlPath, "utf8");
sql = sql.replace(/PRAGMA[^;]*;/gi, "");
sql = sql.replace(/DEFAULT CURRENT_TIMESTAMP/gi, "DEFAULT now()::text");

const dropSql = `DROP TABLE IF EXISTS
  activity_events, quotes, likes, book_list_items, book_lists, follows,
  reading_log_tags, tags, reading_logs, user_books, book_authors, authors,
  books, sessions, profiles CASCADE;`;

const useSsl =
  /sslmode=require/i.test(connectionString) || process.env.PGSSL === "require";

const client = new Client({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

await client.connect();
try {
  await client.query(dropSql);
  await client.query(sql);

  const { rows } = await client.query("SELECT id FROM profiles WHERE password_hash IS NULL");
  for (const r of rows) {
    await client.query("UPDATE profiles SET password_hash = $1 WHERE id = $2", [
      hashPassword(DEMO_PASSWORD),
      r.id,
    ]);
  }
  console.log(`Seed users share demo password: "${DEMO_PASSWORD}"`);

  const tables = [
    "profiles", "books", "authors", "user_books", "reading_logs", "tags",
    "follows", "book_lists", "book_list_items", "likes", "activity_events", "quotes",
  ];
  for (const t of tables) {
    const c = await client.query(`SELECT COUNT(*)::int AS n FROM ${t}`);
    console.log(t.padEnd(18), c.rows[0].n);
  }
  console.log("Postgres setup complete.");
} finally {
  await client.end();
}
