import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";
import JSZip from "jszip";
import { app } from "electron";
import log from "electron-log/main";
import { getSqlite } from "./database.service";
import { z } from "zod";
import type {
  BackupExportProgress,
  BackupExportResult,
  BackupImportProgress,
  BackupImportResult,
  BackupManifest,
} from "../../shared/backup";

const BACKUP_FORMAT_VERSION = 1;
const DB_SCHEMA_VERSION = 1;
const DB_ENTRY_PATH = "data/kairos.db";
const REQUIRED_TABLES = ["companies", "job_applications"] as const;

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

function createDefaultBackupFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `kairos-backup-${date}.zip`;
}

function ensureZipExtension(filePath: string): string {
  return filePath.toLowerCase().endsWith(".zip") ? filePath : `${filePath}.zip`;
}

function emitProgress(
  onProgress: ((progress: BackupExportProgress) => void) | undefined,
  progress: BackupExportProgress,
): void {
  if (!onProgress) return;
  onProgress(progress);
}

function emitImportProgress(
  onProgress: ((progress: BackupImportProgress) => void) | undefined,
  progress: BackupImportProgress,
): void {
  if (!onProgress) return;
  onProgress(progress);
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function quoteString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function isDatabaseAttached(db: Database.Database, name: string): boolean {
  const databases = db.pragma("database_list") as Array<{ name: string }>;
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
): Array<string> {
  const rows = db
    .prepare(
      `PRAGMA ${databaseName}.table_info(${quoteIdentifier(tableName)})`,
    )
    .all() as Array<{ name: string }>;
  return rows.map((row) => row.name);
}

function validateImportedDbFile(tempDbPath: string): void {
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

    const rows = importedDb
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (?, ?)",
      )
      .all("companies", "job_applications") as Array<{ name: string }>;

    const tableSet = new Set(rows.map((row) => row.name));
    for (const tableName of REQUIRED_TABLES) {
      if (!tableSet.has(tableName)) {
        throw new Error(`Backup is missing required table: ${tableName}`);
      }
    }
  } finally {
    importedDb.close();
  }
}

function restoreImportedDb(tempDbPath: string): void {
  const sqlite = getSqlite();
  const hadForeignKeys = Number(
    sqlite.pragma("foreign_keys", { simple: true }),
  );

  // Cleanup any stale attached DB from prior failed attempts.
  try {
    detachImportedIfAttached(sqlite);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to cleanup previous import state: ${message}`);
  }

  try {
    sqlite.exec(`ATTACH DATABASE ${quoteString(tempDbPath)} AS imported`);
    sqlite.pragma("foreign_keys = OFF");

    const restoreTransaction = sqlite.transaction(() => {
      sqlite.exec("DELETE FROM job_applications");
      sqlite.exec("DELETE FROM companies");

      for (const tableName of REQUIRED_TABLES) {
        const targetColumns = getTableColumns(sqlite, "main", tableName);
        const sourceColumns = getTableColumns(sqlite, "imported", tableName);

        const sharedColumns = targetColumns.filter((column) =>
          sourceColumns.includes(column),
        );

        if (sharedColumns.length === 0) {
          throw new Error(
            `No compatible columns found for table: ${tableName}`,
          );
        }

        const columnList = sharedColumns.map(quoteIdentifier).join(", ");
        sqlite.exec(
          `INSERT INTO ${quoteIdentifier(tableName)} (${columnList}) ` +
            `SELECT ${columnList} FROM imported.${quoteIdentifier(tableName)}`,
        );
      }
    });

    restoreTransaction();
  } finally {
    try {
      detachImportedIfAttached(sqlite);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("[Backup] Failed to detach imported database:", message);
      throw new Error(`Failed to detach imported database: ${message}`);
    } finally {
      sqlite.pragma(`foreign_keys = ${hadForeignKeys ? "ON" : "OFF"}`);
    }
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

export function getDefaultBackupPath(): string {
  return join(app.getPath("documents"), createDefaultBackupFilename());
}

export async function exportResumeDataBackup(
  destinationPath: string,
  onProgress?: (progress: BackupExportProgress) => void,
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

  emitProgress(onProgress, {
    stage: "starting",
    percent: 0,
    message: "Preparing backup...",
  });

  try {
    const sqlite = getSqlite();

    emitProgress(onProgress, {
      stage: "snapshotting",
      percent: 5,
      message: "Creating database snapshot...",
    });

    await sqlite.backup(tempDbPath, {
      progress: ({ totalPages, remainingPages }) => {
        if (!totalPages) return 0;
        const copied = totalPages - remainingPages;
        const ratio = Math.min(Math.max(copied / totalPages, 0), 1);
        emitProgress(onProgress, {
          stage: "snapshotting",
          percent: 5 + Math.round(ratio * 55),
          message: "Creating database snapshot...",
        });
        return 100;
      },
    });

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

    emitProgress(onProgress, {
      stage: "packaging",
      percent: 65,
      message: "Packaging backup zip...",
    });

    const zip = new JSZip();
    zip.file("manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
    zip.file(DB_ENTRY_PATH, dbBuffer);

    const zipBuffer = await zip.generateAsync(
      {
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 9 },
      },
      (metadata) => {
        const ratio = Math.min(Math.max(metadata.percent / 100, 0), 1);
        emitProgress(onProgress, {
          stage: "packaging",
          percent: 65 + Math.round(ratio * 30),
          message: "Packaging backup zip...",
        });
      },
    );

    emitProgress(onProgress, {
      stage: "writing",
      percent: 96,
      message: "Writing backup file...",
    });

    await mkdir(dirname(resolvedDestinationPath), { recursive: true });
    await writeFile(resolvedDestinationPath, zipBuffer);

    emitProgress(onProgress, {
      stage: "completed",
      percent: 100,
      message: "Backup complete",
    });

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
  onProgress?: (progress: BackupImportProgress) => void,
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

  emitImportProgress(onProgress, {
    stage: "starting",
    percent: 0,
    message: "Preparing import...",
  });

  try {
    emitImportProgress(onProgress, {
      stage: "reading",
      percent: 10,
      message: "Reading backup zip...",
    });

    const zipBuffer = await readFile(normalizedZipPath);
    const zip = await JSZip.loadAsync(zipBuffer);

    emitImportProgress(onProgress, {
      stage: "validating",
      percent: 30,
      message: "Validating manifest and checksum...",
    });

    const manifest = await parseManifest(zip);
    if (manifest.backupFormatVersion !== BACKUP_FORMAT_VERSION) {
      throw new Error(
        `Unsupported backup format version: ${manifest.backupFormatVersion}`,
      );
    }

    const dbManifest = manifest.files.find((file) => file.path === DB_ENTRY_PATH);
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
    validateImportedDbFile(tempDbPath);

    emitImportProgress(onProgress, {
      stage: "restoring",
      percent: 70,
      message: "Restoring data...",
    });

    restoreImportedDb(tempDbPath);

    emitImportProgress(onProgress, {
      stage: "completed",
      percent: 100,
      message: "Import complete",
    });

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
