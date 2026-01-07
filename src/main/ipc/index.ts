import { JobApplicationService } from '../services/job-application.service'
import { getDatabase } from '../services/database.service'
import { registerJobsHandlers } from './jobs.handlers'
import { registerDialogHandlers } from './dialog.handlers'
import { registerFsHandlers } from './fs.handlers'
import { registerAIServerHandlers } from './ai-server.handlers'
import { registerUpdaterHandlers } from './updater.handlers'

export function registerAllHandlers(): void {
  const database = getDatabase()
  const jobService = new JobApplicationService(database)
  registerJobsHandlers(jobService)
  registerDialogHandlers()
  registerFsHandlers()
  registerAIServerHandlers()
  registerUpdaterHandlers()
}
