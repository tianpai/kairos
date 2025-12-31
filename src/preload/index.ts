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
  },
  platform: process.platform,
  shell: {
    openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:openExternal', url),
  },
  settings: {
    getApiKey: (): Promise<string | null> => ipcRenderer.invoke('settings:getApiKey'),
    setApiKey: (key: string): Promise<void> => ipcRenderer.invoke('settings:setApiKey', key),
    hasApiKey: (): Promise<boolean> => ipcRenderer.invoke('settings:hasApiKey'),
    deleteApiKey: (): Promise<void> => ipcRenderer.invoke('settings:deleteApiKey'),
  },
  theme: {
    get: (): Promise<'system' | 'light' | 'dark'> => ipcRenderer.invoke('theme:get'),
    set: (theme: 'system' | 'light' | 'dark'): Promise<void> => ipcRenderer.invoke('theme:set', theme),
    getCurrent: (): Promise<'light' | 'dark'> => ipcRenderer.invoke('theme:getCurrent'),
  },
  jobs: {
    // CRUD
    create: (data: unknown): Promise<{ id: string }> => ipcRenderer.invoke('jobs:create', data),
    createFromScratch: (data: unknown): Promise<{ id: string }> =>
      ipcRenderer.invoke('jobs:createFromScratch', data),
    createFromExisting: (data: unknown): Promise<{ id: string }> =>
      ipcRenderer.invoke('jobs:createFromExisting', data),
    getAll: (): Promise<unknown[]> => ipcRenderer.invoke('jobs:getAll'),
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
