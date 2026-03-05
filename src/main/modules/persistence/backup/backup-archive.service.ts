import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";
import JSZip from "jszip";
import { app } from "electron";
import log from "electron-log/main";
import { z } from "zod";
import { getSqlite, supportsLegacyBackupImport } from "../db/database.service";
import type {
  BackupExportResult,
  BackupImportResult,
  BackupManifest,
} from "../../../../shared/backup";

type BackupSchemaKind = "legacy" | "split";

const BACKUP_FORMAT_VERSION = 1;
const DB_SCHEMA_VERSION = 2;
const DB_ENTRY_PATH = "data/kairos.db";
const LEGACY_TABLES = ["companies", "job_applications"] as const;
const SPLIT_TABLES = [
  "companies",
  "jobs",
  "resumes",
  "checklists",
  "scores",
  "workflows",
] as const;
const LEGACY_BACKUP_BLOCK_MESSAGE =
  "Backup is from pre-v0.3 schema. Restore in v0.3.x first, then re-export.";

const backupManifestSchema = z.object({
  backupFormatVersion: z.number().int().positive(),
  appVersion: z.string().min(1),
  dbSchemaVersion: z.number().int().nonnegative(),
  createdAt: z.string().min(1),
  files: z.array(
    z.object({
      path: z.string().min(1),
      sizeBytes: z.number().int().nonnegative(),
      sha256: z.string().regex(/^[a-f0-9]{64}$/i),
    }),
  ),
});

