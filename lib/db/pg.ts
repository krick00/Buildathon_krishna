import "server-only";
import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set. See .env.example / README for setup.");
    }
    // Hosted Postgres (Neon/Supabase/Vercel) requires SSL; local Docker does not.
    const useSsl =
      /sslmode=require/i.test(connectionString) ||
      process.env.PGSSL === "require" ||
      (process.env.NODE_ENV === "production" && !/localhost|127\.0\.0\.1/.test(connectionString));

    pool = new Pool({
      connectionString,
      max: 5,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

/** Run a query, return all rows. */
export async function query<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await getPool().query(text, params);
  return res.rows as T[];
}

/** Run a query, return the first row or null. */
export async function one<T = any>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Run a mutation, return the number of affected rows. */
export async function run(text: string, params: unknown[] = []): Promise<number> {
  const res = await getPool().query(text, params);
  return res.rowCount ?? 0;
}
