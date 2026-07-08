"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/currentUser";
import { createSession, destroySession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { one, run } from "@/lib/db/pg";
import { newId, nowIso } from "@/lib/utils";
import * as m from "@/lib/db/mutations";
import type { BookStatus, Format, LogStatus, Visibility } from "@/types";

function revalidateCommon() {
  revalidatePath("/", "layout");
}

// ---------------- Auth ----------------

export async function signupAction(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return { error: "Username must be 3–20 chars: lowercase letters, numbers, or _." };
  }
  if (password.length < 6) return { error: "Password must be at least 6 characters." };
  if (!displayName) return { error: "Display name is required." };

  const exists = await one("SELECT 1 FROM profiles WHERE username = $1", [username]);
  if (exists) return { error: "That username is taken." };

  const id = newId();
  const now = nowIso();
  const avatar = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
  await run(
    `INSERT INTO profiles (id, username, display_name, bio, avatar_url, website, is_private, password_hash, created_at, updated_at)
     VALUES ($1, $2, $3, NULL, $4, NULL, 0, $5, $6, $6)`,
    [id, username, displayName, avatar, hashPassword(password), now]
  );

  await createSession(id);
  redirect("/home");
}

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "Enter your username and password." };

  const row = await one<{ id: string; password_hash: string | null }>(
    "SELECT id, password_hash FROM profiles WHERE username = $1",
    [username]
  );

  if (!row || !verifyPassword(password, row.password_hash)) {
    return { error: "Invalid username or password." };
  }

  await createSession(row.id);
  redirect("/home");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

// ---------------- Library ----------------

export async function setStatusAction(formData: FormData) {
  const user = await requireUser();
  const bookId = String(formData.get("bookId") ?? "");
  const status = String(formData.get("status") ?? "") as BookStatus;
  if (!bookId || !status) return { ok: false, error: "Missing book or status" };
  await m.upsertUserBook(user.id, bookId, status);
  revalidateCommon();
  return { ok: true };
}

export async function removeFromLibraryAction(formData: FormData) {
  const user = await requireUser();
  const userBookId = String(formData.get("userBookId") ?? "");
  if (!userBookId) return { ok: false, error: "Missing id" };
  await m.deleteUserBook(user.id, userBookId);
  revalidateCommon();
  return { ok: true };
}

// ---------------- Book import (Open Library) ----------------

export async function importBookAction(formData: FormData) {
  await requireUser();
  const workKey = String(formData.get("workKey") ?? "");
  const title = String(formData.get("title") ?? "");
  if (!workKey || !title) return;

  let authors: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("authors") ?? "[]"));
    if (Array.isArray(parsed)) authors = parsed.map(String);
  } catch {
    authors = [];
  }

  const yearRaw = String(formData.get("firstPublishYear") ?? "").trim();
  const pagesRaw = String(formData.get("pageCount") ?? "").trim();

  const id = await m.importBook({
    workKey,
    title,
    authors,
    coverUrl: String(formData.get("coverUrl") ?? "") || null,
    firstPublishYear: yearRaw ? Number(yearRaw) : null,
    pageCount: pagesRaw ? Number(pagesRaw) : null,
  });

  revalidateCommon();
  redirect(`/book/${id}`);
}

// ---------------- Reading logs ----------------

export async function createLogAction(formData: FormData) {
  const user = await requireUser();
  const bookId = String(formData.get("bookId") ?? "");
  if (!bookId) return { ok: false, error: "Missing book" };

  const status = (String(formData.get("status") ?? "finished") || "finished") as LogStatus;
  const ratingRaw = String(formData.get("rating") ?? "").trim();
  const rating = ratingRaw ? Number(ratingRaw) : null;
  if (rating != null && (Number.isNaN(rating) || rating < 0.5 || rating > 5)) {
    return { ok: false, error: "Rating must be between 0.5 and 5" };
  }
  const progressRaw = String(formData.get("progressPercent") ?? "").trim();
  const progressPercent = progressRaw ? Number(progressRaw) : null;
  if (progressPercent != null && (progressPercent < 0 || progressPercent > 100)) {
    return { ok: false, error: "Progress must be between 0 and 100" };
  }

  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const formatRaw = String(formData.get("format") ?? "").trim();

  await m.createReadingLog(user.id, {
    bookId,
    logDate: String(formData.get("logDate") ?? new Date().toISOString().slice(0, 10)),
    status,
    rating,
    reviewText: String(formData.get("reviewText") ?? ""),
    containsSpoilers: formData.get("containsSpoilers") === "on",
    isReread: formData.get("isReread") === "on",
    progressPercent,
    format: (formatRaw || null) as Format | null,
    visibility: (String(formData.get("visibility") ?? "public") || "public") as Visibility,
    tags,
  });

  revalidateCommon();
  return { ok: true };
}

