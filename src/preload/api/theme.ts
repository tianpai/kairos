import { ipcRenderer } from "electron";

export const theme = {
  get: (): Promise<"system" | "light" | "dark"> =>
    ipcRenderer.invoke("theme:get"),
  set: (themeSource: "system" | "light" | "dark"): Promise<void> =>
    ipcRenderer.invoke("theme:set", themeSource),
  getCurrent: (): Promise<"light" | "dark"> =>
    ipcRenderer.invoke("theme:getCurrent"),
};
