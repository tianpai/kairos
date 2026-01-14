import { app, shell } from "electron";
import { autoUpdater } from "electron-updater";
import log from "electron-log/main";
import type { UpdateInfo } from "electron-updater";
import type { UpdateState, UpdateStatus } from "../../shared/updater";

class UpdaterService {
  private currentState: UpdateState = { status: "idle" };
  private updateInfo: UpdateInfo | null = null;

  constructor() {
    // Configure autoUpdater
    autoUpdater.logger = log;
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    autoUpdater.on("checking-for-update", () => {
      log.info("[Updater] Checking for updates...");
      this.currentState = { status: "checking" };
    });

    autoUpdater.on("update-available", (info: UpdateInfo) => {
      log.info(`[Updater] Update available: ${info.version}`);
      this.updateInfo = info;
      this.currentState = {
        status: "available",
        version: info.version,
        releaseNotes:
          typeof info.releaseNotes === "string" ? info.releaseNotes : undefined,
      };
    });

    autoUpdater.on("update-not-available", (info: UpdateInfo) => {
      log.info(
        `[Updater] No update available. Current: ${app.getVersion()}, Latest: ${info.version}`,
      );
      this.currentState = {
        status: "not-available",
        version: info.version,
      };
    });

    autoUpdater.on("error", (error: Error) => {
      log.error("[Updater] Error:", error.message);
      this.currentState = {
        status: "error",
        error: error.message,
      };
    });

    autoUpdater.on("download-progress", (progress) => {
      log.info(`[Updater] Download progress: ${progress.percent.toFixed(1)}%`);
      this.currentState = {
        status: "downloading",
        version: this.updateInfo?.version,
        progress: {
          percent: progress.percent,
          bytesPerSecond: progress.bytesPerSecond,
          transferred: progress.transferred,
          total: progress.total,
        },
      };
    });

    autoUpdater.on("update-downloaded", (info: UpdateInfo) => {
      log.info(`[Updater] Update downloaded: ${info.version}`);
      this.currentState = {
        status: "downloaded",
        version: info.version,
      };
    });
  }

  getState(): UpdateState {
    return this.currentState;
  }

  async checkForUpdates(): Promise<UpdateState> {
    try {
      this.currentState = { status: "checking" };
      await autoUpdater.checkForUpdates();
      return this.currentState;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("[Updater] Check failed:", message);
      this.currentState = { status: "error", error: message };
      return this.currentState;
    }
  }

  async openReleasesPage(): Promise<void> {
    const url = "https://github.com/tianpai/kairos/releases/latest";
    log.info(`[Updater] Opening releases page: ${url}`);
    await shell.openExternal(url);
  }

  async downloadUpdate(): Promise<void> {
    if (this.currentState.status !== "available") {
      log.warn("[Updater] No update available to download");
      return;
    }

    try {
      log.info("[Updater] Starting download...");
      await autoUpdater.downloadUpdate();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("[Updater] Download failed:", message);
      this.currentState = { status: "error", error: message };
    }
  }

  quitAndInstall(): void {
    log.info("[Updater] Quitting and installing...");
    // Defer to ensure IPC response is sent before app quits
    setImmediate(() => {
      autoUpdater.quitAndInstall(false, true);
    });
  }

  getCurrentVersion(): string {
    return app.getVersion();
  }

  getLatestVersion(): string | null {
    return this.updateInfo?.version ?? null;
  }

  isPackaged(): boolean {
    return app.isPackaged;
  }
}

export const updaterService = new UpdaterService();
