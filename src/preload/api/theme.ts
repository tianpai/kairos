import { ipcRenderer } from "electron";

export const theme = {
  get: (): Promise<"system" | "light" | "dark"> =>
    ipcRenderer.invoke("theme:get"),
  set: (theme: "system" | "light" | "dark"): Promise<void> =>
    ipcRenderer.invoke("theme:set", theme),
  getCurrent: (): Promise<"light" | "dark"> =>
    ipcRenderer.invoke("theme:getCurrent"),
};
