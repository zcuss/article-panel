import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const dbPath = path.join(DATA_DIR, 'app.db');
let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(dbPath);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  _db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      header TEXT NOT NULL,
      topic TEXT,
      keywords TEXT,
      meta_description TEXT,
      og_image TEXT,
      body_html TEXT NOT NULL DEFAULT '',
      body_markdown TEXT,
      lang TEXT DEFAULT 'id',
      status TEXT DEFAULT 'draft',
      published_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
    CREATE INDEX IF NOT EXISTS idx_articles_domain ON articles(domain);
  `);
  return _db;
}

export type Article = {
  id: number;
  domain: string;
  title: string;
  header: string;
  topic: string | null;
  keywords: string | null;
  meta_description: string | null;
  og_image: string | null;
  body_html: string;
  body_markdown: string | null;
  lang: string;
  status: 'draft' | 'published' | 'archived';
  published_at: number | null;
  created_at: number;
  updated_at: number;
};

export type ArticleInput = Omit<Article, 'id' | 'created_at' | 'updated_at' | 'published_at'> & {
  published_at?: number | null;
};
