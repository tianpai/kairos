// NOTE: currently this is a copy from the old workflow
// old workflow will be completely replaced later

import { EventEmitter } from "node:events";
import type { WorkflowAiPartial, WorkflowPushState } from "@type/workflow-ipc";

type WorkflowEventMap = {
  "workflow:pushState": WorkflowPushState;
  "workflow:aiPartial": WorkflowAiPartial;
};

const workflowEvents = new EventEmitter();

export function emitWorkflowEvent<TEvent extends keyof WorkflowEventMap>(
  event: TEvent,
  payload: WorkflowEventMap[TEvent],
): void {
  workflowEvents.emit(event, payload);
}

export function onWorkflowEvent<TEvent extends keyof WorkflowEventMap>(
  event: TEvent,
  handler: (payload: WorkflowEventMap[TEvent]) => void,
): () => void {
  workflowEvents.on(event, handler);
  return () => workflowEvents.off(event, handler);
}
