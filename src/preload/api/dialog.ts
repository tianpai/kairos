import { ipcRenderer } from "electron";

export const dialog = {
  selectFolder: (): Promise<string | null> =>
    ipcRenderer.invoke("dialog:selectFolder"),
};
