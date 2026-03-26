import type { ThemeSource, ThemeState } from "@type/theme";
import type { ProviderType } from "@shared/providers";
import type { Checklist } from "@type/checklist";
import type { BackupExportResult, BackupImportResult } from "@shared/backup";
import type { UpdateState } from "@shared/updater";
import type {
  JobApplication,
  JobSummary,
  JobsListQuery,
  JobsPatchPayload,
} from "@type/jobs-ipc";
import type {
  WfState,
  WorkflowAiPartial,
  WorkflowPushState,
} from "@type/workflow";
import type { IpcSuccessResponse } from "@type/ipc";

interface ModelInfo {
  id: string;
  name: string;
}

// TODO: [type] duplicated interface -> use one interface in shared/
interface ResumeGetResult {
  templateId: string;
  jobDescription: string | null;
  originalResume: string;
  parsedResume: Record<string, unknown> | null;
  tailoredResume: Record<string, unknown> | null;
}

interface KairosAPI {
  platform: NodeJS.Platform;
  backup: {
    exportResumeData: () => Promise<BackupExportResult>;
    importResumeData: () => Promise<BackupImportResult>;
  };
  shell: {
    openExternal: (url: string) => Promise<void>;
  };
  dialog: {
    selectFolder: () => Promise<string | null>;
  };
  fs: {
    writeFile: (
      folderPath: string,
      filename: string,
      data: ArrayBuffer,
    ) => Promise<{ success: boolean; path: string }>;
  };
  apiKey: {
    get: (provider: ProviderType) => Promise<string | null>;
    set: (provider: ProviderType, key: string) => Promise<void>;
    has: (provider: ProviderType) => Promise<boolean>;
    delete: (provider: ProviderType) => Promise<void>;
  };
  provider: {
    getActive: () => Promise<ProviderType | null>;
    setActive: (provider: ProviderType) => Promise<void>;
    resetAll: () => Promise<{ success: boolean }>;
    fetchModels: (provider: ProviderType) => Promise<ModelInfo[]>;
    getCachedModels: (provider: ProviderType) => Promise<string[]>;
    getSelectedModel: (provider: ProviderType) => Promise<string | null>;
    setSelectedModel: (provider: ProviderType, model: string) => Promise<void>;
  };
  theme: {
    get: () => Promise<ThemeState>;
    set: (theme: ThemeSource) => Promise<void>;
  };
  aiServer: {
    getInfo: () => Promise<{ port: number; baseURL: string; wsURL: string }>;
  };
  jobs: {
    list: (query?: JobsListQuery) => Promise<JobApplication[]>;
    get: (id: string) => Promise<JobSummary>;
    patch: (id: string, data: JobsPatchPayload) => Promise<IpcSuccessResponse>;
    delete: (id: string) => Promise<IpcSuccessResponse>;
    deleteAll: () => Promise<IpcSuccessResponse>;
  };
  checklist: {
    get: (id: string) => Promise<Checklist | null>;
    getKw: (id: string) => Promise<string[]>;
    updateKw: (id: string, keywords: string[]) => Promise<IpcSuccessResponse>;
  };
  resume: {
    get: (id: string) => Promise<ResumeGetResult>;
    save: (id: string, data: unknown) => Promise<IpcSuccessResponse>;
    getTemplateId: (id: string) => Promise<string>;
  };
  job: {
    create: (payload: {
      resumeSource: "upload" | "existing";
      resumeFile?: { fileName: string; data: ArrayBuffer };
      sourceJobId?: string;
      templateId: string;
      jobDescription: string;
      jobUrl?: string;
    }) => Promise<{ jobId: string }>;
  };
  workflow: {
    start: (jobId: string, workflowName: string) => Promise<{ success: boolean }>;
    retry: (jobId: string) => Promise<{ success: boolean }>;
    getState: (jobId: string) => Promise<WfState | null>;
    onPushState: (callback: (payload: WorkflowPushState) => void) => () => void;
    onAiPartial: (callback: (payload: WorkflowAiPartial) => void) => () => void;
  };
  updater: {
    check: () => Promise<UpdateState>;
    getState: () => Promise<UpdateState>;
    getVersion: () => Promise<string>;
    isPackaged: () => Promise<boolean>;
    download: () => Promise<void>;
    quitAndInstall: () => Promise<void>;
  };
}

declare global {
  interface Window {
    kairos: KairosAPI;
  }
}

export {};
