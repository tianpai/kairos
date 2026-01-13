import { ipcRenderer } from "electron";

export const fs = {
  writeFile: (
    folderPath: string,
    filename: string,
    data: ArrayBuffer,
  ): Promise<{ success: boolean; path: string }> =>
    ipcRenderer.invoke("fs:writeFile", folderPath, filename, data),
};
