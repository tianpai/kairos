import { emitWorkflowEvent } from "../workflow-events";
import type { TaskError, TaskName } from "@type/workflow";

// TODO: why export again?
export type { TaskError, TaskName };

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
