import type { TaskName, WorkflowContext } from '@type/task-contracts'
import type { WorkflowStepsData } from '@type/workflow'
import { AITaskClient } from '../ai/ai-task-client'
import type { SettingsService } from '../config/settings.service'
import type { JobApplicationService } from '../services/job-application.service'
import { WorkflowEngine } from './workflow-engine'
import { registerWorkflowTasks } from './tasks'
import './workflows'

export class WorkflowService {
  private readonly engine: WorkflowEngine
  private readonly aiClient: AITaskClient

  constructor(
    private readonly jobService: JobApplicationService,
    settingsService: SettingsService,
  ) {
    this.aiClient = new AITaskClient(settingsService)
    registerWorkflowTasks({
      jobService: this.jobService,
      aiClient: this.aiClient,
    })
    this.engine = new WorkflowEngine(this.jobService)
  }

  startWorkflow(
    workflowName: string,
    jobId: string,
    initialContext: Partial<WorkflowContext>,
  ): Promise<void> {
    return this.engine.startWorkflow(workflowName, jobId, initialContext)
  }

  retryFailedTasks(jobId: string): Promise<Array<TaskName>> {
    return this.engine.retryFailedTasks(jobId)
  }

  async getWorkflowState(jobId: string): Promise<WorkflowStepsData | null> {
    const active = this.engine.getWorkflowSteps(jobId)
    if (active) return active

    const job = await this.jobService.getJobApplication(jobId)
    const workflowSteps = job.workflowSteps as WorkflowStepsData | null
    if (!workflowSteps) return null

    const { recovered, wasStale } =
      this.engine.recoverStaleWorkflow(workflowSteps)

    if (wasStale) {
      await this.jobService.saveWorkflowState(jobId, {
        workflowSteps: recovered,
        workflowStatus: recovered.status,
      })
    }

    return recovered
  }
}
