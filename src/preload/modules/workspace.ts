import { ipcRenderer } from "electron";
import type {
  JobApplication,
  JobSummary,
  JobsListQuery,
  JobsPatchPayload,
} from "../../shared/type/jobs-ipc";
import type { Checklist } from "../../shared/type/checklist";
import type { IpcSuccessResponse } from "../../shared/type/ipc";

// TODO: need better interface name later
export interface ResumeGetResult {
  templateId: string;
  jobDescription: string | null;
  originalResume: string;
  parsedResume: Record<string, unknown> | null;
  tailoredResume: Record<string, unknown> | null;
}

export const jobs = {
  list: (query: JobsListQuery = {}): Promise<JobApplication[]> =>
    ipcRenderer.invoke("jobs:list", query),
  get: (id: string): Promise<JobSummary> => ipcRenderer.invoke("jobs:get", id),
  patch: (id: string, data: JobsPatchPayload): Promise<IpcSuccessResponse> =>
    ipcRenderer.invoke("jobs:patch", id, data),
  delete: (id: string): Promise<IpcSuccessResponse> =>
    ipcRenderer.invoke("jobs:delete", id),
  deleteAll: (): Promise<IpcSuccessResponse> =>
    ipcRenderer.invoke("jobs:deleteAll"),
};

export const resume = {
  get: (id: string): Promise<ResumeGetResult> =>
    ipcRenderer.invoke("resume:get", id),
  save: (id: string, data: unknown): Promise<IpcSuccessResponse> =>
    ipcRenderer.invoke("resume:save", id, data),
  getTemplateId: (id: string): Promise<string> =>
    ipcRenderer.invoke("resume:getTemplateId", id),
};

export const checklist = {
  get: (id: string): Promise<Checklist | null> =>
    ipcRenderer.invoke("checklist:get", id),
  getKw: (id: string): Promise<string[]> =>
    ipcRenderer.invoke("checklist:getKw", id),
  updateKw: (id: string, keywords: string[]): Promise<IpcSuccessResponse> =>
    ipcRenderer.invoke("checklist:updateKw", id, keywords),
};
