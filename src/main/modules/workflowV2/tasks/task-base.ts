import { emitWorkflowEvent } from "../workflow-events";

export interface TaskError {
  message: string;
  retryable: boolean;
}

export type TaskName =
  | "resume.parsing"
  | "resume.tailoring"
  | "checklist.parsing"
  | "checklist.matching"
  | "score.updating"
  | "jobinfo.extracting";

export abstract class BaseTask {
  abstract readonly name: TaskName;
  abstract run(jobId: string): Promise<TaskError | null>;

  protected emit(jobId: string, partial: unknown): void {
    emitWorkflowEvent("workflow:aiPartial", {
      jobId,
      taskName: this.name,
      partial,
    });
  }
}
