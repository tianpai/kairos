import { ipcRenderer } from "electron";
import type {
  WfState,
  WorkflowAiPartial,
  WorkflowPushState,
} from "../../../shared/type/workflow";

type Unsubscribe = () => void;

interface JobCreatePayload {
  resumeSource: "upload" | "existing";
  resumeFile?: { fileName: string; data: ArrayBuffer };
  sourceJobId?: string;
  templateId: string;
  jobDescription: string;
  jobUrl?: string;
}

export const job = {
  create: (payload: JobCreatePayload): Promise<{ jobId: string }> =>
    ipcRenderer.invoke("job:create", payload),
};

export const workflow = {
  start: (jobId: string, workflowName: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("workflow:start", jobId, workflowName),
  retry: (jobId: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("workflow:retry", jobId),
  getState: (jobId: string): Promise<WfState | null> =>
    ipcRenderer.invoke("workflow:getState", jobId),
  onPushState: (callback: (payload: WorkflowPushState) => void): Unsubscribe => {
    const handler = (_: unknown, payload: WorkflowPushState) =>
      callback(payload);
    ipcRenderer.on("workflow:pushState", handler);
    return () => ipcRenderer.removeListener("workflow:pushState", handler);
  },
  onAiPartial: (callback: (payload: WorkflowAiPartial) => void): Unsubscribe => {
    const handler = (_: unknown, payload: WorkflowAiPartial) =>
      callback(payload);
    ipcRenderer.on("workflow:aiPartial", handler);
    return () => ipcRenderer.removeListener("workflow:aiPartial", handler);
  },
};
