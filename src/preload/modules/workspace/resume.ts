import { ipcRenderer } from "electron";
import type { IpcSuccessResponse } from "../../../shared/type/ipc";

// TODO: need better interface name later
export interface ResumeGetResult {
  templateId: string;
  jobDescription: string | null;
  originalResume: string;
  parsedResume: Record<string, unknown> | null;
  tailoredResume: Record<string, unknown> | null;
}

export const resume = {
  get: (id: string): Promise<ResumeGetResult> =>
    ipcRenderer.invoke("resume:get", id),
  save: (id: string, data: unknown): Promise<IpcSuccessResponse> =>
    ipcRenderer.invoke("resume:save", id, data),
  getTemplateId: (id: string): Promise<string> =>
    ipcRenderer.invoke("resume:getTemplateId", id),
};
