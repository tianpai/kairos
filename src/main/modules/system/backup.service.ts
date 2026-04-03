import { join } from "node:path";
import { app } from "electron";
import {
  ensureBackupImportNotInProgress,
  exportResumeDataBackup,
  importResumeDataBackup,
  isBackupImportInProgress,
} from "../persistence";
import type { BackupExportResult, BackupImportResult } from "@shared/backup";

function createDefaultBackupFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `kairos-backup-${date}.zip`;
}

export function getDefaultBackupPath(): string {
  return join(app.getPath("documents"), createDefaultBackupFilename());
}

export async function exportBackup(
  destinationPath: string,
): Promise<BackupExportResult> {
  return exportResumeDataBackup(destinationPath);
}

export async function importBackup(
  backupZipPath: string,
): Promise<BackupImportResult> {
  return importResumeDataBackup(backupZipPath);
}

export { ensureBackupImportNotInProgress, isBackupImportInProgress };
