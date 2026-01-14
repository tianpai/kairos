import { EventEmitter } from 'node:events'
import type {
  WorkflowAiPartial,
  WorkflowCompleted,
  WorkflowStateChanged,
  WorkflowTaskCompleted,
  WorkflowTaskFailed,
} from '@type/workflow-ipc'

type WorkflowEventMap = {
  'workflow:stateChanged': WorkflowStateChanged
  'workflow:taskCompleted': WorkflowTaskCompleted
  'workflow:taskFailed': WorkflowTaskFailed
  'workflow:completed': WorkflowCompleted
  'workflow:aiPartial': WorkflowAiPartial
}

const workflowEvents = new EventEmitter()

export function emitWorkflowEvent<TEvent extends keyof WorkflowEventMap>(
  event: TEvent,
  payload: WorkflowEventMap[TEvent],
): void {
  workflowEvents.emit(event, payload)
}

export function onWorkflowEvent<TEvent extends keyof WorkflowEventMap>(
  event: TEvent,
  handler: (payload: WorkflowEventMap[TEvent]) => void,
): () => void {
  workflowEvents.on(event, handler)
  return () => workflowEvents.off(event, handler)
}
