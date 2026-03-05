import log from "electron-log/main";
import { JobNotFoundError } from "../application/workspace-application.service";
import {
  CreateFromExistingSchema,
  CreateJobApplicationSchema,
  ListJobsSchema,
  PatchJobApplicationSchema,
  SaveResumeSchema,
} from "../../../schemas/job-application.schemas";
import { guardedHandle as handle } from "../../runtime/ipc";
import type { WorkspaceApplicationService } from "../application/workspace-application.service";

export function registerJobsHandlers(
  service: WorkspaceApplicationService,
): void {
  // CRUD handlers

  handle("jobs:create", async (_, data: unknown) => {
    try {
      const validated = CreateJobApplicationSchema.parse(data);
      const result = await service.createJobApplication(validated);
      log.info(`Job created: ${result.id}`);
      return result;
    } catch (error) {
      log.error("jobs:create failed", error);
      throw error;
    }
  });

  handle("jobs:createFromExisting", async (_, data: unknown) => {
    try {
      const validated = CreateFromExistingSchema.parse(data);
      const result = await service.createFromExisting(validated);
      log.info(
        `Job created from existing: ${result.id} (source: ${validated.sourceJobId})`,
      );
      return result;
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        log.warn(`Source job not found: ${error.message}`);
        throw new Error(error.message);
      }
      log.error("jobs:createFromExisting failed", error);
      throw error;
    }
  });

  handle("jobs:list", async (_, data: unknown) => {
    const validated = ListJobsSchema.parse(data ?? {});
    return service.listJobApplications(validated);
  });

  handle("jobs:get", async (_, id: string) => {
    try {
      return await service.getJobApplication(id);
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        log.warn(`Job not found: ${id}`);
        throw new Error(error.message);
      }
      log.error("jobs:get failed", error);
      throw error;
    }
  });

  handle("jobs:delete", async (_, id: string) => {
    try {
      const result = await service.deleteJobApplication(id);
      log.info(`Job deleted: ${id}`);
      return result;
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        log.warn(`Job not found for delete: ${id}`);
        throw new Error(error.message);
      }
      log.error("jobs:delete failed", error);
      throw error;
    }
  });

  handle("jobs:deleteAll", async () => {
    try {
      const result = service.deleteAllJobApplications();
      log.info("All job applications deleted");
      return result;
    } catch (error) {
      log.error("jobs:deleteAll failed", error);
      throw error;
    }
  });

  handle("jobs:saveResume", async (_, id: string, data: unknown) => {
    const validated = SaveResumeSchema.parse(data);
    return service.saveResume(id, validated);
  });

  handle("jobs:patch", async (_, id: string, data: unknown) => {
    const validated = PatchJobApplicationSchema.parse(data);
    try {
      return await service.patchJobApplication(id, validated);
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        throw new Error(error.message);
      }
      throw error;
    }
  });
}
