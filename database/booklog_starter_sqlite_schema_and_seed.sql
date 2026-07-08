PRAGMA foreign_keys = ON;

CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  website TEXT,
  is_private INTEGER NOT NULL DEFAULT 0,
  password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT
);

CREATE TABLE books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  cover_url TEXT,
  first_publish_year INTEGER,
  page_count INTEGER,
  language TEXT,
  source TEXT,
  open_library_work_key TEXT UNIQUE,
  open_library_edition_key TEXT,
  google_books_id TEXT,
  isbn_10 TEXT,
  isbn_13 TEXT,
  subjects TEXT, -- JSON array
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE authors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  open_library_author_key TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE book_authors (
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  author_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (book_id, author_id)
);

CREATE TABLE user_books (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('want_to_read','reading','read','paused','dnf')),
  rating REAL CHECK (rating IS NULL OR (rating >= 0.5 AND rating <= 5.0)),
  format TEXT CHECK (format IS NULL OR format IN ('paperback','hardcover','ebook','audiobook','library','arc','other')),
  started_at TEXT,
  finished_at TEXT,
  dnf_at TEXT,
  progress_pages INTEGER CHECK (progress_pages IS NULL OR progress_pages >= 0),
  progress_percent INTEGER CHECK (progress_percent IS NULL OR (progress_percent >= 0 AND progress_percent <= 100)),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','followers','private')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, book_id)
);

CREATE TABLE reading_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_book_id TEXT REFERENCES user_books(id) ON DELETE SET NULL,
  log_date TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT,
  status TEXT CHECK (status IS NULL OR status IN ('started','progress','finished','dnf','paused','note')),
  rating REAL CHECK (rating IS NULL OR (rating >= 0.5 AND rating <= 5.0)),
  review_text TEXT,
  contains_spoilers INTEGER NOT NULL DEFAULT 0,
  is_reread INTEGER NOT NULL DEFAULT 0,
  progress_pages INTEGER CHECK (progress_pages IS NULL OR progress_pages >= 0),
  progress_percent INTEGER CHECK (progress_percent IS NULL OR (progress_percent >= 0 AND progress_percent <= 100)),
  format TEXT CHECK (format IS NULL OR format IN ('paperback','hardcover','ebook','audiobook','library','arc','other')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','followers','private')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reading_log_tags (
  reading_log_id TEXT NOT NULL REFERENCES reading_logs(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (reading_log_id, tag_id)
);

CREATE TABLE follows (
  follower_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE TABLE book_lists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','followers','private')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, slug)
);

CREATE TABLE book_list_items (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL REFERENCES book_lists(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (list_id, book_id),
  UNIQUE (list_id, position)
);

CREATE TABLE likes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('reading_log','list')),
  target_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, target_type, target_id)
);

