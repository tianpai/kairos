import { randomUUID } from 'node:crypto'
import type { Prisma, PrismaClient } from '@prisma/client'
import type {
  CreateJobApplicationInput,
  CreateFromScratchInput,
  UpdateJobApplicationInput,
  UpdateJobDescriptionInput,
  SaveResumeInput,
  SaveParsedResumeInput,
  SaveTailoredResumeInput,
  SaveChecklistInput,
  SaveWorkflowStateInput,
} from '../schemas/job-application.schemas'

export class JobNotFoundError extends Error {
  constructor(id: string) {
    super(`Job application with ID ${id} not found`)
    this.name = 'JobNotFoundError'
  }
}

async function requireJobApplication<
  Select extends Prisma.JobApplicationSelect | undefined = undefined,
  Include extends Prisma.JobApplicationInclude | undefined = undefined,
>(
  database: PrismaClient,
  id: string,
  args?: {
    select?: Select
    include?: Include
  },
): Promise<
  Prisma.JobApplicationGetPayload<{
    select: Select
    include: Include
  }>
> {
  const jobApplication = await database.jobApplication.findUnique({
    where: { id },
    ...(args ?? {}),
  } as Prisma.JobApplicationFindUniqueArgs)

  if (!jobApplication) {
    throw new JobNotFoundError(id)
  }

  return jobApplication as Prisma.JobApplicationGetPayload<{
    select: Select
    include: Include
  }>
}

export class JobApplicationService {
  constructor(private readonly database: PrismaClient) {}

  async createJobApplication(dto: CreateJobApplicationInput): Promise<{
    id: string
  }> {
    const jobId = randomUUID()

    let company = await this.database.company.findUnique({
      where: { name: dto.companyName },
    })
    if (!company) {
      company = await this.database.company.create({
        data: { name: dto.companyName },
      })
    }

    const jobApplication = await this.database.jobApplication.create({
      data: {
        id: jobId,
        companyId: company.id,
        position: dto.position,
        dueDate: new Date(dto.dueDate),
        matchPercentage: 0,
        templateId: dto.templateId,
        jobDescription: dto.jobDescription,
        originalResume: dto.rawResumeContent,
      },
    })

    return {
      id: jobApplication.id,
    }
  }

  async createFromScratch(dto: CreateFromScratchInput): Promise<{
    id: string
  }> {
    const jobId = randomUUID()

    let company = await this.database.company.findUnique({
      where: { name: dto.companyName },
    })
    if (!company) {
      company = await this.database.company.create({
        data: { name: dto.companyName },
      })
    }

    const jobApplication = await this.database.jobApplication.create({
      data: {
        id: jobId,
        companyId: company.id,
        position: dto.position,
        dueDate: new Date(dto.dueDate),
        matchPercentage: 0,
        templateId: dto.templateId,
        jobDescription: dto.jobDescription ?? null,
        originalResume: null,
      },
    })

    return {
      id: jobApplication.id,
    }
  }