export async function deleteLogAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const logId = String(formData.get("logId") ?? "");
  if (!logId) return;
  await m.deleteReadingLog(user.id, logId);
  revalidateCommon();
}

// ---------------- Quotes ----------------

export async function createQuoteAction(formData: FormData) {
  const user = await requireUser();
  const bookId = String(formData.get("bookId") ?? "");
  const quoteText = String(formData.get("quoteText") ?? "").trim();
  if (!bookId) return { ok: false, error: "Missing book" };
  if (!quoteText) return { ok: false, error: "Quote text is required" };

  const pageRaw = String(formData.get("page") ?? "").trim();
  const page = pageRaw ? Number(pageRaw) : null;

  await m.createQuote(user.id, {
    bookId,
    quoteText,
    page: page != null && !Number.isNaN(page) ? page : null,
    note: String(formData.get("note") ?? ""),
    visibility: (String(formData.get("visibility") ?? "public") || "public") as Visibility,
  });
  revalidateCommon();
  return { ok: true };
}

export async function deleteQuoteAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const quoteId = String(formData.get("quoteId") ?? "");
  if (!quoteId) return;
  await m.deleteQuote(user.id, quoteId);
  revalidateCommon();
}

// ---------------- Social ----------------

export async function toggleFollowAction(formData: FormData) {
  const user = await requireUser();
  const targetId = String(formData.get("targetId") ?? "");
  const following = formData.get("isFollowing") === "true";
  if (!targetId || targetId === user.id) return { ok: false, error: "Cannot follow" };
  if (following) await m.unfollowUser(user.id, targetId);
  else await m.followUser(user.id, targetId);
  revalidateCommon();
  return { ok: true };
}

export async function toggleLikeAction(formData: FormData) {
  const user = await requireUser();
  const targetType = String(formData.get("targetType") ?? "") as "reading_log" | "list";
  const targetId = String(formData.get("targetId") ?? "");
  const liked = formData.get("liked") === "true";
  if (!targetId || !targetType) return { ok: false, error: "Missing target" };
  if (liked) await m.unlikeTarget(user.id, targetType, targetId);
  else await m.likeTarget(user.id, targetType, targetId);
  revalidateCommon();
  return { ok: true };
}

// ---------------- Lists ----------------

export async function createListAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  await m.createBookList(user.id, {
    title,
    description: String(formData.get("description") ?? ""),
    visibility: (String(formData.get("visibility") ?? "public") || "public") as Visibility,
  });
  revalidateCommon();
}

export async function addBookToListAction(formData: FormData) {
  const user = await requireUser();
  const listId = String(formData.get("listId") ?? "");
  const bookId = String(formData.get("bookId") ?? "");
  if (!listId || !bookId) return { ok: false, error: "Missing list or book" };
  await m.addBookToList(user.id, listId, bookId, String(formData.get("note") ?? ""));
  revalidateCommon();
  return { ok: true };
}

export async function removeBookFromListAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const listItemId = String(formData.get("listItemId") ?? "");
  if (!listItemId) return;
  await m.removeBookFromList(user.id, listItemId);
  revalidateCommon();
}

export async function deleteListAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const listId = String(formData.get("listId") ?? "");
  if (!listId) return;
  await m.deleteBookList(user.id, listId);
  revalidateCommon();
}
