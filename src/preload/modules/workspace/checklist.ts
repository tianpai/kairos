import { ipcRenderer } from "electron";
import type { Checklist } from "../../../shared/type/checklist";
import type { IpcSuccessResponse } from "../../../shared/type/ipc";

export const checklist = {
  get: (id: string): Promise<Checklist | null> =>
    ipcRenderer.invoke("checklist:get", id),
  getKw: (id: string): Promise<string[]> =>
    ipcRenderer.invoke("checklist:getKw", id),
  updateKw: (id: string, keywords: string[]): Promise<IpcSuccessResponse> =>
    ipcRenderer.invoke("checklist:updateKw", id, keywords),
};
