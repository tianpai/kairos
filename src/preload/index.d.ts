type ThemeSource = 'system' | 'light' | 'dark'
type ThemeMode = 'light' | 'dark'

interface IElectronAPI {
  platform: NodeJS.Platform
  settings: {
    getApiKey: () => Promise<string | null>
    setApiKey: (key: string) => Promise<void>
    hasApiKey: () => Promise<boolean>
    deleteApiKey: () => Promise<void>
  }
  theme: {
    get: () => Promise<ThemeSource>
    set: (theme: ThemeSource) => Promise<void>
    getCurrent: () => Promise<ThemeMode>
  }
  jobs: {
    // CRUD
    create: (data: unknown) => Promise<{ id: string }>
    getAll: () => Promise<unknown[]>
    get: (id: string) => Promise<unknown>
    update: (id: string, data: unknown) => Promise<unknown>
    delete: (id: string) => Promise<{ success: boolean }>
    saveResume: (id: string, data: unknown) => Promise<{ success: boolean }>
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
