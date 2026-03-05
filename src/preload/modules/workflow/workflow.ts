import { ipcRenderer } from "electron";
import type {
  WorkflowAiPartial,
  WorkflowCreateApplicationsPayload,
  WorkflowCreateApplicationsResult,
  WorkflowGetStatePayload,
  WorkflowPushState,
  WorkflowRetryPayload,
  WorkflowStartTailoringPayload,
} from "../../../shared/type/workflow-ipc";
import type { WorkflowStepsData } from "../../../shared/type/workflow";

type Unsubscribe = () => void;

export const workflow = {
  startTailoring: (
    payload: WorkflowStartTailoringPayload,
  ): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("workflow:startTailoring", payload),
  retry: (
    payload: WorkflowRetryPayload,
  ): Promise<{ success: boolean; failedTasks: string[] }> =>
    ipcRenderer.invoke("workflow:retry", payload),
  createApplications: (
    payload: WorkflowCreateApplicationsPayload,
  ): Promise<WorkflowCreateApplicationsResult> =>
    ipcRenderer.invoke("workflow:createApplications", payload),
  getState: (
    payload: WorkflowGetStatePayload,
  ): Promise<{ workflow: WorkflowStepsData | null }> =>
    ipcRenderer.invoke("workflow:getState", payload),
  onPushState: (
    callback: (payload: WorkflowPushState) => void,
  ): Unsubscribe => {
    const handler = (_: unknown, payload: WorkflowPushState) =>
      callback(payload);
    ipcRenderer.on("workflow:pushState", handler);
    return () => ipcRenderer.removeListener("workflow:pushState", handler);
  },
  onAiPartial: (
    callback: (payload: WorkflowAiPartial) => void,
  ): Unsubscribe => {
    const handler = (_: unknown, payload: WorkflowAiPartial) =>
      callback(payload);
    ipcRenderer.on("workflow:aiPartial", handler);
    return () => ipcRenderer.removeListener("workflow:aiPartial", handler);
  },
};
