import { registerJobsHandlers } from './jobs.handlers'
import { JobApplicationService } from '../services/job-application.service'
import { getDatabase } from '../services/database.service'

export function registerAllHandlers(): void {
  const database = getDatabase()
  const jobService = new JobApplicationService(database)
  registerJobsHandlers(jobService)
}
