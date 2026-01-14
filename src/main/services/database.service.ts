import { join } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { app } from "electron";
import log from "electron-log/main";
import * as schema from "../db/schema";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

let sqlite: Database.Database | null = null;
let db: BetterSQLite3Database<typeof schema> | null = null;

function getDbPath(): string {
  const userDataPath = app.getPath("userData");
  return join(userDataPath, "kairos.db");
}

export function getDatabase(): BetterSQLite3Database<typeof schema> {
  if (!db) {
    throw new Error("Database not initialized. Call connectDatabase() first.");
  }
  return db;
}

export function getSqlite(): Database.Database {
  if (!sqlite) {
    throw new Error("Database not initialized. Call connectDatabase() first.");
  }
  return sqlite;
}

function createTables(): void {
  if (!sqlite) throw new Error("Database not initialized");

  // Companies table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  // Job applications table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS job_applications (
      id TEXT PRIMARY KEY,
      company_id INTEGER NOT NULL,
      position TEXT NOT NULL,
      due_date TEXT NOT NULL,
      match_percentage INTEGER NOT NULL,
      template_id TEXT NOT NULL,
      job_description TEXT,
      checklist TEXT,
      original_resume TEXT,
      parsed_resume TEXT,
      tailored_resume TEXT,
      workflow_status TEXT,
      workflow_steps TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      application_status TEXT,
      job_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Indexes
  sqlite.exec(
    `CREATE INDEX IF NOT EXISTS idx_job_applications_company_id ON job_applications(company_id)`,
  );
  sqlite.exec(
    `CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at)`,
  );

  log.info("Database tables created/verified");
}

export async function connectDatabase(): Promise<void> {
  if (db) return;

  const dbPath = getDbPath();
  log.info(`Connecting to database at: ${dbPath}`);

  sqlite = new Database(dbPath);
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("journal_mode = WAL");

  db = drizzle(sqlite, { schema });

  createTables();
  log.info("Database connected");
}

export async function disconnectDatabase(): Promise<void> {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
    log.info("Database connection closed");
  }
}

export async function runMigrations(): Promise<void> {
  // Tables are created in connectDatabase via createTables()
  // Future migrations can be added here with ALTER TABLE statements
  log.info("Migrations complete");
}