let importInProgress = false;

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function ensureZipExtension(filePath: string): string {
  return filePath.toLowerCase().endsWith(".zip") ? filePath : `${filePath}.zip`;
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function quoteString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function isDatabaseAttached(db: Database.Database, name: string): boolean {
  const databases = db.pragma("database_list") as { name: string }[];
  return databases.some((entry) => entry.name === name);
}

function detachImportedIfAttached(db: Database.Database): void {
  if (!isDatabaseAttached(db, "imported")) return;
  db.exec("DETACH DATABASE imported");
}

function getTableColumns(
  db: Database.Database,
  databaseName: "main" | "imported",
  tableName: string,
): string[] {
  const rows = db
    .prepare(`PRAGMA ${databaseName}.table_info(${quoteIdentifier(tableName)})`)
    .all() as { name: string }[];
  return rows.map((row) => row.name);
}

function getUserTableNames(
  db: Database.Database,
  databaseName: "main" | "imported",
): Set<string> {
  const rows = db
    .prepare(
      `SELECT name FROM ${databaseName}.sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`,
    )
    .all() as { name: string }[];
  return new Set(rows.map((row) => row.name));
}

function hasAllTables(
  tableSet: Set<string>,
  requiredTables: readonly string[],
): boolean {
  return requiredTables.every((tableName) => tableSet.has(tableName));
}

function detectBackupSchema(tableSet: Set<string>): BackupSchemaKind {
  if (hasAllTables(tableSet, SPLIT_TABLES)) return "split";
  if (hasAllTables(tableSet, LEGACY_TABLES)) return "legacy";
  throw new Error("Backup does not match a supported database schema");
}

function validateImportedDbFile(tempDbPath: string): BackupSchemaKind {
  const importedDb = new Database(tempDbPath, {
    readonly: true,
    fileMustExist: true,
  });

  try {
    const quickCheck = importedDb.pragma("quick_check", {
      simple: true,
    }) as string;

    if (quickCheck !== "ok") {
      throw new Error(`SQLite integrity check failed: ${quickCheck}`);
    }

    const tableSet = getUserTableNames(importedDb, "main");
    return detectBackupSchema(tableSet);
  } finally {
    importedDb.close();
  }
}

function clearMainSplitTables(db: Database.Database): void {
  db.exec("DELETE FROM workflows");
  db.exec("DELETE FROM scores");
  db.exec("DELETE FROM checklists");
  db.exec("DELETE FROM resumes");
  db.exec("DELETE FROM jobs");
  db.exec("DELETE FROM companies");
}

function copySharedColumnsBetweenTables(
  db: Database.Database,
  tableName: string,
): void {
  const targetColumns = getTableColumns(db, "main", tableName);
  const sourceColumns = getTableColumns(db, "imported", tableName);
  const sharedColumns = targetColumns.filter((column) =>
    sourceColumns.includes(column),
  );

  if (sharedColumns.length === 0) {
    throw new Error(`No compatible columns found for table: ${tableName}`);
  }

  const columnList = sharedColumns.map(quoteIdentifier).join(", ");
  db.exec(
    `INSERT INTO ${quoteIdentifier(tableName)} (${columnList}) ` +
      `SELECT ${columnList} FROM imported.${quoteIdentifier(tableName)}`,
  );
}

function sourceLegacyColumnExpr(
  legacyColumns: string[],
  column: string,
  fallbackExpr: string,
): string {
  return legacyColumns.includes(column) ? quoteIdentifier(column) : fallbackExpr;
}

function convertLegacyImportToSplit(db: Database.Database): void {
  const legacyColumns = getTableColumns(db, "imported", "job_applications");

  copySharedColumnsBetweenTables(db, "companies");

  const jobsSelect = [
    "id",
    "company_id",
    "position",
    "due_date",
    sourceLegacyColumnExpr(legacyColumns, "job_url", "NULL"),
    sourceLegacyColumnExpr(legacyColumns, "status", "'active'"),
    sourceLegacyColumnExpr(legacyColumns, "application_status", "NULL"),
    sourceLegacyColumnExpr(legacyColumns, "archived", "0"),
    sourceLegacyColumnExpr(legacyColumns, "pinned", "0"),
    sourceLegacyColumnExpr(legacyColumns, "pinned_at", "NULL"),
    sourceLegacyColumnExpr(legacyColumns, "status_updated_at", "NULL"),
    sourceLegacyColumnExpr(legacyColumns, "interview_date", "NULL"),
    "created_at",
    "updated_at",
  ].join(", ");

  db.exec(`
    INSERT INTO jobs (
      id, company_id, position, due_date, job_url, status, application_status,
      archived, pinned, pinned_at, status_updated_at, interview_date, created_at, updated_at
    )
    SELECT ${jobsSelect}
    FROM imported.job_applications
  `);

  const originalResumeExpr = sourceLegacyColumnExpr(
    legacyColumns,
    "original_resume",
    "''",
  );
  const parsedResumeExpr = sourceLegacyColumnExpr(
    legacyColumns,
    "parsed_resume",
    "NULL",
  );
  const tailoredResumeExpr = sourceLegacyColumnExpr(
    legacyColumns,
    "tailored_resume",
    "NULL",
  );

  db.exec(`
    INSERT INTO resumes (
      job_id, template_id, original_resume, parsed_resume, tailored_resume
    )
    SELECT
      id,
      ${sourceLegacyColumnExpr(legacyColumns, "template_id", "''")},
      COALESCE(${originalResumeExpr}, ''),
      ${parsedResumeExpr},
      ${tailoredResumeExpr}
    FROM imported.job_applications
  `);

  db.exec(`
    INSERT INTO checklists (
      job_id, job_description, checklist
    )
    SELECT
      id,
      ${sourceLegacyColumnExpr(legacyColumns, "job_description", "NULL")},
      ${sourceLegacyColumnExpr(legacyColumns, "checklist", "NULL")}
    FROM imported.job_applications
  `);

  db.exec(`
    INSERT INTO scores (
      job_id, match_percentage
    )
    SELECT
      id,
      ${sourceLegacyColumnExpr(legacyColumns, "match_percentage", "0")}
    FROM imported.job_applications
  `);

  db.exec(`
    INSERT INTO workflows (
      job_id, state
    )
    SELECT
      id,
      ${sourceLegacyColumnExpr(legacyColumns, "workflow_steps", "NULL")}
    FROM imported.job_applications
  `);
}

function restoreImportedDb(
  tempDbPath: string,
  importedSchema: BackupSchemaKind,
): void {
  const sqlite = getSqlite();
  const hadForeignKeysEnabled = Boolean(
    Number(sqlite.pragma("foreign_keys", { simple: true })),
  );

  try {
    detachImportedIfAttached(sqlite);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to cleanup previous import state: ${message}`);
  }

  let restoreError: unknown;
  try {
    sqlite.exec(`ATTACH DATABASE ${quoteString(tempDbPath)} AS imported`);
    sqlite.pragma("foreign_keys = OFF");

    const restoreTransaction = sqlite.transaction(() => {
      clearMainSplitTables(sqlite);

      if (importedSchema === "split") {
        for (const tableName of SPLIT_TABLES) {
          copySharedColumnsBetweenTables(sqlite, tableName);
        }
        return;
      }

      if (!supportsLegacyBackupImport()) {
        throw new Error(LEGACY_BACKUP_BLOCK_MESSAGE);
      }

      convertLegacyImportToSplit(sqlite);
    });

    restoreTransaction();
  } catch (error) {
    restoreError = error;
  }

  let detachError: Error | null = null;
  try {
    detachImportedIfAttached(sqlite);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error("[Backup] Failed to detach imported database:", message);
    detachError = new Error(`Failed to detach imported database: ${message}`);
  } finally {
    sqlite.pragma(`foreign_keys = ${hadForeignKeysEnabled ? "ON" : "OFF"}`);
  }

  if (detachError) {
    throw detachError;
  }

  if (restoreError) {
    throw restoreError;
  }
}

function pruneExportDbToSplitTables(tempDbPath: string): void {
  const exportDb = new Database(tempDbPath);

  try {
    const tableSet = getUserTableNames(exportDb, "main");

    if (!hasAllTables(tableSet, SPLIT_TABLES)) {
      throw new Error("Current database is missing split-schema tables");
    }

    const tablesToDrop = [...tableSet].filter(
      (tableName) => !SPLIT_TABLES.includes(tableName as (typeof SPLIT_TABLES)[number]),
    );

    for (const tableName of tablesToDrop) {
      exportDb.exec(`DROP TABLE IF EXISTS ${quoteIdentifier(tableName)}`);
    }
  } finally {
    exportDb.close();
  }
}

async function parseManifest(zip: JSZip): Promise<BackupManifest> {
  const manifestEntry = zip.file("manifest.json");
  if (!manifestEntry) {
    throw new Error("Backup is missing manifest.json");
  }

  const rawManifest = await manifestEntry.async("string");
  return backupManifestSchema.parse(JSON.parse(rawManifest));
}

export function isBackupImportInProgress(): boolean {
  return importInProgress;
}

export function ensureBackupImportNotInProgress(): void {
  if (importInProgress) {
    throw new Error("Backup import is in progress. Please wait.");
  }
}

export async function exportResumeDataBackup(
  destinationPath: string,
): Promise<BackupExportResult> {
  if (importInProgress) {
    return {
      success: false,
      error: "Backup import is in progress. Please wait.",
    };
  }

  const normalizedDestinationPath = destinationPath.trim();
  if (!normalizedDestinationPath) {
    return { success: false, error: "Invalid destination path" };
  }

  const resolvedDestinationPath = ensureZipExtension(normalizedDestinationPath);
  const tempDir = await mkdtemp(join(tmpdir(), "kairos-backup-"));
  const tempDbPath = join(tempDir, "kairos.db");

  try {
    const sqlite = getSqlite();
    await sqlite.backup(tempDbPath);
    pruneExportDbToSplitTables(tempDbPath);

    const dbBuffer = await readFile(tempDbPath);
    const manifest: BackupManifest = {
      backupFormatVersion: BACKUP_FORMAT_VERSION,
      appVersion: app.getVersion(),
      dbSchemaVersion: DB_SCHEMA_VERSION,
      createdAt: new Date().toISOString(),
      files: [
        {
          path: DB_ENTRY_PATH,
          sizeBytes: dbBuffer.byteLength,
          sha256: sha256(dbBuffer),
        },
      ],
    };

    const zip = new JSZip();
    zip.file("manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
    zip.file(DB_ENTRY_PATH, dbBuffer);

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });

    await mkdir(dirname(resolvedDestinationPath), { recursive: true });
    await writeFile(resolvedDestinationPath, zipBuffer);

    return {
      success: true,
      path: resolvedDestinationPath,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error("[Backup] Export failed:", message);
    return {
      success: false,
      error: message,
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function importResumeDataBackup(
  backupZipPath: string,
): Promise<BackupImportResult> {
  if (importInProgress) {
    return {
      success: false,
      error: "Another backup import is already running.",
    };
  }

  const normalizedZipPath = backupZipPath.trim();
  if (!normalizedZipPath) {
    return { success: false, error: "Invalid backup file path" };
  }

  importInProgress = true;

  const tempDir = await mkdtemp(join(tmpdir(), "kairos-import-"));
  const tempDbPath = join(tempDir, "imported-kairos.db");

  try {
    const zipBuffer = await readFile(normalizedZipPath);
    const zip = await JSZip.loadAsync(zipBuffer);

    const manifest = await parseManifest(zip);
    if (manifest.backupFormatVersion !== BACKUP_FORMAT_VERSION) {
      throw new Error(
        `Unsupported backup format version: ${manifest.backupFormatVersion}`,
      );
    }

    if (manifest.dbSchemaVersion > DB_SCHEMA_VERSION) {
      throw new Error(
        `Unsupported backup schema version: ${manifest.dbSchemaVersion}`,
      );
    }

    const dbManifest = manifest.files.find(
      (file) => file.path === DB_ENTRY_PATH,
    );
    if (!dbManifest) {
      throw new Error("Backup manifest is missing data/kairos.db");
    }

    const dbEntry = zip.file(DB_ENTRY_PATH);
    if (!dbEntry) {
      throw new Error("Backup zip is missing data/kairos.db");
    }

    const dbBuffer = await dbEntry.async("nodebuffer");

    if (dbBuffer.byteLength !== dbManifest.sizeBytes) {
      throw new Error("Backup database size does not match manifest");
    }

    if (sha256(dbBuffer) !== dbManifest.sha256.toLowerCase()) {
      throw new Error("Backup checksum mismatch");
    }

    await writeFile(tempDbPath, dbBuffer);

    const importedSchema = validateImportedDbFile(tempDbPath);
    if (importedSchema === "legacy" && !supportsLegacyBackupImport()) {
      throw new Error(LEGACY_BACKUP_BLOCK_MESSAGE);
    }

    restoreImportedDb(tempDbPath, importedSchema);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error("[Backup] Import failed:", message);
    return { success: false, error: message };
  } finally {
    importInProgress = false;
    await rm(tempDir, { recursive: true, force: true });
  }
}
