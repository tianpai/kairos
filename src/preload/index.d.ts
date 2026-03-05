type ThemeSource = import("../shared/type/theme").ThemeSource;
type ThemeState = import("../shared/type/theme").ThemeState;
type ProviderType = import("../shared/providers").ProviderType;
type BackupExportResult = import("../shared/backup").BackupExportResult;
type BackupImportResult = import("../shared/backup").BackupImportResult;
type UpdateState = import("../shared/updater").UpdateState;
type JobsCreateFromExistingPayload =
  import("../shared/type/jobs-ipc").JobsCreateFromExistingPayload;
type JobsCreatePayload = import("../shared/type/jobs-ipc").JobsCreatePayload;
type JobsCreateResult = import("../shared/type/jobs-ipc").JobsCreateResult;
type JobApplication = import("../shared/type/jobs-ipc").JobApplication;
type JobApplicationDetails =
  import("../shared/type/jobs-ipc").JobApplicationDetails;
type JobsListQuery = import("../shared/type/jobs-ipc").JobsListQuery;
type JobsPatchPayload = import("../shared/type/jobs-ipc").JobsPatchPayload;
type WorkflowRetryPayload =
  import("../shared/type/workflow-ipc").WorkflowRetryPayload;
type WorkflowGetStatePayload =
  import("../shared/type/workflow-ipc").WorkflowGetStatePayload;
type WorkflowStartTailoringPayload =
  import("../shared/type/workflow-ipc").WorkflowStartTailoringPayload;
type WorkflowCreateApplicationsPayload =
  import("../shared/type/workflow-ipc").WorkflowCreateApplicationsPayload;
type WorkflowCreateApplicationsResult =
  import("../shared/type/workflow-ipc").WorkflowCreateApplicationsResult;
type WorkflowPushState =
  import("../shared/type/workflow-ipc").WorkflowPushState;
type WorkflowAiPartial =
  import("../shared/type/workflow-ipc").WorkflowAiPartial;
type WorkflowStepsData = import("../shared/type/workflow").WorkflowStepsData;
type IpcSuccessResponse = import("../shared/type/ipc").IpcSuccessResponse;

interface ModelInfo {
  id: string;
  name: string;
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
  settings: {
    // OpenAI
    getApiKey: () => Promise<string | null>;
    setApiKey: (key: string) => Promise<void>;
    hasApiKey: () => Promise<boolean>;
    deleteApiKey: () => Promise<void>;
    // DeepSeek
    getDeepSeekApiKey: () => Promise<string | null>;
    setDeepSeekApiKey: (key: string) => Promise<void>;
    hasDeepSeekApiKey: () => Promise<boolean>;
    deleteDeepSeekApiKey: () => Promise<void>;
    // xAI
    getXAIApiKey: () => Promise<string | null>;
    setXAIApiKey: (key: string) => Promise<void>;
    hasXAIApiKey: () => Promise<boolean>;
    deleteXAIApiKey: () => Promise<void>;
    // Gemini
    getGeminiApiKey: () => Promise<string | null>;
    setGeminiApiKey: (key: string) => Promise<void>;
    hasGeminiApiKey: () => Promise<boolean>;
    deleteGeminiApiKey: () => Promise<void>;
    // Anthropic
    getAnthropicApiKey: () => Promise<string | null>;
    setAnthropicApiKey: (key: string) => Promise<void>;
    hasAnthropicApiKey: () => Promise<boolean>;
    deleteAnthropicApiKey: () => Promise<void>;
    // Reset
    resetAllProviders: () => Promise<{ success: boolean }>;
  };
  models: {
    fetch: (provider: ProviderType) => Promise<ModelInfo[]>;
    getCachedIds: (provider: ProviderType) => Promise<string[]>;
    getSelected: (provider: ProviderType) => Promise<string | null>;
    setSelected: (provider: ProviderType, model: string) => Promise<void>;
    getDefault: (provider: ProviderType) => Promise<string>;
  };
  provider: {
    getActive: () => Promise<ProviderType>;
    setActive: (provider: ProviderType) => Promise<void>;
  };
  theme: {
    get: () => Promise<ThemeState>;
    set: (theme: ThemeSource) => Promise<void>;
  };
  aiServer: {
    getInfo: () => Promise<{ port: number; baseURL: string; wsURL: string }>;
  };
  jobs: {
    // CRUD
    create: (data: JobsCreatePayload) => Promise<JobsCreateResult>;
    createFromExisting: (
      data: JobsCreateFromExistingPayload,
    ) => Promise<JobsCreateResult>;
    list: (query?: JobsListQuery) => Promise<JobApplication[]>;
    get: (id: string) => Promise<JobApplicationDetails>;
    patch: (id: string, data: JobsPatchPayload) => Promise<IpcSuccessResponse>;
    delete: (id: string) => Promise<IpcSuccessResponse>;
    deleteAll: () => Promise<IpcSuccessResponse>;
    saveResume: (id: string, data: unknown) => Promise<IpcSuccessResponse>;
  };
  workflow: {
    startTailoring: (
      payload: WorkflowStartTailoringPayload,
    ) => Promise<{ success: boolean }>;
    retry: (
      payload: WorkflowRetryPayload,
    ) => Promise<{ success: boolean; failedTasks: string[] }>;
    createApplications: (
      payload: WorkflowCreateApplicationsPayload,
    ) => Promise<WorkflowCreateApplicationsResult>;
    getState: (
      payload: WorkflowGetStatePayload,
    ) => Promise<{ workflow: WorkflowStepsData | null }>;
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
