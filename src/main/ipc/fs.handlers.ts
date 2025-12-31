import { ipcMain } from 'electron'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import log from 'electron-log/main'

export function registerFsHandlers(): void {
  ipcMain.handle(
    'fs:writeFile',
    async (_, folderPath: string, filename: string, data: ArrayBuffer) => {
      try {
        const filePath = join(folderPath, filename)
        await writeFile(filePath, Buffer.from(data))
        log.info(`File written: ${filePath}`)
        return { success: true, path: filePath }
      } catch (error) {
        log.error('fs:writeFile failed', error)
        throw error
      }
    },
  )
}
