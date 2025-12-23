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
  },
  platform: process.platform,
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
