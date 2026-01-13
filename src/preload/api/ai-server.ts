import { ipcRenderer } from "electron";

export const aiServer = {
  getInfo: (): Promise<{ port: number; baseURL: string; wsURL: string }> =>
    ipcRenderer.invoke("aiServer:getInfo"),
};
