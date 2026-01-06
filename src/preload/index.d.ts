type ThemeSource = 'system' | 'light' | 'dark'
type ThemeMode = 'light' | 'dark'
type ProviderType = 'openai' | 'deepseek' | 'claude' | 'ollama'

interface ModelInfo {
  id: string
  name: string
}

interface OllamaPullProgress {
  status: string
  digest?: string
  total?: number
  completed?: number
}

interface IElectronAPI {
  shortcuts: {
    onSettings: (callback: () => void) => () => void
    onNewApplication: (callback: () => void) => () => void
    onSave: (callback: () => void) => () => void
    onExportPdf: (callback: () => void) => () => void
    onDocumentSettings: (callback: () => void) => () => void
    onPrevApp: (callback: () => void) => () => void
    onNextApp: (callback: () => void) => () => void
    onLatestApp: (callback: () => void) => () => void
    onOldestApp: (callback: () => void) => () => void
    onTailor: (callback: () => void) => () => void
    onToggleSidebar: (callback: () => void) => () => void
    onToggleColumns: (callback: () => void) => () => void
    onBatchExport: (callback: () => void) => () => void
  }
  platform: NodeJS.Platform
  shell: {
    openExternal: (url: string) => Promise<void>
  }
  dialog: {
    selectFolder: () => Promise<string | null>
  }
  fs: {
    writeFile: (
      folderPath: string,
      filename: string,
      data: ArrayBuffer,
    ) => Promise<{ success: boolean; path: string }>
  }
  settings: {
    // OpenAI
    getApiKey: () => Promise<string | null>
    setApiKey: (key: string) => Promise<void>
    hasApiKey: () => Promise<boolean>
    deleteApiKey: () => Promise<void>
    // DeepSeek
    getDeepSeekApiKey: () => Promise<string | null>
    setDeepSeekApiKey: (key: string) => Promise<void>
    hasDeepSeekApiKey: () => Promise<boolean>
    deleteDeepSeekApiKey: () => Promise<void>
  }
  models: {
    fetch: (provider: ProviderType) => Promise<ModelInfo[]>
    getCached: (provider: ProviderType) => Promise<string[]>
    getSelected: (provider: ProviderType) => Promise<string | null>
    setSelected: (provider: ProviderType, model: string) => Promise<void>
    getDefault: (provider: ProviderType) => Promise<string>
  }
  provider: {
    getActive: () => Promise<ProviderType>
    setActive: (provider: ProviderType) => Promise<void>
  }
  claudeSubscription: {
    // OAuth methods
    startAuthorization: () => Promise<{ codeVerifier: string }>
    completeAuthorization: (code: string, codeVerifier?: string) => Promise<unknown>
    getAccessToken: () => Promise<string>
    isAuthenticated: () => Promise<boolean>
    logout: () => Promise<void>
    cancelAuthorization: () => void
    // Auth mode methods
    getAuthMode: () => Promise<'oauth' | 'cli'>
    setAuthMode: (mode: 'oauth' | 'cli') => Promise<void>
    // CLI validation methods
    isCliInstalled: () => Promise<boolean>
    isCliAuthenticated: () => Promise<boolean>
    getCliVersion: () => Promise<string | null>
    getCliPath: () => Promise<string | null>
    setCliPath: (path: string | null) => Promise<void>
    getConfiguredCliPath: () => Promise<string | null>
  }
  ollama: {
    isRunning: () => Promise<boolean>
    getVersion: () => Promise<string | null>
    getInstalledModels: () => Promise<ModelInfo[]>
    getCuratedModels: () => Promise<ModelInfo[]>
    pullModel: (modelName: string) => Promise<{ success: boolean; error?: string }>
    cancelPull: () => Promise<void>
    getBaseUrl: () => Promise<string>
    setBaseUrl: (url: string) => Promise<void>
    onPullProgress: (
      callback: (data: { modelName: string; progress: OllamaPullProgress }) => void,
    ) => () => void
  }
  theme: {
    get: () => Promise<ThemeSource>
    set: (theme: ThemeSource) => Promise<void>
    getCurrent: () => Promise<ThemeMode>
  }
  aiServer: {
    getInfo: () => Promise<{ port: number; baseURL: string; wsURL: string }>
  }
  jobs: {
    // CRUD
    create: (data: unknown) => Promise<{ id: string }>
    createFromScratch: (data: unknown) => Promise<{ id: string }>
    getAll: () => Promise<unknown[]>
    get: (id: string) => Promise<unknown>
    update: (id: string, data: unknown) => Promise<unknown>
    delete: (id: string) => Promise<{ success: boolean }>
    saveResume: (id: string, data: unknown) => Promise<{ success: boolean }>
    updateJobDescription: (id: string, data: unknown) => Promise<{ success: boolean }>
    // Workflow data
    saveParsedResume: (id: string, data: unknown) => Promise<{ success: boolean }>
    saveTailoredResume: (id: string, data: unknown) => Promise<{ success: boolean }>
    saveChecklist: (id: string, data: unknown) => Promise<{ success: boolean }>
    saveMatchScore: (id: string, data: unknown) => Promise<{ success: boolean }>
    saveWorkflowState: (id: string, data: unknown) => Promise<{ success: boolean }>
  }
}

declare global {
  interface Window {
    electron: IElectronAPI
  }
}

export {}
