import "server-only";
import { cookies } from "next/headers";
import { run } from "@/lib/db/pg";
import { newId, nowIso } from "@/lib/utils";

export const SESSION_COOKIE = "booklog_session";
const SESSION_DAYS = 30;

export async function createSession(userId: string): Promise<void> {
  const id = newId() + newId().replace(/-/g, ""); // long, opaque token
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  await run("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)", [
    id,
    userId,
    nowIso(),
    expires,
  ]);

  const store = await cookies();
  store.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await run("DELETE FROM sessions WHERE id = $1", [token]);
    store.delete(SESSION_COOKIE);
  }
}
