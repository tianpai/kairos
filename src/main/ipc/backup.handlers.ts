import { dialog, ipcMain } from "electron";
import log from "electron-log/main";
import {
  exportResumeDataBackup,
  getDefaultBackupPath,
  importResumeDataBackup,
} from "../services/backup.service";
import type {
  BackupExportResult,
  BackupImportResult,
} from "../../shared/backup";

export function registerBackupHandlers(): void {
  ipcMain.handle("backup:exportResumeData", async (event) => {
    try {
      const result = await dialog.showSaveDialog({
        title: "Export Backup",
        defaultPath: getDefaultBackupPath(),
        filters: [{ name: "ZIP Archive", extensions: ["zip"] }],
        properties: ["createDirectory", "showOverwriteConfirmation"],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true } satisfies BackupExportResult;
      }

      return await exportResumeDataBackup(result.filePath, (progress) => {
        event.sender.send("backup:exportProgress", progress);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("[Backup] backup:exportResumeData failed:", message);
      return { success: false, error: message } satisfies BackupExportResult;
    }
  });

  ipcMain.handle("backup:importResumeData", async (event) => {
    try {
      const selection = await dialog.showOpenDialog({
        title: "Import Backup",
        properties: ["openFile"],
        filters: [{ name: "ZIP Archive", extensions: ["zip"] }],
      });

      if (selection.canceled || selection.filePaths.length === 0) {
        return { success: false, canceled: true } satisfies BackupImportResult;
      }

      return await importResumeDataBackup(
        selection.filePaths[0],
        (progress) => {
          event.sender.send("backup:importProgress", progress);
        },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("[Backup] backup:importResumeData failed:", message);
      return { success: false, error: message } satisfies BackupImportResult;
    }
  });
}
