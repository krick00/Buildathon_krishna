import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { one, query } from "@/lib/db/pg";
import { SESSION_COOKIE } from "@/lib/auth/session";
import type { Profile } from "@/types";

export type CurrentUser = Pick<
  Profile,
  "id" | "username" | "display_name" | "avatar_url"
>;

/** Returns the logged-in user, or null if there is no valid session. */
export async function getSessionUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  return one<CurrentUser>(
    `SELECT p.id, p.username, p.display_name, p.avatar_url
     FROM sessions s JOIN profiles p ON p.id = s.user_id
     WHERE s.id = $1 AND (s.expires_at IS NULL OR s.expires_at > $2)`,
    [token, new Date().toISOString()]
  );
}

/** Returns the logged-in user, or redirects to /login. Use on protected pages/actions. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function getAllProfiles(): Promise<CurrentUser[]> {
  return query<CurrentUser>(
    "SELECT id, username, display_name, avatar_url FROM profiles ORDER BY username"
  );
}
