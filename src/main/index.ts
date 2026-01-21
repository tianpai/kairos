import { join } from "node:path";
import { BrowserWindow, app, nativeTheme } from "electron";
import log from "electron-log/main";
import { SettingsService } from "./config/settings.service";
import { registerAllHandlers } from "./ipc";
import {
  connectDatabase,
  disconnectDatabase,
  runMigrations,
} from "./services/database.service";
import { createAppMenu } from "./menu";
import { aiServerService } from "./services/ai-server.service";

// Initialize logger
log.initialize();
log.transports.file.level = "info";

let mainWindow: BrowserWindow | null = null;

// Settings service singleton
export const settingsService = new SettingsService();

async function initializeDatabase() {
  // Connect to database (creates tables if needed)
  await connectDatabase();

  // Run any pending migrations
  await runMigrations();

  // Register IPC handlers
  registerAllHandlers({ settingsService });
}

async function createWindow() {
  // Match background color to current theme to prevent white flash during resize
  const isDark = nativeTheme.shouldUseDarkColors;
  const backgroundColor = isDark ? "#1a1a1a" : "#F5F5F5";

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  if (!app.isPackaged) {
    await mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Create app menu with keyboard shortcuts
  createAppMenu(mainWindow);
}

app.whenReady().then(async () => {
  try {
    log.info("App starting");
    app.setName("Kairos");
    app.setAboutPanelOptions({
      applicationName: "Kairos",
      applicationVersion: app.getVersion(),
      version: "", // hide build number
      copyright: "AI-powered resume optimization\n\nCopyright © 2025",
      iconPath: join(app.getAppPath(), "build/icon.png"),
    });
    // Apply saved theme preference
    nativeTheme.themeSource = settingsService.getTheme();
    // Start AI server (handles all AI API calls from renderer)
    await aiServerService.start();
    await initializeDatabase();
    await createWindow();
    log.info("App ready");
  } catch (error) {
    log.error("Failed to start:", error);
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async () => {
  await aiServerService.stop();
  await disconnectDatabase();
});
