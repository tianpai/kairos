import { BrowserWindow } from "electron";
import log from "electron-log/main";
import { guardedHandle as handle } from "../runtime/ipc";
import { getWfEngine } from "./index";
import { onWorkflowEvent } from "./workflow-events";

function broadcast<T>(channel: string, payload: T): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(channel, payload);
  }
}

export function registerWfHandlers(): void {
  handle("workflow:start", async (_event, jobId: string, workflowName: string) => {
    try {
      await getWfEngine().start(jobId, workflowName);
      return { success: true };
    } catch (error) {
      log.error("workflow:start failed", error);
      throw error;
    }
  });

  handle("workflow:retry", async (_event, jobId: string) => {
    try {
      await getWfEngine().retry(jobId);
      return { success: true };
    } catch (error) {
      log.error("workflow:retry failed", error);
      throw error;
    }
  });

  handle("workflow:getState", (_event, jobId: string) => {
    try {
      return getWfEngine().getState(jobId);
    } catch (error) {
      log.error("workflow:getState failed", error);
      throw error;
    }
  });

  // Broadcast engine events to all renderer windows
  onWorkflowEvent("workflow:pushState", (payload) =>
    broadcast("workflow:pushState", payload),
  );
  onWorkflowEvent("workflow:aiPartial", (payload) =>
    broadcast("workflow:aiPartial", payload),
  );
}
