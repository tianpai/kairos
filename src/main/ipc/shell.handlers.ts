import { ipcMain, shell } from "electron";

export function registerShellHandlers(): void {
  ipcMain.handle("shell:openExternal", (_, url: string) => {
    return shell.openExternal(url);
  });
}
