import { ipcRenderer } from "electron";
import type { UpdateState } from "../../shared/updater";

export const updater = {
  check: (): Promise<UpdateState> => ipcRenderer.invoke("updater:check"),
  getState: (): Promise<UpdateState> => ipcRenderer.invoke("updater:getState"),
  getVersion: (): Promise<string> => ipcRenderer.invoke("updater:getVersion"),
  isPackaged: (): Promise<boolean> => ipcRenderer.invoke("updater:isPackaged"),
  openReleasesPage: (): Promise<void> =>
    ipcRenderer.invoke("updater:openReleasesPage"),
  download: (): Promise<void> => ipcRenderer.invoke("updater:download"),
  quitAndInstall: (): Promise<void> =>
    ipcRenderer.invoke("updater:quitAndInstall"),
};
