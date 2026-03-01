import type { UpdateState } from '../../../shared/updater'

export type { UpdateState } from '../../../shared/updater'

export function isUpdaterPackaged(): Promise<boolean> {
  return window.kairos.updater.isPackaged()
}

export function checkForUpdates(): Promise<UpdateState> {
  return window.kairos.updater.check()
}

export function getUpdaterState(): Promise<UpdateState> {
  return window.kairos.updater.getState()
}

export function downloadUpdate(): Promise<void> {
  return window.kairos.updater.download()
}

export function quitAndInstallUpdate(): Promise<void> {
  return window.kairos.updater.quitAndInstall()
}

export function openUpdaterReleasesPage(): Promise<void> {
  return window.kairos.updater.openReleasesPage()
}
