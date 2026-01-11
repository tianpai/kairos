import { ipcMain } from 'electron'
import log from 'electron-log/main'
import { JobNotFoundError } from '../services/job-application.service'
import {
  CreateFromExistingSchema,
  CreateFromScratchSchema,
  CreateJobApplicationSchema,
  SaveChecklistSchema,
  SaveMatchScoreSchema,
  SaveParsedResumeSchema,
  SaveResumeSchema,
  SaveTailoredResumeSchema,
  SaveWorkflowStateSchema,
  UpdateJobApplicationSchema,
  UpdateJobDescriptionSchema,
} from '../schemas/job-application.schemas'
import type { JobApplicationService} from '../services/job-application.service';

export function registerJobsHandlers(service: JobApplicationService): void {
  // CRUD handlers

  ipcMain.handle('jobs:create', async (_, data: unknown) => {
    try {
      const validated = CreateJobApplicationSchema.parse(data)
      const result = await service.createJobApplication(validated)
      log.info(`Job created: ${result.id}`)
      return result
    } catch (error) {
      log.error('jobs:create failed', error)
      throw error
    }
  })

  ipcMain.handle('jobs:createFromScratch', async (_, data: unknown) => {
    try {
      const validated = CreateFromScratchSchema.parse(data)
      const result = await service.createFromScratch(validated)
      log.info(`Job created from scratch: ${result.id}`)
      return result
    } catch (error) {
      log.error('jobs:createFromScratch failed', error)
      throw error
    }
  })

  ipcMain.handle('jobs:createFromExisting', async (_, data: unknown) => {
    try {
      const validated = CreateFromExistingSchema.parse(data)
      const result = await service.createFromExisting(validated)
      log.info(`Job created from existing: ${result.id} (source: ${validated.sourceJobId})`)
      return result
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        log.warn(`Source job not found: ${(error).message}`)
        throw new Error(error.message)
      }
      log.error('jobs:createFromExisting failed', error)
      throw error
    }
  })

  ipcMain.handle('jobs:getAll', async () => {
    return service.getAllJobApplications()
  })

  ipcMain.handle('jobs:get', async (_, id: string) => {
    try {
      return await service.getJobApplication(id)
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        log.warn(`Job not found: ${id}`)
        throw new Error(error.message)
      }
      log.error('jobs:get failed', error)
      throw error
    }
  })

  ipcMain.handle('jobs:update', async (_, id: string, data: unknown) => {
    const validated = UpdateJobApplicationSchema.parse(data)
    try {
      return await service.updateJobApplication(id, validated)
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        throw new Error(error.message)
      }
      throw error
    }
  })

  ipcMain.handle('jobs:delete', async (_, id: string) => {
    try {
      const result = await service.deleteJobApplication(id)
      log.info(`Job deleted: ${id}`)
      return result
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        log.warn(`Job not found for delete: ${id}`)
        throw new Error(error.message)
      }
      log.error('jobs:delete failed', error)
      throw error
    }
  })

  ipcMain.handle('jobs:deleteAll', async () => {
    try {
      const result = await service.deleteAllJobApplications()
      log.info('All job applications deleted')
      return result
    } catch (error) {
      log.error('jobs:deleteAll failed', error)
      throw error
    }
  })

  ipcMain.handle('jobs:saveResume', async (_, id: string, data: unknown) => {
    const validated = SaveResumeSchema.parse(data)
    return service.saveResume(id, validated)
  })

  // Workflow data handlers

  ipcMain.handle('jobs:saveParsedResume', async (_, id: string, data: unknown) => {
    const validated = SaveParsedResumeSchema.parse(data)
    return service.saveParsedResume(id, validated)
  })

  ipcMain.handle('jobs:saveTailoredResume', async (_, id: string, data: unknown) => {
    const validated = SaveTailoredResumeSchema.parse(data)
    return service.saveTailoredResume(id, validated)
  })

  ipcMain.handle('jobs:saveChecklist', async (_, id: string, data: unknown) => {
    const validated = SaveChecklistSchema.parse(data)
    return service.saveChecklist(id, validated)
  })

  ipcMain.handle('jobs:saveMatchScore', async (_, id: string, data: unknown) => {
    const validated = SaveMatchScoreSchema.parse(data)
    return service.saveMatchScore(id, validated.matchPercentage)
  })

  ipcMain.handle('jobs:saveWorkflowState', async (_, id: string, data: unknown) => {
    const validated = SaveWorkflowStateSchema.parse(data)
    return service.saveWorkflowState(id, validated)
  })

  ipcMain.handle('jobs:updateJobDescription', async (_, id: string, data: unknown) => {
    const validated = UpdateJobDescriptionSchema.parse(data)
    return service.updateJobDescription(id, validated)
  })
}
