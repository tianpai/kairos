import { ipcRenderer } from "electron";
import type {
  BackupExportResult,
  BackupImportResult,
} from "../../shared/backup";
import type { UpdateState } from "../../shared/updater";

export const backup = {
  exportResumeData: (): Promise<BackupExportResult> =>
    ipcRenderer.invoke("backup:exportResumeData"),
  importResumeData: (): Promise<BackupImportResult> =>
    ipcRenderer.invoke("backup:importResumeData"),
};

export const dialog = {
  selectFolder: (): Promise<string | null> =>
    ipcRenderer.invoke("dialog:selectFolder"),
};

export const fs = {
  writeFile: (
    folderPath: string,
    filename: string,
    data: ArrayBuffer,
  ): Promise<{ success: boolean; path: string }> =>
    ipcRenderer.invoke("fs:writeFile", folderPath, filename, data),
};

export const shell = {
  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke("shell:openExternal", url),
};

export const updater = {
  check: (): Promise<UpdateState> => ipcRenderer.invoke("updater:check"),
  getState: (): Promise<UpdateState> => ipcRenderer.invoke("updater:getState"),
  getVersion: (): Promise<string> => ipcRenderer.invoke("updater:getVersion"),
  isPackaged: (): Promise<boolean> => ipcRenderer.invoke("updater:isPackaged"),
  download: (): Promise<void> => ipcRenderer.invoke("updater:download"),
  quitAndInstall: (): Promise<void> =>
    ipcRenderer.invoke("updater:quitAndInstall"),
};
