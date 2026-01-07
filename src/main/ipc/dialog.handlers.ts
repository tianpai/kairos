import { dialog, ipcMain } from 'electron'
import log from 'electron-log/main'

export function registerDialogHandlers(): void {
  ipcMain.handle('dialog:selectFolder', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory'],
      })
      return result.canceled ? null : result.filePaths[0]
    } catch (error) {
      log.error('dialog:selectFolder failed', error)
      throw error
    }
  })
}
