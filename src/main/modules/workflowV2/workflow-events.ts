import { EventEmitter } from "node:events";
import type { TaskName } from "./tasks/task-base";
import type { WfState } from "./engine";

export interface WorkflowPushState {
  jobId: string;
  state: WfState | null;
}

export interface WorkflowAiPartial {
  jobId: string;
  taskName: TaskName;
  partial: unknown;
}

type WorkflowEventMap = {
  "workflow:pushState": WorkflowPushState;
  "workflow:aiPartial": WorkflowAiPartial;
};

const wfEvents = new EventEmitter();

export function emitWorkflowEvent<TEvent extends keyof WorkflowEventMap>(
  event: TEvent,
  payload: WorkflowEventMap[TEvent],
): void {
  wfEvents.emit(event, payload);
}

export function onWorkflowEvent<TEvent extends keyof WorkflowEventMap>(
  event: TEvent,
  handler: (payload: WorkflowEventMap[TEvent]) => void,
): () => void {
  wfEvents.on(event, handler);
  return () => wfEvents.off(event, handler);
}
