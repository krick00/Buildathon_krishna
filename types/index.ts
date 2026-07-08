export type BookStatus =
  | "want_to_read"
  | "reading"
  | "read"
  | "paused"
  | "dnf";

export type LogStatus =
  | "started"
  | "progress"
  | "finished"
  | "dnf"
  | "paused"
  | "note";

export type Format =
  | "paperback"
  | "hardcover"
  | "ebook"
  | "audiobook"
  | "library"
  | "arc"
  | "other";

export type Visibility = "public" | "followers" | "private";

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  is_private: number;
  created_at: string;
  updated_at: string;
};

export type Author = { id: string; name: string };

export type Book = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_url: string | null;
  first_publish_year: number | null;
  page_count: number | null;
  language: string | null;
  source: string | null;
  subjects: string | null; // JSON array
  created_at: string;
  updated_at: string;
};

export type BookSearchResult = {
  id: string;
  title: string;
  subtitle: string | null;
  coverUrl: string | null;
  firstPublishYear: number | null;
  authors: Author[];
};

export type UserBook = {
  id: string;
  user_id: string;
  book_id: string;
  status: BookStatus;
  rating: number | null;
  format: Format | null;
  started_at: string | null;
  finished_at: string | null;
  dnf_at: string | null;
  progress_pages: number | null;
  progress_percent: number | null;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
};

export type ReadingLog = {
  id: string;
  user_id: string;
  book_id: string;
  user_book_id: string | null;
  log_date: string;
  started_at: string | null;
  finished_at: string | null;
  status: LogStatus | null;
  rating: number | null;
  review_text: string | null;
  contains_spoilers: number;
  is_reread: number;
  progress_pages: number | null;
  progress_percent: number | null;
  format: Format | null;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
};

export type Tag = { id: string; name: string; slug: string };

export type BookList = {
  id: string;
  user_id: string;
  title: string;
  slug: string | null;
  description: string | null;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
};

export type Quote = {
  id: string;
  user_id: string;
  book_id: string | null;
  quote_text: string;
  page: number | null;
  note: string | null;
  visibility: Visibility;
  created_at: string;
  book: BookSearchResult | null;
  author_names?: string | null;
  actor?: Pick<Profile, "username" | "display_name" | "avatar_url">;
};

export type DiaryEntry = ReadingLog & {
  book: BookSearchResult;
  tags: Tag[];
  author_names: string | null;
};

export type FeedItem = {
  id: string;
  user_id: string;
  event_type: string;
  target_type: string;
  target_id: string;
  book_id: string | null;
  metadata: string | null;
  created_at: string;
  actor: Pick<Profile, "username" | "display_name" | "avatar_url">;
  book: BookSearchResult | null;
  review_text?: string | null;
  rating?: number | null;
  quote_text?: string | null;
};
