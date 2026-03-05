import { join } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { app } from "electron";
import log from "electron-log/main";
import * as schema from "./schema";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

export const V1_LEGACY = 1;
export const V2_SPLIT = 2;
export const V3_SPLIT_CLEAN = 3;

const LEGACY_TABLE = "job_applications";
const TARGET_SCHEMA_ENV = "KAIROS_DB_TARGET_SCHEMA_VERSION";

let sqlite: Database.Database | null = null;
let db: BetterSQLite3Database<typeof schema> | null = null;

export class LegacyUpgradeRequiredError extends Error {
  constructor() {
    super(
      "This data format requires Kairos v0.3.x migration first. Install v0.3.x, open once, then upgrade to v0.4.0.",
    );
    this.name = "LegacyUpgradeRequiredError";
  }
}

function getDbPath(): string {
  const userDataPath = app.getPath("userData");
  return join(userDataPath, "kairos.db");
}

export function getTargetSchemaVersion(): number {
  const override = process.env[TARGET_SCHEMA_ENV];
  if (override) {
    const parsed = Number.parseInt(override, 10);
    if (
      Number.isInteger(parsed) &&
      parsed >= V2_SPLIT &&
      parsed <= V3_SPLIT_CLEAN
    ) {
      return parsed;
    }
  }

  const [majorRaw = "0", minorRaw = "0"] = app.getVersion().split(".");
  const major = Number.parseInt(majorRaw, 10);
  const minor = Number.parseInt(minorRaw, 10);

  if (Number.isInteger(major) && Number.isInteger(minor)) {
    if (major > 0 || minor >= 4) {
      return V3_SPLIT_CLEAN;
    }
  }

  return V2_SPLIT;
}

