import { JobApplicationService } from '../services/job-application.service'
import { getDatabase } from '../services/database.service'
import { registerJobsHandlers } from './jobs.handlers'
import { registerDialogHandlers } from './dialog.handlers'
import { registerFsHandlers } from './fs.handlers'

export function registerAllHandlers(): void {
  const database = getDatabase()
  const jobService = new JobApplicationService(database)
  registerJobsHandlers(jobService)
  registerDialogHandlers()
  registerFsHandlers()
}
