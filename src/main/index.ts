import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import { join } from 'path'
import log from 'electron-log/main'
import { SettingsService } from './config/settings.service'
import { registerAllHandlers } from './ipc'
import { connectDatabase, disconnectDatabase, runMigrations } from './services/database.service'

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

async function initializeDatabase() {
  // Set database path
  const dbPath = app.isPackaged
    ? join(app.getPath('userData'), 'kairos.db')
    : join(app.getAppPath(), 'prisma/dev.db')

  process.env.DATABASE_URL = `file:${dbPath}`

  // Run migrations to ensure schema is up to date
  log.info('Running database migrations...')
  await runMigrations()

  // Connect to database
  await connectDatabase()

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
}

app.whenReady().then(async () => {
  try {
    log.info('App starting')
    app.setName('Kairos')
    app.setAboutPanelOptions({
      applicationName: 'Kairos',
      applicationVersion: app.getVersion(),
      version: '', // hide build number
      copyright: 'Copyright © 2025',
      credits: 'AI-powered resume optimization',
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
