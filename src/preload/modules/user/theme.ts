import { ipcRenderer } from "electron";
import type { ThemeSource, ThemeState } from "../../../shared/type/theme";

export const theme = {
  get: (): Promise<ThemeState> => ipcRenderer.invoke("theme:get"),
  set: (themeSource: ThemeSource): Promise<void> =>
    ipcRenderer.invoke("theme:set", themeSource),
};
