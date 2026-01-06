import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  shortcuts: {
    onSettings: (callback: () => void) => {
      const handler = () => callback()
      ipcRenderer.on('shortcut:settings', handler)
      return () => ipcRenderer.removeListener('shortcut:settings', handler)
    },
    onNewApplication: (callback: () => void) => {
      const handler = () => callback()
      ipcRenderer.on('shortcut:new-application', handler)
      return () => ipcRenderer.removeListener('shortcut:new-application', handler)
    },
    onSave: (callback: () => void) => {
      const handler = () => callback()
      ipcRenderer.on('shortcut:save', handler)
      return () => ipcRenderer.removeListener('shortcut:save', handler)
    },
    onExportPdf: (callback: () => void) => {
      const handler = () => callback()
      ipcRenderer.on('shortcut:export-pdf', handler)
      return () => ipcRenderer.removeListener('shortcut:export-pdf', handler)
    },
    onDocumentSettings: (callback: () => void) => {
      const handler = () => callback()
      ipcRenderer.on('shortcut:document-settings', handler)
      return () => ipcRenderer.removeListener('shortcut:document-settings', handler)
    },
    onPrevApp: (callback: () => void) => {
      const handler = () => callback()
      ipcRenderer.on('shortcut:prev-app', handler)
      return () => ipcRenderer.removeListener('shortcut:prev-app', handler)
    },
    onNextApp: (callback: () => void) => {
      const handler = () => callback()
      ipcRenderer.on('shortcut:next-app', handler)
      return () => ipcRenderer.removeListener('shortcut:next-app', handler)
    },
    onLatestApp: (callback: () => void) => {
      const handler = () => callback()
      ipcRenderer.on('shortcut:latest-app', handler)
      return () => ipcRenderer.removeListener('shortcut:latest-app', handler)
    },
    onOldestApp: (callback: () => void) => {
      const handler = () => callback()
      ipcRenderer.on('shortcut:oldest-app', handler)
      return () => ipcRenderer.removeListener('shortcut:oldest-app', handler)
    },
    onTailor: (callback: () => void) => {
      const handler = () => callback()
      ipcRenderer.on('shortcut:tailor', handler)
      return () => ipcRenderer.removeListener('shortcut:tailor', handler)
    },
    onToggleSidebar: (callback: () => void) => {
      const handler = () => callback()
      ipcRenderer.on('shortcut:toggle-sidebar', handler)
      return () => ipcRenderer.removeListener('shortcut:toggle-sidebar', handler)
    },
    onToggleColumns: (callback: () => void) => {
      const handler = () => callback()
      ipcRenderer.on('shortcut:toggle-columns', handler)
      return () => ipcRenderer.removeListener('shortcut:toggle-columns', handler)
    },
    onBatchExport: (callback: () => void) => {
      const handler = () => callback()
      ipcRenderer.on('shortcut:batch-export', handler)
      return () => ipcRenderer.removeListener('shortcut:batch-export', handler)
    },
  },
  platform: process.platform,
  shell: {
    openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:openExternal', url),
  },
  dialog: {
    selectFolder: (): Promise<string | null> => ipcRenderer.invoke('dialog:selectFolder'),
  },
  fs: {
    writeFile: (
      folderPath: string,
      filename: string,
      data: ArrayBuffer,
    ): Promise<{ success: boolean; path: string }> =>
      ipcRenderer.invoke('fs:writeFile', folderPath, filename, data),
  },
  settings: {
    // OpenAI
    getApiKey: (): Promise<string | null> => ipcRenderer.invoke('settings:getApiKey'),
    setApiKey: (key: string): Promise<void> => ipcRenderer.invoke('settings:setApiKey', key),
    hasApiKey: (): Promise<boolean> => ipcRenderer.invoke('settings:hasApiKey'),
    deleteApiKey: (): Promise<void> => ipcRenderer.invoke('settings:deleteApiKey'),
    // DeepSeek
    getDeepSeekApiKey: (): Promise<string | null> => ipcRenderer.invoke('settings:getDeepSeekApiKey'),
    setDeepSeekApiKey: (key: string): Promise<void> =>
      ipcRenderer.invoke('settings:setDeepSeekApiKey', key),
    hasDeepSeekApiKey: (): Promise<boolean> => ipcRenderer.invoke('settings:hasDeepSeekApiKey'),
    deleteDeepSeekApiKey: (): Promise<void> => ipcRenderer.invoke('settings:deleteDeepSeekApiKey'),
  },
  models: {
    fetch: (provider: string): Promise<Array<{ id: string; name: string }>> =>
      ipcRenderer.invoke('models:fetch', provider),
    getCached: (provider: string): Promise<Array<string>> =>
      ipcRenderer.invoke('models:getCached', provider),
    getSelected: (provider: string): Promise<string | null> =>
      ipcRenderer.invoke('models:getSelected', provider),
    setSelected: (provider: string, model: string): Promise<void> =>
      ipcRenderer.invoke('models:setSelected', provider, model),
    getDefault: (provider: string): Promise<string> =>
      ipcRenderer.invoke('models:getDefault', provider),
  },
  provider: {
    getActive: (): Promise<string> => ipcRenderer.invoke('provider:getActive'),
    setActive: (provider: string): Promise<void> => ipcRenderer.invoke('provider:setActive', provider),
  },
  claudeSubscription: {
    // OAuth methods
    startAuthorization: (): Promise<{ codeVerifier: string }> =>
      ipcRenderer.invoke('claude:startAuth'),
    completeAuthorization: (code: string, codeVerifier?: string): Promise<unknown> =>
      ipcRenderer.invoke('claude:completeAuth', code, codeVerifier),
    getAccessToken: (): Promise<string> => ipcRenderer.invoke('claude:getAccessToken'),
    isAuthenticated: (): Promise<boolean> => ipcRenderer.invoke('claude:isAuthenticated'),
    logout: (): Promise<void> => ipcRenderer.invoke('claude:logout'),
    cancelAuthorization: (): void => {
      ipcRenderer.invoke('claude:cancelAuth')
    },
    // Auth mode methods
    getAuthMode: (): Promise<'oauth' | 'cli'> => ipcRenderer.invoke('claude:getAuthMode'),
    setAuthMode: (mode: 'oauth' | 'cli'): Promise<void> =>
      ipcRenderer.invoke('claude:setAuthMode', mode),
    // CLI validation methods
    isCliInstalled: (): Promise<boolean> => ipcRenderer.invoke('claude:cli:isInstalled'),
    isCliAuthenticated: (): Promise<boolean> => ipcRenderer.invoke('claude:cli:isAuthenticated'),
    getCliVersion: (): Promise<string | null> => ipcRenderer.invoke('claude:cli:getVersion'),
    getCliPath: (): Promise<string | null> => ipcRenderer.invoke('claude:cli:getPath'),
    setCliPath: (path: string | null): Promise<void> => ipcRenderer.invoke('claude:cli:setPath', path),
    getConfiguredCliPath: (): Promise<string | null> => ipcRenderer.invoke('claude:cli:getConfiguredPath'),
  },
  theme: {
    get: (): Promise<'system' | 'light' | 'dark'> => ipcRenderer.invoke('theme:get'),
    set: (theme: 'system' | 'light' | 'dark'): Promise<void> => ipcRenderer.invoke('theme:set', theme),
    getCurrent: (): Promise<'light' | 'dark'> => ipcRenderer.invoke('theme:getCurrent'),
  },
  aiServer: {
    getInfo: (): Promise<{ port: number; baseURL: string; wsURL: string }> =>
      ipcRenderer.invoke('aiServer:getInfo'),
  },
  jobs: {
    // CRUD
    create: (data: unknown): Promise<{ id: string }> => ipcRenderer.invoke('jobs:create', data),
    createFromScratch: (data: unknown): Promise<{ id: string }> =>
      ipcRenderer.invoke('jobs:createFromScratch', data),
    createFromExisting: (data: unknown): Promise<{ id: string }> =>
      ipcRenderer.invoke('jobs:createFromExisting', data),
    getAll: (): Promise<Array<unknown>> => ipcRenderer.invoke('jobs:getAll'),
    get: (id: string): Promise<unknown> => ipcRenderer.invoke('jobs:get', id),
    update: (id: string, data: unknown): Promise<unknown> =>
      ipcRenderer.invoke('jobs:update', id, data),
    delete: (id: string): Promise<{ success: boolean }> => ipcRenderer.invoke('jobs:delete', id),
    saveResume: (id: string, data: unknown): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('jobs:saveResume', id, data),
    updateJobDescription: (id: string, data: unknown): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('jobs:updateJobDescription', id, data),
    // Workflow data
    saveParsedResume: (id: string, data: unknown): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('jobs:saveParsedResume', id, data),
    saveTailoredResume: (id: string, data: unknown): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('jobs:saveTailoredResume', id, data),
    saveChecklist: (id: string, data: unknown): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('jobs:saveChecklist', id, data),
    saveMatchScore: (id: string, data: unknown): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('jobs:saveMatchScore', id, data),
    saveWorkflowState: (id: string, data: unknown): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('jobs:saveWorkflowState', id, data),
  },
})
