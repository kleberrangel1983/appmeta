import Database from "better-sqlite3";
import path from "node:path";

export interface AppRecord {
  id: number;
  name: string;
  version: string;
  description: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface AppRow {
  id: number;
  name: string;
  version: string;
  description: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

function rowToRecord(row: AppRow): AppRecord {
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : [],
  };
}

export function openDb(dbPath?: string): Database.Database {
  const resolved = dbPath ?? process.env.APPMETA_DB ?? path.join(process.cwd(), "appmeta.db");
  const db = new Database(resolved === ":memory:" ? ":memory:" : resolved);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      version TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

export function listApps(db: Database.Database, tag?: string): AppRecord[] {
  const rows = db.prepare("SELECT * FROM apps ORDER BY id ASC").all() as AppRow[];
  const records = rows.map(rowToRecord);
  if (tag) return records.filter((r) => r.tags.includes(tag));
  return records;
}

export function getApp(db: Database.Database, id: number): AppRecord | null {
  const row = db.prepare("SELECT * FROM apps WHERE id = ?").get(id) as AppRow | undefined;
  return row ? rowToRecord(row) : null;
}

export interface AppInput {
  name: string;
  version: string;
  description?: string;
  tags?: string[];
}

export function createApp(db: Database.Database, input: AppInput): AppRecord {
  const info = db
    .prepare(
      "INSERT INTO apps (name, version, description, tags) VALUES (?, ?, ?, ?)",
    )
    .run(input.name, input.version, input.description ?? "", JSON.stringify(input.tags ?? []));
  return getApp(db, Number(info.lastInsertRowid))!;
}

export function updateApp(
  db: Database.Database,
  id: number,
  input: Partial<AppInput>,
): AppRecord | null {
  const existing = getApp(db, id);
  if (!existing) return null;
  const merged = {
    name: input.name ?? existing.name,
    version: input.version ?? existing.version,
    description: input.description ?? existing.description,
    tags: input.tags ?? existing.tags,
  };
  db.prepare(
    `UPDATE apps
       SET name = ?, version = ?, description = ?, tags = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(merged.name, merged.version, merged.description, JSON.stringify(merged.tags), id);
  return getApp(db, id);
}

export function deleteApp(db: Database.Database, id: number): boolean {
  const info = db.prepare("DELETE FROM apps WHERE id = ?").run(id);
  return info.changes > 0;
}

export function countApps(db: Database.Database): number {
  const row = db.prepare("SELECT COUNT(*) AS n FROM apps").get() as { n: number };
  return row.n;
}
