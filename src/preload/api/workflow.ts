import { ipcRenderer } from "electron";
import type {
  WorkflowAiPartial,
  WorkflowCompleted,
  WorkflowGetStatePayload,
  WorkflowRetryPayload,
  WorkflowStartPayload,
  WorkflowStateChanged,
  WorkflowTaskCompleted,
  WorkflowTaskFailed,
} from "../../shared/type/workflow-ipc";
import type { WorkflowStepsData } from "../../shared/type/workflow";

type Unsubscribe = () => void;

export const workflow = {
  start: (payload: WorkflowStartPayload): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("workflow:start", payload),
  retry: (
    payload: WorkflowRetryPayload,
  ): Promise<{ success: boolean; failedTasks: Array<string> }> =>
    ipcRenderer.invoke("workflow:retry", payload),
  getState: (
    payload: WorkflowGetStatePayload,
  ): Promise<{ workflow: WorkflowStepsData | null }> =>
    ipcRenderer.invoke("workflow:getState", payload),
  onStateChanged: (
    callback: (payload: WorkflowStateChanged) => void,
  ): Unsubscribe => {
    const handler = (_: unknown, payload: WorkflowStateChanged) =>
      callback(payload);
    ipcRenderer.on("workflow:stateChanged", handler);
    return () => ipcRenderer.removeListener("workflow:stateChanged", handler);
  },
  onTaskCompleted: (
    callback: (payload: WorkflowTaskCompleted) => void,
  ): Unsubscribe => {
    const handler = (_: unknown, payload: WorkflowTaskCompleted) =>
      callback(payload);
    ipcRenderer.on("workflow:taskCompleted", handler);
    return () => ipcRenderer.removeListener("workflow:taskCompleted", handler);
  },
  onTaskFailed: (
    callback: (payload: WorkflowTaskFailed) => void,
  ): Unsubscribe => {
    const handler = (_: unknown, payload: WorkflowTaskFailed) =>
      callback(payload);
    ipcRenderer.on("workflow:taskFailed", handler);
    return () => ipcRenderer.removeListener("workflow:taskFailed", handler);
  },
  onCompleted: (
    callback: (payload: WorkflowCompleted) => void,
  ): Unsubscribe => {
    const handler = (_: unknown, payload: WorkflowCompleted) =>
      callback(payload);
    ipcRenderer.on("workflow:completed", handler);
    return () => ipcRenderer.removeListener("workflow:completed", handler);
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
