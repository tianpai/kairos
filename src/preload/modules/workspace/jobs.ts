import { ipcRenderer } from "electron";
import type {
  JobApplication,
  JobApplicationSummary,
  JobsCreateFromExistingPayload,
  JobsCreatePayload,
  JobsCreateResult,
  JobsListQuery,
  JobsPatchPayload,
} from "../../../shared/type/jobs-ipc";
import type { IpcSuccessResponse } from "../../../shared/type/ipc";

const jobs = {
  create: (data: JobsCreatePayload): Promise<JobsCreateResult> =>
    ipcRenderer.invoke("jobs:create", data),
  createFromExisting: (
    data: JobsCreateFromExistingPayload,
  ): Promise<JobsCreateResult> =>
    ipcRenderer.invoke("jobs:createFromExisting", data),
  list: (query: JobsListQuery = {}): Promise<JobApplication[]> =>
    ipcRenderer.invoke("jobs:list", query),
  get: (id: string): Promise<JobApplicationSummary> =>
    ipcRenderer.invoke("jobs:get", id),
  patch: (id: string, data: JobsPatchPayload): Promise<IpcSuccessResponse> =>
    ipcRenderer.invoke("jobs:patch", id, data),
  delete: (id: string): Promise<IpcSuccessResponse> =>
    ipcRenderer.invoke("jobs:delete", id),
  deleteAll: (): Promise<IpcSuccessResponse> =>
    ipcRenderer.invoke("jobs:deleteAll"),
};

export { jobs };
