import { ipcRenderer } from "electron";
import type {
  BackupExportResult,
  BackupImportResult,
} from "../../shared/backup";

export const backup = {
  exportResumeData: (): Promise<BackupExportResult> =>
    ipcRenderer.invoke("backup:exportResumeData"),
  importResumeData: (): Promise<BackupImportResult> =>
    ipcRenderer.invoke("backup:importResumeData"),
};