export function supportsLegacyBackupImport(): boolean {
  return getTargetSchemaVersion() < V3_SPLIT_CLEAN;
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

function tableExists(tableName: string): boolean {
  if (!sqlite) throw new Error("Database not initialized");
  const result = sqlite
    .prepare(
      "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
    )
    .get(tableName);
  return Boolean(result);
}

function getUserVersion(): number {
  if (!sqlite) throw new Error("Database not initialized");
  return Number(sqlite.pragma("user_version", { simple: true })) || 0;
}

function setUserVersion(version: number): void {
  if (!sqlite) throw new Error("Database not initialized");
  sqlite.pragma(`user_version = ${version}`);
}

function countRows(tableName: string): number {
  if (!sqlite) throw new Error("Database not initialized");
  const row = sqlite
    .prepare(`SELECT COUNT(*) as count FROM "${tableName}"`)
    .get() as { count: number };
  return row.count;
}

function createSplitTables(): void {
  if (!sqlite) throw new Error("Database not initialized");

  // Companies table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  // Jobs table (metadata only)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      company_id INTEGER NOT NULL,
      position TEXT NOT NULL,
      due_date TEXT NOT NULL,
      job_url TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      application_status TEXT,
      archived INTEGER NOT NULL DEFAULT 0,
      pinned INTEGER NOT NULL DEFAULT 0,
      pinned_at TEXT,
      status_updated_at TEXT,
      interview_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    )
  `);

  // Resumes table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT NOT NULL UNIQUE,
      template_id TEXT NOT NULL,
      original_resume TEXT NOT NULL,
      parsed_resume TEXT,
      tailored_resume TEXT,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    )
  `);

  // Checklists table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS checklists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT NOT NULL UNIQUE,
      job_description TEXT,
      checklist TEXT,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    )
  `);

  // Scores table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT NOT NULL UNIQUE,
      match_percentage INTEGER NOT NULL,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    )
  `);

  // Workflows table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT NOT NULL UNIQUE,
      state TEXT,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    )
  `);

  // Indexes for jobs list and joins
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id)`);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at)`);
  sqlite.exec(
    `CREATE INDEX IF NOT EXISTS idx_resumes_job_id ON resumes(job_id)`,
  );
  sqlite.exec(
    `CREATE INDEX IF NOT EXISTS idx_checklists_job_id ON checklists(job_id)`,
  );
  sqlite.exec(
    `CREATE INDEX IF NOT EXISTS idx_scores_job_id ON scores(job_id)`,
  );
  sqlite.exec(
    `CREATE INDEX IF NOT EXISTS idx_workflows_job_id ON workflows(job_id)`,
  );

  log.info("Split schema tables created/verified");
}

export async function connectDatabase(): Promise<void> {
  if (db) return;

  const dbPath = getDbPath();
  log.info(`Connecting to database at: ${dbPath}`);

  sqlite = new Database(dbPath);
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("journal_mode = WAL");

  db = drizzle(sqlite, { schema });
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

function addColumnIfNotExists(
  table: string,
  column: string,
  definition: string,
): void {
  if (!sqlite) throw new Error("Database not initialized");
  if (!tableExists(table)) return;
  const columns = sqlite.pragma(`table_info(${table})`) as { name: string }[];
  if (!columns.some((col) => col.name === column)) {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    log.info(`Migration: added column ${table}.${column}`);
  }
}

function inferSchemaVersion(
  userVersion: number,
  hasLegacyTable: boolean,
  hasSplitTables: boolean,
): number {
  if (hasLegacyTable && !hasSplitTables) {
    return V1_LEGACY;
  }

  if (hasSplitTables) {
    return Math.max(userVersion, V2_SPLIT);
  }

  return userVersion;
}

function patchLegacyColumnsForMigration(): void {
  // v0.2.2 — status, archive, pin fields
  addColumnIfNotExists(
    LEGACY_TABLE,
    "archived",
    "INTEGER NOT NULL DEFAULT 0",
  );
  addColumnIfNotExists(LEGACY_TABLE, "status_updated_at", "TEXT");
  addColumnIfNotExists(LEGACY_TABLE, "interview_date", "TEXT");
  addColumnIfNotExists(
    LEGACY_TABLE,
    "pinned",
    "INTEGER NOT NULL DEFAULT 0",
  );
  addColumnIfNotExists(LEGACY_TABLE, "pinned_at", "TEXT");
}

function migrateLegacyToSplit(): void {
  if (!sqlite) throw new Error("Database not initialized");
  const sqliteDb = sqlite;

  const legacyRows = countRows(LEGACY_TABLE);
  if (legacyRows === 0) {
    setUserVersion(V2_SPLIT);
    return;
  }

  if (countRows("jobs") > 0) {
    throw new Error(
      "Cannot migrate legacy schema: split tables already contain data",
    );
  }

  const migrate = sqliteDb.transaction(() => {
    sqliteDb.exec(`
      INSERT INTO jobs (
        id, company_id, position, due_date, job_url, status, application_status,
        archived, pinned, pinned_at, status_updated_at, interview_date, created_at, updated_at
      )
      SELECT
        id, company_id, position, due_date, job_url, status, application_status,
        archived, pinned, pinned_at, status_updated_at, interview_date, created_at, updated_at
      FROM job_applications
    `);

    sqliteDb.exec(`
      INSERT INTO resumes (
        job_id, template_id, original_resume, parsed_resume, tailored_resume
      )
      SELECT
        id,
        template_id,
        COALESCE(original_resume, ''),
        parsed_resume,
        tailored_resume
      FROM job_applications
    `);

    sqliteDb.exec(`
      INSERT INTO checklists (
        job_id, job_description, checklist
      )
      SELECT
        id,
        job_description,
        checklist
      FROM job_applications
    `);

    sqliteDb.exec(`
      INSERT INTO scores (
        job_id, match_percentage
      )
      SELECT
        id,
        match_percentage
      FROM job_applications
    `);

    sqliteDb.exec(`
      INSERT INTO workflows (
        job_id, state
      )
      SELECT
        id,
        workflow_steps
      FROM job_applications
    `);

    const migratedRows = countRows("jobs");
    if (migratedRows !== legacyRows) {
      throw new Error(
        `Migration row count mismatch: legacy=${legacyRows}, jobs=${migratedRows}`,
      );
    }

    setUserVersion(V2_SPLIT);
  });

  migrate();
}

function dropLegacyTable(): void {
  if (!sqlite) throw new Error("Database not initialized");
  sqlite.exec(`DROP TABLE IF EXISTS ${LEGACY_TABLE}`);
}

export async function runMigrations(): Promise<void> {
  if (!sqlite) throw new Error("Database not initialized");

  const targetSchemaVersion = getTargetSchemaVersion();
  const hasLegacyTableBefore = tableExists(LEGACY_TABLE);
  const hasSplitTablesBefore = tableExists("jobs");
  const userVersion = getUserVersion();

  let currentVersion = inferSchemaVersion(
    userVersion,
    hasLegacyTableBefore,
    hasSplitTablesBefore,
  );

  createSplitTables();

  if (!hasLegacyTableBefore && !hasSplitTablesBefore) {
    setUserVersion(targetSchemaVersion);
    log.info(
      `Initialized fresh schema at version ${targetSchemaVersion} (target)`,
    );
    return;
  }

  if (currentVersion < V2_SPLIT && hasLegacyTableBefore) {
    if (targetSchemaVersion >= V3_SPLIT_CLEAN) {
      throw new LegacyUpgradeRequiredError();
    }

    patchLegacyColumnsForMigration();
    migrateLegacyToSplit();
    currentVersion = V2_SPLIT;
    log.info("Migrated schema v1 -> v2 (legacy table retained)");
  }

  if (targetSchemaVersion >= V3_SPLIT_CLEAN && currentVersion === V2_SPLIT) {
    dropLegacyTable();
    setUserVersion(V3_SPLIT_CLEAN);
    currentVersion = V3_SPLIT_CLEAN;
    log.info("Migrated schema v2 -> v3 (legacy table dropped)");
  }

  if (currentVersion === 0) {
    setUserVersion(targetSchemaVersion);
    currentVersion = targetSchemaVersion;
  }

  log.info(
    `Migrations complete (schema=${currentVersion}, target=${targetSchemaVersion})`,
  );
}
