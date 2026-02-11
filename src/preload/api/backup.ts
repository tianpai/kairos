import { ipcRenderer } from "electron";
import type {
  BackupExportProgress,
  BackupExportResult,
  BackupImportProgress,
  BackupImportResult,
} from "../../shared/backup";

export const backup = {
  exportResumeData: (): Promise<BackupExportResult> =>
    ipcRenderer.invoke("backup:exportResumeData"),
  importResumeData: (): Promise<BackupImportResult> =>
    ipcRenderer.invoke("backup:importResumeData"),
  onExportProgress: (
    callback: (progress: BackupExportProgress) => void,
  ): (() => void) => {
    const handler = (_: unknown, progress: BackupExportProgress) =>
      callback(progress);
    ipcRenderer.on("backup:exportProgress", handler);
    return () => ipcRenderer.removeListener("backup:exportProgress", handler);
  },
  onImportProgress: (
    callback: (progress: BackupImportProgress) => void,
  ): (() => void) => {
    const handler = (_: unknown, progress: BackupImportProgress) =>
      callback(progress);
    ipcRenderer.on("backup:importProgress", handler);
    return () => ipcRenderer.removeListener("backup:importProgress", handler);
  },
};
