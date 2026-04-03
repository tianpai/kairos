import { ipcMain } from "electron";
import { updaterService } from "../updater.service";
import type { UpdateState } from "@shared/updater";

export function registerUpdaterHandlers(): void {
  ipcMain.handle("updater:check", async (): Promise<UpdateState> => {
    return updaterService.checkForUpdates();
  });

  ipcMain.handle("updater:getState", (): UpdateState => {
    return updaterService.getState();
  });

  ipcMain.handle("updater:getVersion", (): string => {
    return updaterService.getCurrentVersion();
  });

  ipcMain.handle("updater:isPackaged", (): boolean => {
    return updaterService.isPackaged();
  });

  ipcMain.handle("updater:download", async (): Promise<void> => {
    await updaterService.downloadUpdate();
  });

  ipcMain.handle("updater:quitAndInstall", (): void => {
    updaterService.quitAndInstall();
  });
}
