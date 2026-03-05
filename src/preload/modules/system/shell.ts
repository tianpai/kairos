import { ipcRenderer } from "electron";

export const shell = {
  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke("shell:openExternal", url),
};
