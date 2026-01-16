import { ipcRenderer } from "electron";

export const jobs = {
  // CRUD
  create: (data: unknown): Promise<{ id: string }> =>
    ipcRenderer.invoke("jobs:create", data),
  createFromExisting: (data: unknown): Promise<{ id: string }> =>
    ipcRenderer.invoke("jobs:createFromExisting", data),
  getAll: (): Promise<Array<unknown>> => ipcRenderer.invoke("jobs:getAll"),
  get: (id: string): Promise<unknown> => ipcRenderer.invoke("jobs:get", id),
  update: (id: string, data: unknown): Promise<unknown> =>
    ipcRenderer.invoke("jobs:update", id, data),
  delete: (id: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("jobs:delete", id),
  deleteAll: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("jobs:deleteAll"),
  saveResume: (id: string, data: unknown): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("jobs:saveResume", id, data),
  updateJobDescription: (
    id: string,
    data: unknown,
  ): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("jobs:updateJobDescription", id, data),
  // Workflow data
  saveParsedResume: (
    id: string,
    data: unknown,
  ): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("jobs:saveParsedResume", id, data),
  saveTailoredResume: (
    id: string,
    data: unknown,
  ): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("jobs:saveTailoredResume", id, data),
  saveChecklist: (id: string, data: unknown): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("jobs:saveChecklist", id, data),
  saveMatchScore: (id: string, data: unknown): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("jobs:saveMatchScore", id, data),
  saveWorkflowState: (
    id: string,
    data: unknown,
  ): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("jobs:saveWorkflowState", id, data),
};
