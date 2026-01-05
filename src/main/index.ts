import { join } from 'node:path'
import { BrowserWindow, app, ipcMain, nativeTheme, shell } from 'electron'
import log from 'electron-log/main'
import { SettingsService } from './config/settings.service'
import { registerAllHandlers } from './ipc'
import { connectDatabase, disconnectDatabase, runMigrations } from './services/database.service'
import { createAppMenu } from './menu'
import {
  fetchOpenAIModels,
  fetchDeepSeekModels,
  getFallbackModels,
  getDefaultModel,
  type ProviderType,
} from './services/ai-models.service'

// Initialize logger
log.initialize()
log.transports.file.level = 'info'

let mainWindow: BrowserWindow | null = null

// Settings service singleton
export const settingsService = new SettingsService()

// IPC Handlers for settings
ipcMain.handle('settings:getApiKey', () => {
  return settingsService.getOpenAIKey()
})

ipcMain.handle('settings:setApiKey', (_, key: string) => {
  settingsService.setOpenAIKey(key)
})

ipcMain.handle('settings:hasApiKey', () => {
  return settingsService.hasOpenAIKey()
})

ipcMain.handle('settings:deleteApiKey', () => {
  settingsService.deleteOpenAIKey()
})

// Model fetching IPC handlers
ipcMain.handle('models:fetch', async (_, provider: ProviderType) => {
  try {
    let models
    if (provider === 'openai') {
      const apiKey = settingsService.getOpenAIKey()
      if (!apiKey) {
        return getFallbackModels(provider)
      }
      models = await fetchOpenAIModels(apiKey)
      settingsService.setOpenAICachedModels(models.map((m) => m.id))
    } else if (provider === 'deepseek') {
      const apiKey = settingsService.getDeepSeekKey()
      if (!apiKey) {
        return getFallbackModels(provider)
      }
      models = await fetchDeepSeekModels(apiKey)
      settingsService.setDeepSeekCachedModels(models.map((m) => m.id))
    } else {
      return getFallbackModels(provider)
    }
    return models
  } catch (error) {
    log.error('Failed to fetch models:', error)
    return getFallbackModels(provider)
  }
})

ipcMain.handle('models:getCached', (_, provider: ProviderType) => {
  if (provider === 'openai') {
    return settingsService.getOpenAICachedModels()
  } else if (provider === 'deepseek') {
    return settingsService.getDeepSeekCachedModels()
  }
  return []
})

ipcMain.handle('models:getSelected', (_, provider: ProviderType) => {
  if (provider === 'openai') {
    return settingsService.getOpenAISelectedModel()
  } else if (provider === 'deepseek') {
    return settingsService.getDeepSeekSelectedModel()
  }
  return null
})

ipcMain.handle('models:setSelected', (_, provider: ProviderType, model: string) => {
  if (provider === 'openai') {
    settingsService.setOpenAISelectedModel(model)
  } else if (provider === 'deepseek') {
    settingsService.setDeepSeekSelectedModel(model)
  }
})

ipcMain.handle('models:getDefault', (_, provider: ProviderType) => {
  return getDefaultModel(provider)
})

// Active provider IPC handlers
ipcMain.handle('provider:getActive', () => {
  return settingsService.getActiveProvider()
})

ipcMain.handle('provider:setActive', (_, provider: ProviderType) => {
  settingsService.setActiveProvider(provider)
})

// Theme IPC handlers
ipcMain.handle('theme:get', () => {
  return settingsService.getTheme()
})

ipcMain.handle('theme:set', (_, theme: 'system' | 'light' | 'dark') => {
  settingsService.setTheme(theme)
  nativeTheme.themeSource = theme
})

ipcMain.handle('theme:getCurrent', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
})

// Shell IPC handler
ipcMain.handle('shell:openExternal', (_, url: string) => {
  return shell.openExternal(url)
})

async function initializeDatabase() {
  // Connect to database (creates tables if needed)
  await connectDatabase()

  // Run any pending migrations
  await runMigrations()

  // Register IPC handlers
  registerAllHandlers()
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#fafafa',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (!app.isPackaged) {
    await mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    await mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Create app menu with keyboard shortcuts
  createAppMenu(mainWindow)
}

app.whenReady().then(async () => {
  try {
    log.info('App starting')
    app.setName('Kairos')
    app.setAboutPanelOptions({
      applicationName: 'Kairos',
      applicationVersion: app.getVersion(),
      version: '', // hide build number
      copyright: 'AI-powered resume optimization\n\nCopyright © 2025',
      iconPath: join(app.getAppPath(), 'build/icon.png'),
    })
    // Apply saved theme preference
    nativeTheme.themeSource = settingsService.getTheme()
    await initializeDatabase()
    await createWindow()
    log.info('App ready')
  } catch (error) {
    log.error('Failed to start:', error)
    app.quit()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', async () => {
  await disconnectDatabase()
})
