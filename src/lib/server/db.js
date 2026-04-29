import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { serverConfig } from "./config";

let database;

function ensureRuntimeDirectories() {
  fs.mkdirSync(path.dirname(serverConfig.databasePath), { recursive: true });
  fs.mkdirSync(serverConfig.uploadsDir, { recursive: true });
}

function initDb() {
  ensureRuntimeDirectories();
  database = new Database(serverConfig.databasePath);
  database.pragma("journal_mode = WAL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT NOT NULL DEFAULT '',
      content_markdown TEXT NOT NULL DEFAULT '',
      cover_image_url TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
      published_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

export function getDb() {
  if (!database) {
    initDb();
  }

  return database;
}