  async getAllJobApplications(): Promise<
    Array<{
      id: string
      companyName: string
      position: string
      dueDate: string
      matchPercentage: number
      applicationStatus: string | null
      originalResume: string | null
      createdAt: string
      updatedAt: string
    }>
  > {
    const jobApplications = await this.database.jobApplication.findMany({
      include: {
        company: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return jobApplications.map((app) => ({
      id: app.id,
      companyName: app.company.name,
      position: app.position,
      dueDate: app.dueDate.toISOString().split('T')[0],
      matchPercentage: app.matchPercentage,
      applicationStatus: app.applicationStatus,
      originalResume: app.originalResume,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    }))
  }

  async getJobApplication(id: string): Promise<{
    id: string
    companyName: string
    position: string
    dueDate: string
    matchPercentage: number
    applicationStatus: string | null
    createdAt: string
    updatedAt: string
    templateId: string
    jobDescription: string | null
    parsedResume: Record<string, unknown> | null
    tailoredResume: Record<string, unknown> | null
    originalResume: string | null
    checklist: Record<string, unknown> | null
    workflowStatus: string | null
    failedTasks: Record<string, unknown>
  }> {
    const jobApplication = await requireJobApplication(this.database, id, {
      include: {
        company: true,
      },
    })

    // Compute failedTasks from workflowSteps for backwards compatibility
    const workflowSteps = jobApplication.workflowSteps as Record<string, unknown>
    const failedTasks: Record<string, unknown> = {}

    if (workflowSteps && typeof workflowSteps === 'object' && 'taskStates' in workflowSteps) {
      const taskStates = workflowSteps.taskStates as Record<string, unknown>
      Object.entries(taskStates).forEach(([task, status]) => {
        if (status === 'failed') {
          failedTasks[task] = { status: 'failed' }
        }
      })
    }

    return {
      id: jobApplication.id,
      companyName: jobApplication.company.name,
      position: jobApplication.position,
      dueDate: jobApplication.dueDate.toISOString().split('T')[0],
      matchPercentage: jobApplication.matchPercentage,
      applicationStatus: jobApplication.applicationStatus,
      createdAt: jobApplication.createdAt.toISOString(),
      updatedAt: jobApplication.updatedAt.toISOString(),
      templateId: jobApplication.templateId,
      jobDescription: jobApplication.jobDescription,
      parsedResume: jobApplication.parsedResume as Record<string, unknown> | null,
      tailoredResume: jobApplication.tailoredResume as Record<string, unknown> | null,
      originalResume: jobApplication.originalResume,
      checklist: jobApplication.checklist as Record<string, unknown> | null,
      workflowStatus: jobApplication.workflowStatus,
      failedTasks,
    }
  }

  async deleteJobApplication(id: string): Promise<{ success: boolean }> {
    await requireJobApplication(this.database, id)
    await this.database.jobApplication.delete({
      where: { id },
    })

    return { success: true }
  }

  async updateJobApplication(
    id: string,
    dto: UpdateJobApplicationInput,
  ): Promise<{
    id: string
    companyName: string
    position: string
    dueDate: string
    matchPercentage: number
  }> {
    const jobApplication = await requireJobApplication(this.database, id, {
      include: { company: true },
    })

    let companyId = jobApplication.companyId
    let companyName = jobApplication.company.name

    if (dto.companyName && dto.companyName !== jobApplication.company.name) {
      let company = await this.database.company.findUnique({
        where: { name: dto.companyName },
      })

      if (!company) {
        company = await this.database.company.create({
          data: { name: dto.companyName },
        })
      }

      companyId = company.id
      companyName = company.name
    }

    const updateData: Prisma.JobApplicationUpdateInput = {}

    if (dto.companyName) {
      updateData.company = { connect: { id: companyId } }
    }
    if (dto.position) {
      updateData.position = dto.position
    }
    if (dto.dueDate) {
      updateData.dueDate = new Date(dto.dueDate)
    }

    const updated = await this.database.jobApplication.update({
      where: { id },
      data: updateData,
    })

    return {
      id: updated.id,
      companyName,
      position: updated.position,
      dueDate: updated.dueDate.toISOString().split('T')[0],
      matchPercentage: updated.matchPercentage,
    }
  }

  async saveResume(jobId: string, dto: SaveResumeInput): Promise<{ success: boolean }> {
    await this.database.jobApplication.update({
      where: { id: jobId },
      data: {
        tailoredResume: dto.resumeStructure as Prisma.InputJsonValue,
        templateId: dto.templateId,
      },
    })
    return { success: true }
  }

  // Workflow data methods

  async saveParsedResume(jobId: string, dto: SaveParsedResumeInput): Promise<{ success: boolean }> {
    await this.database.jobApplication.update({
      where: { id: jobId },
      data: {
        parsedResume: dto.parsedResume as Prisma.InputJsonValue,
        tailoredResume: dto.tailoredResume as Prisma.InputJsonValue,
      },
    })
    return { success: true }
  }

  async saveTailoredResume(
    jobId: string,
    dto: SaveTailoredResumeInput,
  ): Promise<{ success: boolean }> {
    await this.database.jobApplication.update({
      where: { id: jobId },
      data: {
        tailoredResume: dto.tailoredResume as Prisma.InputJsonValue,
      },
    })
    return { success: true }
  }

  async saveChecklist(jobId: string, dto: SaveChecklistInput): Promise<{ success: boolean }> {
    await this.database.jobApplication.update({
      where: { id: jobId },
      data: {
        checklist: dto.checklist as Prisma.InputJsonValue,
      },
    })
    return { success: true }
  }

  async saveMatchScore(jobId: string, matchPercentage: number): Promise<{ success: boolean }> {
    await this.database.jobApplication.update({
      where: { id: jobId },
      data: {
        matchPercentage,
      },
    })
    return { success: true }
  }

  async saveWorkflowState(
    jobId: string,
    dto: SaveWorkflowStateInput,
  ): Promise<{ success: boolean }> {
    const updateData: Prisma.JobApplicationUpdateInput = {}

    if (dto.workflowSteps !== undefined) {
      updateData.workflowSteps = dto.workflowSteps as Prisma.InputJsonValue
    }
    if (dto.workflowStatus !== undefined) {
      updateData.workflowStatus = dto.workflowStatus
    }

    await this.database.jobApplication.update({
      where: { id: jobId },
      data: updateData,
    })
    return { success: true }
  }

  async updateJobDescription(
    jobId: string,
    dto: UpdateJobDescriptionInput,
  ): Promise<{ success: boolean }> {
    await this.database.jobApplication.update({
      where: { id: jobId },
      data: {
        jobDescription: dto.jobDescription,
      },
    })
    return { success: true }
  }
}