CREATE TABLE quotes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
  quote_text TEXT NOT NULL,
  page INTEGER,
  note TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','followers','private')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('book_added','book_started','book_finished','book_dnf','review_created','rating_created','list_created','list_liked','review_liked','quote_added')),
  target_type TEXT NOT NULL CHECK (target_type IN ('book','user_book','reading_log','list','quote')),
  target_id TEXT NOT NULL,
  book_id TEXT REFERENCES books(id) ON DELETE SET NULL,
  metadata TEXT, -- JSON object
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','followers','private')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_open_library_work_key ON books(open_library_work_key);
CREATE INDEX idx_user_books_user_status ON user_books(user_id, status);
CREATE INDEX idx_user_books_book ON user_books(book_id);
CREATE INDEX idx_reading_logs_user_date ON reading_logs(user_id, log_date DESC);
CREATE INDEX idx_reading_logs_book ON reading_logs(book_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_activity_events_created ON activity_events(created_at DESC);
CREATE INDEX idx_activity_events_user_created ON activity_events(user_id, created_at DESC);
CREATE INDEX idx_book_list_items_list_position ON book_list_items(list_id, position);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_quotes_user ON quotes(user_id, created_at DESC);
CREATE INDEX idx_quotes_book ON quotes(book_id);

-- Seed data
INSERT INTO profiles (id, username, display_name, bio, avatar_url, website, is_private, created_at, updated_at) VALUES ('596aa40b-748f-5029-9adf-368efdad82e9', 'maya', 'Maya Rao', 'Reads literary fiction, sci-fi, and books that make ordinary life feel strange.', 'https://api.dicebear.com/8.x/initials/svg?seed=Maya%20Rao', NULL, 0, '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO profiles (id, username, display_name, bio, avatar_url, website, is_private, created_at, updated_at) VALUES ('4552117f-8c50-5328-a2a4-adb331694bc6', 'arjunreads', 'Arjun Mehta', 'Trying to read more short books and fewer productivity threads.', 'https://api.dicebear.com/8.x/initials/svg?seed=Arjun%20Mehta', NULL, 0, '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO profiles (id, username, display_name, bio, avatar_url, website, is_private, created_at, updated_at) VALUES ('e6c33a04-72f5-5e98-9d31-d6a09f7cf2c6', 'lina', 'Lina Kapoor', 'Fantasy, classics, audiobooks, and dramatic five-star rereads.', 'https://api.dicebear.com/8.x/initials/svg?seed=Lina%20Kapoor', NULL, 0, '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO authors (id, name, bio, photo_url, open_library_author_key, created_at, updated_at) VALUES ('29e373a1-7cd5-5690-a74b-9b0c1b415a06', 'Jane Austen', NULL, NULL, '/authors/OL21594A', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO authors (id, name, bio, photo_url, open_library_author_key, created_at, updated_at) VALUES ('82444554-c800-50e1-a27d-0ad1d150347f', 'Mary Shelley', NULL, NULL, '/authors/OL25342A', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO authors (id, name, bio, photo_url, open_library_author_key, created_at, updated_at) VALUES ('482c7488-e53c-5e68-b7f9-bb6ac21fd085', 'George Orwell', NULL, NULL, '/authors/OL118077A', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO authors (id, name, bio, photo_url, open_library_author_key, created_at, updated_at) VALUES ('73886edd-c5de-5bad-949f-dfe108899661', 'Ursula K. Le Guin', NULL, NULL, '/authors/OL31353A', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO authors (id, name, bio, photo_url, open_library_author_key, created_at, updated_at) VALUES ('7fa6d13d-3bdf-5b09-a588-a1ee1b39aa21', 'Octavia E. Butler', NULL, NULL, '/authors/OL26275A', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO authors (id, name, bio, photo_url, open_library_author_key, created_at, updated_at) VALUES ('a3c1fa32-d9e8-516f-88ab-b8c8a52d56be', 'J. R. R. Tolkien', NULL, NULL, '/authors/OL26320A', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO authors (id, name, bio, photo_url, open_library_author_key, created_at, updated_at) VALUES ('15948a91-d53f-5761-8188-964ba54983fa', 'Agatha Christie', NULL, NULL, '/authors/OL27695A', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO authors (id, name, bio, photo_url, open_library_author_key, created_at, updated_at) VALUES ('4c26e192-fff2-545a-9517-c30cf062df7f', 'Kazuo Ishiguro', NULL, NULL, '/authors/OL29764A', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO authors (id, name, bio, photo_url, open_library_author_key, created_at, updated_at) VALUES ('5b0e61e4-312b-54e2-a2c8-560714092694', 'Toni Morrison', NULL, NULL, '/authors/OL28513A', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO authors (id, name, bio, photo_url, open_library_author_key, created_at, updated_at) VALUES ('c7e65ee0-e0bd-5d5a-99b7-4981f62b25ac', 'Andy Weir', NULL, NULL, '/authors/OL711611A', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO authors (id, name, bio, photo_url, open_library_author_key, created_at, updated_at) VALUES ('300a1fc9-5da2-503b-a3e3-72c33b106b65', 'Emily St. John Mandel', NULL, NULL, '/authors/OL6740119A', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO authors (id, name, bio, photo_url, open_library_author_key, created_at, updated_at) VALUES ('4ad32d7f-e034-54b6-bc9b-8764c150a79d', 'Martha Wells', NULL, NULL, '/authors/OL13900A', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO books (id, title, subtitle, description, cover_url, first_publish_year, page_count, language, source, open_library_work_key, open_library_edition_key, google_books_id, isbn_10, isbn_13, subjects, created_at, updated_at) VALUES ('ddd50dbe-7516-5e42-8b7a-67a4189c6af4', 'Pride and Prejudice', NULL, 'A sharp comedy of manners about family, pride, romance, and first impressions.', 'https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg', 1813, 279, 'eng', 'open_library_seed', '/works/OL66554W', NULL, NULL, '0141439513', '9780141439518', '["classics", "romance", "literary-fiction"]', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO books (id, title, subtitle, description, cover_url, first_publish_year, page_count, language, source, open_library_work_key, open_library_edition_key, google_books_id, isbn_10, isbn_13, subjects, created_at, updated_at) VALUES ('8d62ffed-d6ce-5b36-bb87-eff8eb038a76', 'Frankenstein', NULL, 'A gothic novel about creation, responsibility, loneliness, and the cost of ambition.', 'https://covers.openlibrary.org/b/isbn/9780141439471-L.jpg', 1818, 280, 'eng', 'open_library_seed', '/works/OL45072W', NULL, NULL, '0141439475', '9780141439471', '["classics", "gothic", "science-fiction"]', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO books (id, title, subtitle, description, cover_url, first_publish_year, page_count, language, source, open_library_work_key, open_library_edition_key, google_books_id, isbn_10, isbn_13, subjects, created_at, updated_at) VALUES ('1aa95a14-a65c-553a-9632-9d53c108c6ed', 'Nineteen Eighty-Four', NULL, 'A dystopian novel about surveillance, power, propaganda, and resistance.', 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg', 1949, 328, 'eng', 'open_library_seed', '/works/OL1168083W', NULL, NULL, '0451524934', '9780451524935', '["dystopia", "political-fiction", "classics"]', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO books (id, title, subtitle, description, cover_url, first_publish_year, page_count, language, source, open_library_work_key, open_library_edition_key, google_books_id, isbn_10, isbn_13, subjects, created_at, updated_at) VALUES ('6ada9624-61d0-5ab5-af85-5d1787c5b295', 'The Left Hand of Darkness', NULL, 'A science fiction classic about culture, gender, diplomacy, and trust on a frozen world.', 'https://covers.openlibrary.org/b/isbn/9780441478125-L.jpg', 1969, 304, 'eng', 'open_library_seed', '/works/OL59882W', NULL, NULL, '0441478123', '9780441478125', '["science-fiction", "speculative-fiction", "classics"]', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO books (id, title, subtitle, description, cover_url, first_publish_year, page_count, language, source, open_library_work_key, open_library_edition_key, google_books_id, isbn_10, isbn_13, subjects, created_at, updated_at) VALUES ('23febc05-1664-5b25-87d2-78adafc2d7f9', 'Kindred', NULL, 'A time-travel novel that confronts history, survival, family, and the violence of slavery.', 'https://covers.openlibrary.org/b/isbn/9780807083697-L.jpg', 1979, 287, 'eng', 'open_library_seed', '/works/OL356698W', NULL, NULL, '0807083690', '9780807083697', '["science-fiction", "historical-fiction", "literary-fiction"]', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO books (id, title, subtitle, description, cover_url, first_publish_year, page_count, language, source, open_library_work_key, open_library_edition_key, google_books_id, isbn_10, isbn_13, subjects, created_at, updated_at) VALUES ('150c7a22-f226-589b-84ca-3e6c9c097659', 'The Hobbit', NULL, 'A fantasy adventure about a reluctant traveler, a dragon, and the comforts of home.', 'https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg', 1937, 310, 'eng', 'open_library_seed', '/works/OL262758W', NULL, NULL, '054792822X', '9780547928227', '["fantasy", "adventure", "classics"]', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO books (id, title, subtitle, description, cover_url, first_publish_year, page_count, language, source, open_library_work_key, open_library_edition_key, google_books_id, isbn_10, isbn_13, subjects, created_at, updated_at) VALUES ('56857541-fafc-55c6-8672-c548da63d7ef', 'Murder on the Orient Express', NULL, 'A classic locked-room mystery set aboard a snowbound train.', 'https://covers.openlibrary.org/b/isbn/9780062073501-L.jpg', 1934, 256, 'eng', 'open_library_seed', '/works/OL471945W', NULL, NULL, '0062073508', '9780062073501', '["mystery", "crime", "classics"]', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO books (id, title, subtitle, description, cover_url, first_publish_year, page_count, language, source, open_library_work_key, open_library_edition_key, google_books_id, isbn_10, isbn_13, subjects, created_at, updated_at) VALUES ('09624f72-9e32-5ac2-abdf-7ba7d4217c83', 'Never Let Me Go', NULL, 'A quiet speculative novel about memory, friendship, love, and what people are willing not to question.', 'https://covers.openlibrary.org/b/isbn/9781400078776-L.jpg', 2005, 288, 'eng', 'open_library_seed', '/works/OL14915186W', NULL, NULL, '1400078776', '9781400078776', '["literary-fiction", "speculative-fiction", "melancholy"]', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO books (id, title, subtitle, description, cover_url, first_publish_year, page_count, language, source, open_library_work_key, open_library_edition_key, google_books_id, isbn_10, isbn_13, subjects, created_at, updated_at) VALUES ('ca935134-be47-5635-a703-46c495c520ab', 'Beloved', NULL, 'A powerful novel about memory, motherhood, trauma, and the afterlife of slavery.', 'https://covers.openlibrary.org/b/isbn/9781400033416-L.jpg', 1987, 321, 'eng', 'open_library_seed', '/works/OL1823607W', NULL, NULL, '1400033411', '9781400033416', '["literary-fiction", "historical-fiction", "classics"]', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO books (id, title, subtitle, description, cover_url, first_publish_year, page_count, language, source, open_library_work_key, open_library_edition_key, google_books_id, isbn_10, isbn_13, subjects, created_at, updated_at) VALUES ('696aa92b-80f9-59f2-a7b0-11ea1163b4f3', 'The Martian', NULL, 'A survival story about science, stubbornness, humor, and staying alive on Mars.', 'https://covers.openlibrary.org/b/isbn/9780553418026-L.jpg', 2011, 369, 'eng', 'open_library_seed', '/works/OL17054000W', NULL, NULL, '0553418025', '9780553418026', '["science-fiction", "survival", "humor"]', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO books (id, title, subtitle, description, cover_url, first_publish_year, page_count, language, source, open_library_work_key, open_library_edition_key, google_books_id, isbn_10, isbn_13, subjects, created_at, updated_at) VALUES ('a7c9f8f4-5083-564a-b511-5bc3612fdbf5', 'Station Eleven', NULL, 'A post-collapse novel about art, memory, travel, and what people preserve after disaster.', 'https://covers.openlibrary.org/b/isbn/9780804172448-L.jpg', 2014, 336, 'eng', 'open_library_seed', '/works/OL17309213W', NULL, NULL, '0804172447', '9780804172448', '["literary-fiction", "post-apocalyptic", "speculative-fiction"]', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO books (id, title, subtitle, description, cover_url, first_publish_year, page_count, language, source, open_library_work_key, open_library_edition_key, google_books_id, isbn_10, isbn_13, subjects, created_at, updated_at) VALUES ('55f6ca68-6b74-5280-8e60-19875d7ae833', 'All Systems Red', 'The Murderbot Diaries', 'A compact sci-fi story about a security android, autonomy, anxiety, and reluctant heroism.', 'https://covers.openlibrary.org/b/isbn/9780765397539-L.jpg', 2017, 144, 'eng', 'open_library_seed', '/works/OL19792590W', NULL, NULL, '0765397536', '9780765397539', '["science-fiction", "novella", "funny"]', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO book_authors (book_id, author_id, author_order) VALUES ('ddd50dbe-7516-5e42-8b7a-67a4189c6af4', '29e373a1-7cd5-5690-a74b-9b0c1b415a06', 0);
INSERT INTO book_authors (book_id, author_id, author_order) VALUES ('8d62ffed-d6ce-5b36-bb87-eff8eb038a76', '82444554-c800-50e1-a27d-0ad1d150347f', 0);
INSERT INTO book_authors (book_id, author_id, author_order) VALUES ('1aa95a14-a65c-553a-9632-9d53c108c6ed', '482c7488-e53c-5e68-b7f9-bb6ac21fd085', 0);
INSERT INTO book_authors (book_id, author_id, author_order) VALUES ('6ada9624-61d0-5ab5-af85-5d1787c5b295', '73886edd-c5de-5bad-949f-dfe108899661', 0);
INSERT INTO book_authors (book_id, author_id, author_order) VALUES ('23febc05-1664-5b25-87d2-78adafc2d7f9', '7fa6d13d-3bdf-5b09-a588-a1ee1b39aa21', 0);
INSERT INTO book_authors (book_id, author_id, author_order) VALUES ('150c7a22-f226-589b-84ca-3e6c9c097659', 'a3c1fa32-d9e8-516f-88ab-b8c8a52d56be', 0);
INSERT INTO book_authors (book_id, author_id, author_order) VALUES ('56857541-fafc-55c6-8672-c548da63d7ef', '15948a91-d53f-5761-8188-964ba54983fa', 0);
INSERT INTO book_authors (book_id, author_id, author_order) VALUES ('09624f72-9e32-5ac2-abdf-7ba7d4217c83', '4c26e192-fff2-545a-9517-c30cf062df7f', 0);
INSERT INTO book_authors (book_id, author_id, author_order) VALUES ('ca935134-be47-5635-a703-46c495c520ab', '5b0e61e4-312b-54e2-a2c8-560714092694', 0);
INSERT INTO book_authors (book_id, author_id, author_order) VALUES ('696aa92b-80f9-59f2-a7b0-11ea1163b4f3', 'c7e65ee0-e0bd-5d5a-99b7-4981f62b25ac', 0);
INSERT INTO book_authors (book_id, author_id, author_order) VALUES ('a7c9f8f4-5083-564a-b511-5bc3612fdbf5', '300a1fc9-5da2-503b-a3e3-72c33b106b65', 0);
INSERT INTO book_authors (book_id, author_id, author_order) VALUES ('55f6ca68-6b74-5280-8e60-19875d7ae833', '4ad32d7f-e034-54b6-bc9b-8764c150a79d', 0);
INSERT INTO tags (id, name, slug, created_at) VALUES ('423e4b22-d939-5b03-be8b-4b868a124dc4', 'Classic', 'classic', '2026-07-08T00:00:00Z');
INSERT INTO tags (id, name, slug, created_at) VALUES ('77e2aac8-94ab-5a6a-a2b6-1f071738b463', 'Sci Fi', 'sci-fi', '2026-07-08T00:00:00Z');
INSERT INTO tags (id, name, slug, created_at) VALUES ('b3e2e8a0-0371-55f5-8e20-3c9c6176271c', 'Literary Fiction', 'literary-fiction', '2026-07-08T00:00:00Z');
INSERT INTO tags (id, name, slug, created_at) VALUES ('68727e89-27a8-59e6-8eb2-746612a72dd5', 'Made Me Think', 'made-me-think', '2026-07-08T00:00:00Z');
INSERT INTO tags (id, name, slug, created_at) VALUES ('a2bb7ce3-08cd-5bb9-b045-5f48c077a64b', 'Cozy', 'cozy', '2026-07-08T00:00:00Z');
INSERT INTO tags (id, name, slug, created_at) VALUES ('26951706-f2a9-5e39-aa29-2342e7c6f817', 'Dnf', 'dnf', '2026-07-08T00:00:00Z');
INSERT INTO tags (id, name, slug, created_at) VALUES ('61f11347-298c-5449-8d52-f1c9fb7d383d', 'Audiobook', 'audiobook', '2026-07-08T00:00:00Z');
INSERT INTO tags (id, name, slug, created_at) VALUES ('f211bfbf-c6eb-599f-b871-caa4c4c76723', 'Reread', 'reread', '2026-07-08T00:00:00Z');
INSERT INTO tags (id, name, slug, created_at) VALUES ('c82adaf8-b1fa-5e3e-b211-f21621eeecb5', 'Book Club', 'book-club', '2026-07-08T00:00:00Z');
INSERT INTO tags (id, name, slug, created_at) VALUES ('d0116f13-cb55-5fb0-9f31-2cbd5831384f', 'Short', 'short', '2026-07-08T00:00:00Z');
INSERT INTO tags (id, name, slug, created_at) VALUES ('3ee1779b-d99f-5a6a-8ab3-7788cb829e45', 'Dark', 'dark', '2026-07-08T00:00:00Z');
INSERT INTO tags (id, name, slug, created_at) VALUES ('9268f353-5040-5f28-8b94-e388e63d98b5', 'Fast Paced', 'fast-paced', '2026-07-08T00:00:00Z');
INSERT INTO tags (id, name, slug, created_at) VALUES ('e89764e1-57a7-552e-9d77-dab9f04468f2', 'Emotional', 'emotional', '2026-07-08T00:00:00Z');
INSERT INTO tags (id, name, slug, created_at) VALUES ('a0a6a517-b88f-5986-aa73-18981b6584f0', 'Mystery', 'mystery', '2026-07-08T00:00:00Z');
INSERT INTO tags (id, name, slug, created_at) VALUES ('191d658b-d28e-5ff2-8bf1-cc9c033748b8', 'Fantasy', 'fantasy', '2026-07-08T00:00:00Z');
INSERT INTO user_books (id, user_id, book_id, status, rating, format, started_at, finished_at, dnf_at, progress_pages, progress_percent, visibility, created_at, updated_at) VALUES ('c7cd753b-c6b5-5bcb-a6c4-1ce3a2eed3af', '596aa40b-748f-5029-9adf-368efdad82e9', 'a7c9f8f4-5083-564a-b511-5bc3612fdbf5', 'read', 4.5, 'paperback', '2026-06-02', '2026-06-07', NULL, NULL, 100, 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO user_books (id, user_id, book_id, status, rating, format, started_at, finished_at, dnf_at, progress_pages, progress_percent, visibility, created_at, updated_at) VALUES ('0290f442-ecd6-5e36-bd95-b4b886bc32ad', '596aa40b-748f-5029-9adf-368efdad82e9', '23febc05-1664-5b25-87d2-78adafc2d7f9', 'read', 5.0, 'ebook', '2026-05-12', '2026-05-15', NULL, NULL, 100, 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO user_books (id, user_id, book_id, status, rating, format, started_at, finished_at, dnf_at, progress_pages, progress_percent, visibility, created_at, updated_at) VALUES ('29538de4-ce68-5026-acc6-5c0570b53f5f', '596aa40b-748f-5029-9adf-368efdad82e9', '09624f72-9e32-5ac2-abdf-7ba7d4217c83', 'reading', NULL, 'paperback', '2026-07-01', NULL, NULL, 132, 46, 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO user_books (id, user_id, book_id, status, rating, format, started_at, finished_at, dnf_at, progress_pages, progress_percent, visibility, created_at, updated_at) VALUES ('8f4733f0-a448-559d-aedc-ea1c810a6c84', '596aa40b-748f-5029-9adf-368efdad82e9', '55f6ca68-6b74-5280-8e60-19875d7ae833', 'want_to_read', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO user_books (id, user_id, book_id, status, rating, format, started_at, finished_at, dnf_at, progress_pages, progress_percent, visibility, created_at, updated_at) VALUES ('a9644632-0284-527a-a9ff-4a0357d009c2', '596aa40b-748f-5029-9adf-368efdad82e9', '150c7a22-f226-589b-84ca-3e6c9c097659', 'dnf', NULL, 'audiobook', '2026-04-01', NULL, '2026-04-05', NULL, 38, 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO user_books (id, user_id, book_id, status, rating, format, started_at, finished_at, dnf_at, progress_pages, progress_percent, visibility, created_at, updated_at) VALUES ('64ff0509-6080-5067-bef0-369dc4938bc3', '4552117f-8c50-5328-a2a4-adb331694bc6', '696aa92b-80f9-59f2-a7b0-11ea1163b4f3', 'read', 4.0, 'ebook', '2026-06-20', '2026-06-25', NULL, NULL, 100, 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO user_books (id, user_id, book_id, status, rating, format, started_at, finished_at, dnf_at, progress_pages, progress_percent, visibility, created_at, updated_at) VALUES ('9ed08533-0eaf-51ce-a502-6454573cead1', '4552117f-8c50-5328-a2a4-adb331694bc6', '1aa95a14-a65c-553a-9632-9d53c108c6ed', 'read', 4.5, 'paperback', '2026-03-10', '2026-03-18', NULL, NULL, 100, 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO user_books (id, user_id, book_id, status, rating, format, started_at, finished_at, dnf_at, progress_pages, progress_percent, visibility, created_at, updated_at) VALUES ('2b1de0d4-1e41-567a-b2aa-f59f5726ea06', '4552117f-8c50-5328-a2a4-adb331694bc6', '55f6ca68-6b74-5280-8e60-19875d7ae833', 'read', 4.0, 'audiobook', '2026-07-02', '2026-07-03', NULL, NULL, 100, 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO user_books (id, user_id, book_id, status, rating, format, started_at, finished_at, dnf_at, progress_pages, progress_percent, visibility, created_at, updated_at) VALUES ('31a10d67-6c2a-5c09-be99-559ed1e3c1f0', '4552117f-8c50-5328-a2a4-adb331694bc6', 'ddd50dbe-7516-5e42-8b7a-67a4189c6af4', 'want_to_read', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO user_books (id, user_id, book_id, status, rating, format, started_at, finished_at, dnf_at, progress_pages, progress_percent, visibility, created_at, updated_at) VALUES ('3d0afd44-dedb-5d25-893f-4a87ee6f48ce', 'e6c33a04-72f5-5e98-9d31-d6a09f7cf2c6', '150c7a22-f226-589b-84ca-3e6c9c097659', 'read', 5.0, 'hardcover', '2026-01-05', '2026-01-12', NULL, NULL, 100, 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO user_books (id, user_id, book_id, status, rating, format, started_at, finished_at, dnf_at, progress_pages, progress_percent, visibility, created_at, updated_at) VALUES ('a81340cd-76fd-5477-89ca-ac67f1c46477', 'e6c33a04-72f5-5e98-9d31-d6a09f7cf2c6', '56857541-fafc-55c6-8672-c548da63d7ef', 'read', 4.0, 'paperback', '2026-06-01', '2026-06-02', NULL, NULL, 100, 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO user_books (id, user_id, book_id, status, rating, format, started_at, finished_at, dnf_at, progress_pages, progress_percent, visibility, created_at, updated_at) VALUES ('f307c082-7b2c-52a9-a297-3dfc5aa08ff5', 'e6c33a04-72f5-5e98-9d31-d6a09f7cf2c6', '8d62ffed-d6ce-5b36-bb87-eff8eb038a76', 'read', 4.5, 'ebook', '2026-02-15', '2026-02-20', NULL, NULL, 100, 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO user_books (id, user_id, book_id, status, rating, format, started_at, finished_at, dnf_at, progress_pages, progress_percent, visibility, created_at, updated_at) VALUES ('3abc062a-4e4e-538b-b3de-19afcd3416bc', 'e6c33a04-72f5-5e98-9d31-d6a09f7cf2c6', '6ada9624-61d0-5ab5-af85-5d1787c5b295', 'reading', NULL, 'paperback', '2026-07-04', NULL, NULL, 84, 28, 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO reading_logs (id, user_id, book_id, user_book_id, log_date, started_at, finished_at, status, rating, review_text, contains_spoilers, is_reread, progress_pages, progress_percent, format, visibility, created_at, updated_at) VALUES ('c4c28fb8-7c49-5213-9042-1640ee887783', '596aa40b-748f-5029-9adf-368efdad82e9', 'a7c9f8f4-5083-564a-b511-5bc3612fdbf5', 'c7cd753b-c6b5-5bcb-a6c4-1ce3a2eed3af', '2026-06-07', '2026-06-02', '2026-06-07', 'finished', 4.5, 'Beautifully quiet. I liked that the book cared as much about art and memory as it did about survival.', 0, 0, NULL, 100, 'paperback', 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO reading_logs (id, user_id, book_id, user_book_id, log_date, started_at, finished_at, status, rating, review_text, contains_spoilers, is_reread, progress_pages, progress_percent, format, visibility, created_at, updated_at) VALUES ('80360541-b899-5de3-b60e-fc508857c330', '596aa40b-748f-5029-9adf-368efdad82e9', '23febc05-1664-5b25-87d2-78adafc2d7f9', '0290f442-ecd6-5e36-bd95-b4b886bc32ad', '2026-05-15', '2026-05-12', '2026-05-15', 'finished', 5.0, 'Tense, direct, and impossible to put down. The time-travel premise makes the historical violence feel brutally immediate.', 0, 0, NULL, 100, 'ebook', 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO reading_logs (id, user_id, book_id, user_book_id, log_date, started_at, finished_at, status, rating, review_text, contains_spoilers, is_reread, progress_pages, progress_percent, format, visibility, created_at, updated_at) VALUES ('c7069017-cde0-5523-8a71-bb6a448fb6ad', '596aa40b-748f-5029-9adf-368efdad82e9', '150c7a22-f226-589b-84ca-3e6c9c097659', 'a9644632-0284-527a-a9ff-4a0357d009c2', '2026-04-05', '2026-04-01', NULL, 'dnf', NULL, 'DNF for now. I can tell why people love it, but this was not matching my mood.', 0, 0, NULL, 38, 'audiobook', 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO reading_logs (id, user_id, book_id, user_book_id, log_date, started_at, finished_at, status, rating, review_text, contains_spoilers, is_reread, progress_pages, progress_percent, format, visibility, created_at, updated_at) VALUES ('893f2f93-1cd6-5f23-8b96-66d9baf62ada', '4552117f-8c50-5328-a2a4-adb331694bc6', '696aa92b-80f9-59f2-a7b0-11ea1163b4f3', '64ff0509-6080-5067-bef0-369dc4938bc3', '2026-06-25', '2026-06-20', '2026-06-25', 'finished', 4.0, 'Extremely readable. The problem-solving loop works almost like a thriller.', 0, 0, NULL, 100, 'ebook', 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO reading_logs (id, user_id, book_id, user_book_id, log_date, started_at, finished_at, status, rating, review_text, contains_spoilers, is_reread, progress_pages, progress_percent, format, visibility, created_at, updated_at) VALUES ('30e0a814-4904-5362-9417-fb314ccc39d0', '4552117f-8c50-5328-a2a4-adb331694bc6', '55f6ca68-6b74-5280-8e60-19875d7ae833', '2b1de0d4-1e41-567a-b2aa-f59f5726ea06', '2026-07-03', '2026-07-02', '2026-07-03', 'finished', 4.0, 'Short, funny, and surprisingly human for a story about a security android.', 0, 0, NULL, 100, 'audiobook', 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO reading_logs (id, user_id, book_id, user_book_id, log_date, started_at, finished_at, status, rating, review_text, contains_spoilers, is_reread, progress_pages, progress_percent, format, visibility, created_at, updated_at) VALUES ('b4179f40-8343-5aa4-9d51-d327e881a6c1', 'e6c33a04-72f5-5e98-9d31-d6a09f7cf2c6', '150c7a22-f226-589b-84ca-3e6c9c097659', '3d0afd44-dedb-5d25-893f-4a87ee6f48ce', '2026-01-12', '2026-01-05', '2026-01-12', 'finished', 5.0, 'Comfort fantasy. I would follow Bilbo anywhere, especially if snacks are involved.', 0, 1, NULL, 100, 'hardcover', 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO reading_logs (id, user_id, book_id, user_book_id, log_date, started_at, finished_at, status, rating, review_text, contains_spoilers, is_reread, progress_pages, progress_percent, format, visibility, created_at, updated_at) VALUES ('fcf6edcd-30e4-529c-85f6-9f28a392f218', 'e6c33a04-72f5-5e98-9d31-d6a09f7cf2c6', '56857541-fafc-55c6-8672-c548da63d7ef', 'a81340cd-76fd-5477-89ca-ac67f1c46477', '2026-06-02', '2026-06-01', '2026-06-02', 'finished', 4.0, 'A neat little puzzle box. Great weekend read.', 0, 0, NULL, 100, 'paperback', 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO reading_logs (id, user_id, book_id, user_book_id, log_date, started_at, finished_at, status, rating, review_text, contains_spoilers, is_reread, progress_pages, progress_percent, format, visibility, created_at, updated_at) VALUES ('b62a6699-460b-5bc0-9cc4-5407b9cfd1f6', 'e6c33a04-72f5-5e98-9d31-d6a09f7cf2c6', '8d62ffed-d6ce-5b36-bb87-eff8eb038a76', 'f307c082-7b2c-52a9-a297-3dfc5aa08ff5', '2026-02-20', '2026-02-15', '2026-02-20', 'finished', 4.5, 'Much sadder and stranger than I expected. The monster is the heart of the book.', 0, 0, NULL, 100, 'ebook', 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ('c4c28fb8-7c49-5213-9042-1640ee887783', 'b3e2e8a0-0371-55f5-8e20-3c9c6176271c');
INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ('c4c28fb8-7c49-5213-9042-1640ee887783', 'e89764e1-57a7-552e-9d77-dab9f04468f2');
INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ('c4c28fb8-7c49-5213-9042-1640ee887783', '68727e89-27a8-59e6-8eb2-746612a72dd5');
INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ('80360541-b899-5de3-b60e-fc508857c330', '77e2aac8-94ab-5a6a-a2b6-1f071738b463');
INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ('80360541-b899-5de3-b60e-fc508857c330', '3ee1779b-d99f-5a6a-8ab3-7788cb829e45');
INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ('80360541-b899-5de3-b60e-fc508857c330', '68727e89-27a8-59e6-8eb2-746612a72dd5');
INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ('c7069017-cde0-5523-8a71-bb6a448fb6ad', '26951706-f2a9-5e39-aa29-2342e7c6f817');
INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ('c7069017-cde0-5523-8a71-bb6a448fb6ad', '61f11347-298c-5449-8d52-f1c9fb7d383d');
INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ('c7069017-cde0-5523-8a71-bb6a448fb6ad', '191d658b-d28e-5ff2-8bf1-cc9c033748b8');
INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ('893f2f93-1cd6-5f23-8b96-66d9baf62ada', '77e2aac8-94ab-5a6a-a2b6-1f071738b463');
INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ('893f2f93-1cd6-5f23-8b96-66d9baf62ada', '9268f353-5040-5f28-8b94-e388e63d98b5');
INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ('30e0a814-4904-5362-9417-fb314ccc39d0', '77e2aac8-94ab-5a6a-a2b6-1f071738b463');
INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ('30e0a814-4904-5362-9417-fb314ccc39d0', 'd0116f13-cb55-5fb0-9f31-2cbd5831384f');
INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ('30e0a814-4904-5362-9417-fb314ccc39d0', '61f11347-298c-5449-8d52-f1c9fb7d383d');
INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ('b4179f40-8343-5aa4-9d51-d327e881a6c1', '191d658b-d28e-5ff2-8bf1-cc9c033748b8');
INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ('b4179f40-8343-5aa4-9d51-d327e881a6c1', 'a2bb7ce3-08cd-5bb9-b045-5f48c077a64b');
INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ('b4179f40-8343-5aa4-9d51-d327e881a6c1', 'f211bfbf-c6eb-599f-b871-caa4c4c76723');
INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ('fcf6edcd-30e4-529c-85f6-9f28a392f218', 'a0a6a517-b88f-5986-aa73-18981b6584f0');
INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ('fcf6edcd-30e4-529c-85f6-9f28a392f218', '9268f353-5040-5f28-8b94-e388e63d98b5');
INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ('b62a6699-460b-5bc0-9cc4-5407b9cfd1f6', '423e4b22-d939-5b03-be8b-4b868a124dc4');
INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ('b62a6699-460b-5bc0-9cc4-5407b9cfd1f6', '3ee1779b-d99f-5a6a-8ab3-7788cb829e45');
INSERT INTO reading_log_tags (reading_log_id, tag_id) VALUES ('b62a6699-460b-5bc0-9cc4-5407b9cfd1f6', '68727e89-27a8-59e6-8eb2-746612a72dd5');
INSERT INTO follows (follower_id, following_id, created_at) VALUES ('596aa40b-748f-5029-9adf-368efdad82e9', '4552117f-8c50-5328-a2a4-adb331694bc6', '2026-07-08T00:00:00Z');
INSERT INTO follows (follower_id, following_id, created_at) VALUES ('596aa40b-748f-5029-9adf-368efdad82e9', 'e6c33a04-72f5-5e98-9d31-d6a09f7cf2c6', '2026-07-08T00:00:00Z');
INSERT INTO follows (follower_id, following_id, created_at) VALUES ('4552117f-8c50-5328-a2a4-adb331694bc6', '596aa40b-748f-5029-9adf-368efdad82e9', '2026-07-08T00:00:00Z');
INSERT INTO follows (follower_id, following_id, created_at) VALUES ('e6c33a04-72f5-5e98-9d31-d6a09f7cf2c6', '596aa40b-748f-5029-9adf-368efdad82e9', '2026-07-08T00:00:00Z');
INSERT INTO follows (follower_id, following_id, created_at) VALUES ('e6c33a04-72f5-5e98-9d31-d6a09f7cf2c6', '4552117f-8c50-5328-a2a4-adb331694bc6', '2026-07-08T00:00:00Z');
INSERT INTO book_lists (id, user_id, title, slug, description, visibility, created_at, updated_at) VALUES ('32872085-2dfd-5053-a5ac-1b1caf10d0c8', '596aa40b-748f-5029-9adf-368efdad82e9', 'Books that feel like after midnight', 'books-that-feel-like-after-midnight', 'Quiet, strange, and a little haunted.', 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO book_lists (id, user_id, title, slug, description, visibility, created_at, updated_at) VALUES ('5c9d73fd-6e20-590d-8b64-840a4172deb3', '4552117f-8c50-5328-a2a4-adb331694bc6', 'Short books to restart reading', 'short-books-to-restart-reading', 'Fast momentum, low page count, high satisfaction.', 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO book_lists (id, user_id, title, slug, description, visibility, created_at, updated_at) VALUES ('82afcae2-f3b0-51fc-a568-27a406e701c5', 'e6c33a04-72f5-5e98-9d31-d6a09f7cf2c6', 'Comfort fantasy and mystery', 'comfort-fantasy-and-mystery', 'Books I reach for when I want plot, charm, and atmosphere.', 'public', '2026-07-08T00:00:00Z', '2026-07-08T00:00:00Z');
INSERT INTO book_list_items (id, list_id, book_id, position, note, created_at) VALUES ('d395bbb8-b94d-53b0-a7d4-fbfc32c5d74a', '32872085-2dfd-5053-a5ac-1b1caf10d0c8', 'a7c9f8f4-5083-564a-b511-5bc3612fdbf5', 1, NULL, '2026-07-08T00:00:00Z');
INSERT INTO book_list_items (id, list_id, book_id, position, note, created_at) VALUES ('b2feb679-bc92-5761-8139-98d54bad6d7c', '32872085-2dfd-5053-a5ac-1b1caf10d0c8', '09624f72-9e32-5ac2-abdf-7ba7d4217c83', 2, NULL, '2026-07-08T00:00:00Z');
INSERT INTO book_list_items (id, list_id, book_id, position, note, created_at) VALUES ('90bf1aad-b495-5ccc-91b5-d64b3e8e5388', '32872085-2dfd-5053-a5ac-1b1caf10d0c8', '8d62ffed-d6ce-5b36-bb87-eff8eb038a76', 3, NULL, '2026-07-08T00:00:00Z');
INSERT INTO book_list_items (id, list_id, book_id, position, note, created_at) VALUES ('649a2641-fb85-519a-8382-f24fbd677d83', '5c9d73fd-6e20-590d-8b64-840a4172deb3', '55f6ca68-6b74-5280-8e60-19875d7ae833', 1, NULL, '2026-07-08T00:00:00Z');
INSERT INTO book_list_items (id, list_id, book_id, position, note, created_at) VALUES ('01b8b160-b7bb-59dc-9a45-3ef13b79e676', '5c9d73fd-6e20-590d-8b64-840a4172deb3', '56857541-fafc-55c6-8672-c548da63d7ef', 2, NULL, '2026-07-08T00:00:00Z');
INSERT INTO book_list_items (id, list_id, book_id, position, note, created_at) VALUES ('57f2250d-1192-5b74-8b72-1bb553a47a03', '82afcae2-f3b0-51fc-a568-27a406e701c5', '150c7a22-f226-589b-84ca-3e6c9c097659', 1, NULL, '2026-07-08T00:00:00Z');
INSERT INTO book_list_items (id, list_id, book_id, position, note, created_at) VALUES ('27fbd1a0-24df-5c62-b7dc-b8c00b2a99cd', '82afcae2-f3b0-51fc-a568-27a406e701c5', '56857541-fafc-55c6-8672-c548da63d7ef', 2, NULL, '2026-07-08T00:00:00Z');
INSERT INTO book_list_items (id, list_id, book_id, position, note, created_at) VALUES ('17c60ae6-cb45-52e5-8e0a-6665ea5c6333', '82afcae2-f3b0-51fc-a568-27a406e701c5', 'ddd50dbe-7516-5e42-8b7a-67a4189c6af4', 3, NULL, '2026-07-08T00:00:00Z');
INSERT INTO likes (id, user_id, target_type, target_id, created_at) VALUES ('5a9ea1d4-120d-5fde-bc9c-f958ed22046a', '596aa40b-748f-5029-9adf-368efdad82e9', 'reading_log', '30e0a814-4904-5362-9417-fb314ccc39d0', '2026-07-08T00:00:00Z');
INSERT INTO likes (id, user_id, target_type, target_id, created_at) VALUES ('51d6ebbb-0fa7-5353-a7a1-27f4d109fc4a', 'e6c33a04-72f5-5e98-9d31-d6a09f7cf2c6', 'reading_log', '80360541-b899-5de3-b60e-fc508857c330', '2026-07-08T00:00:00Z');
INSERT INTO likes (id, user_id, target_type, target_id, created_at) VALUES ('90dadf88-82d3-5c3d-a58a-fdfd0f10e1ad', '4552117f-8c50-5328-a2a4-adb331694bc6', 'reading_log', 'b62a6699-460b-5bc0-9cc4-5407b9cfd1f6', '2026-07-08T00:00:00Z');
INSERT INTO likes (id, user_id, target_type, target_id, created_at) VALUES ('1c3ce0fe-d558-5fb2-9463-d318a65972f9', '596aa40b-748f-5029-9adf-368efdad82e9', 'list', '5c9d73fd-6e20-590d-8b64-840a4172deb3', '2026-07-08T00:00:00Z');
INSERT INTO likes (id, user_id, target_type, target_id, created_at) VALUES ('a92b87db-b8b3-5778-ace2-4c4f8238b611', '4552117f-8c50-5328-a2a4-adb331694bc6', 'list', '32872085-2dfd-5053-a5ac-1b1caf10d0c8', '2026-07-08T00:00:00Z');
INSERT INTO activity_events (id, user_id, event_type, target_type, target_id, book_id, metadata, visibility, created_at) VALUES ('13eb7b10-931a-50d3-9457-5980025f2f41', '596aa40b-748f-5029-9adf-368efdad82e9', 'book_finished', 'reading_log', 'c4c28fb8-7c49-5213-9042-1640ee887783', 'a7c9f8f4-5083-564a-b511-5bc3612fdbf5', '{"log_date": "2026-06-07"}', 'public', '2026-07-08T00:00:00Z');
INSERT INTO activity_events (id, user_id, event_type, target_type, target_id, book_id, metadata, visibility, created_at) VALUES ('596a93d2-b8b2-5732-a232-dfef92d446fc', '596aa40b-748f-5029-9adf-368efdad82e9', 'book_finished', 'reading_log', '80360541-b899-5de3-b60e-fc508857c330', '23febc05-1664-5b25-87d2-78adafc2d7f9', '{"log_date": "2026-05-15"}', 'public', '2026-07-08T00:00:00Z');
INSERT INTO activity_events (id, user_id, event_type, target_type, target_id, book_id, metadata, visibility, created_at) VALUES ('9fb3bea7-b5b0-5895-8087-217df0fa9a13', '596aa40b-748f-5029-9adf-368efdad82e9', 'book_dnf', 'reading_log', 'c7069017-cde0-5523-8a71-bb6a448fb6ad', '150c7a22-f226-589b-84ca-3e6c9c097659', '{"log_date": "2026-04-05"}', 'public', '2026-07-08T00:00:00Z');
INSERT INTO activity_events (id, user_id, event_type, target_type, target_id, book_id, metadata, visibility, created_at) VALUES ('ee51ff20-361e-50c3-99de-382f96674f75', '4552117f-8c50-5328-a2a4-adb331694bc6', 'book_finished', 'reading_log', '893f2f93-1cd6-5f23-8b96-66d9baf62ada', '696aa92b-80f9-59f2-a7b0-11ea1163b4f3', '{"log_date": "2026-06-25"}', 'public', '2026-07-08T00:00:00Z');
INSERT INTO activity_events (id, user_id, event_type, target_type, target_id, book_id, metadata, visibility, created_at) VALUES ('613fea6d-1190-5aa6-9c7e-f35a6f18fe68', '4552117f-8c50-5328-a2a4-adb331694bc6', 'book_finished', 'reading_log', '30e0a814-4904-5362-9417-fb314ccc39d0', '55f6ca68-6b74-5280-8e60-19875d7ae833', '{"log_date": "2026-07-03"}', 'public', '2026-07-08T00:00:00Z');
INSERT INTO activity_events (id, user_id, event_type, target_type, target_id, book_id, metadata, visibility, created_at) VALUES ('d7f5c0a3-b1dc-56ca-95ad-d2ec8b88afe9', 'e6c33a04-72f5-5e98-9d31-d6a09f7cf2c6', 'book_finished', 'reading_log', 'b4179f40-8343-5aa4-9d51-d327e881a6c1', '150c7a22-f226-589b-84ca-3e6c9c097659', '{"log_date": "2026-01-12"}', 'public', '2026-07-08T00:00:00Z');
INSERT INTO activity_events (id, user_id, event_type, target_type, target_id, book_id, metadata, visibility, created_at) VALUES ('bb139487-3d9f-559a-a36b-c5fb8910f5a6', 'e6c33a04-72f5-5e98-9d31-d6a09f7cf2c6', 'book_finished', 'reading_log', 'fcf6edcd-30e4-529c-85f6-9f28a392f218', '56857541-fafc-55c6-8672-c548da63d7ef', '{"log_date": "2026-06-02"}', 'public', '2026-07-08T00:00:00Z');
INSERT INTO activity_events (id, user_id, event_type, target_type, target_id, book_id, metadata, visibility, created_at) VALUES ('672893b7-ea05-569f-a893-119ea427f404', 'e6c33a04-72f5-5e98-9d31-d6a09f7cf2c6', 'book_finished', 'reading_log', 'b62a6699-460b-5bc0-9cc4-5407b9cfd1f6', '8d62ffed-d6ce-5b36-bb87-eff8eb038a76', '{"log_date": "2026-02-20"}', 'public', '2026-07-08T00:00:00Z');
INSERT INTO activity_events (id, user_id, event_type, target_type, target_id, book_id, metadata, visibility, created_at) VALUES ('3e5b81ab-9184-58d3-ae84-5249905f733a', '596aa40b-748f-5029-9adf-368efdad82e9', 'list_created', 'list', '32872085-2dfd-5053-a5ac-1b1caf10d0c8', NULL, '{"title": "Books that feel like after midnight"}', 'public', '2026-07-08T00:00:00Z');
INSERT INTO activity_events (id, user_id, event_type, target_type, target_id, book_id, metadata, visibility, created_at) VALUES ('b9b46cfc-b9fe-5065-b0aa-b033236fd97e', '4552117f-8c50-5328-a2a4-adb331694bc6', 'list_created', 'list', '5c9d73fd-6e20-590d-8b64-840a4172deb3', NULL, '{"title": "Short books to restart reading"}', 'public', '2026-07-08T00:00:00Z');
INSERT INTO activity_events (id, user_id, event_type, target_type, target_id, book_id, metadata, visibility, created_at) VALUES ('d6fe1859-8056-562e-af7c-7f93086b9448', 'e6c33a04-72f5-5e98-9d31-d6a09f7cf2c6', 'list_created', 'list', '82afcae2-f3b0-51fc-a568-27a406e701c5', NULL, '{"title": "Comfort fantasy and mystery"}', 'public', '2026-07-08T00:00:00Z');
-- Seed quotes
INSERT INTO quotes (id, user_id, book_id, quote_text, page, note, visibility, created_at) VALUES ('a1000000-0000-4000-8000-000000000001', '596aa40b-748f-5029-9adf-368efdad82e9', 'a7c9f8f4-5083-564a-b511-5bc3612fdbf5', 'Because survival is insufficient.', 58, 'The line the whole book turns on.', 'public', '2026-06-07T10:00:00Z');
INSERT INTO quotes (id, user_id, book_id, quote_text, page, note, visibility, created_at) VALUES ('a1000000-0000-4000-8000-000000000002', '596aa40b-748f-5029-9adf-368efdad82e9', '23febc05-1664-5b25-87d2-78adafc2d7f9', 'The past is a country that we can never return to, only remember.', NULL, NULL, 'public', '2026-05-15T10:00:00Z');
INSERT INTO quotes (id, user_id, book_id, quote_text, page, note, visibility, created_at) VALUES ('a1000000-0000-4000-8000-000000000003', 'e6c33a04-72f5-5e98-9d31-d6a09f7cf2c6', '150c7a22-f226-589b-84ca-3e6c9c097659', 'There is nothing like looking, if you want to find something.', 210, 'Comfort in one sentence.', 'public', '2026-01-12T10:00:00Z');
INSERT INTO quotes (id, user_id, book_id, quote_text, page, note, visibility, created_at) VALUES ('a1000000-0000-4000-8000-000000000004', '4552117f-8c50-5328-a2a4-adb331694bc6', '696aa92b-80f9-59f2-a7b0-11ea1163b4f3', 'I''m going to have to science the heck out of this.', NULL, NULL, 'public', '2026-06-25T10:00:00Z');
INSERT INTO activity_events (id, user_id, event_type, target_type, target_id, book_id, metadata, visibility, created_at) VALUES ('a2000000-0000-4000-8000-000000000001', '596aa40b-748f-5029-9adf-368efdad82e9', 'quote_added', 'quote', 'a1000000-0000-4000-8000-000000000001', 'a7c9f8f4-5083-564a-b511-5bc3612fdbf5', NULL, 'public', '2026-06-07T10:00:00Z');
INSERT INTO activity_events (id, user_id, event_type, target_type, target_id, book_id, metadata, visibility, created_at) VALUES ('a2000000-0000-4000-8000-000000000002', 'e6c33a04-72f5-5e98-9d31-d6a09f7cf2c6', 'quote_added', 'quote', 'a1000000-0000-4000-8000-000000000003', '150c7a22-f226-589b-84ca-3e6c9c097659', NULL, 'public', '2026-01-12T10:00:00Z');
