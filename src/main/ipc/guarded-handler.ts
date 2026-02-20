import { ipcMain } from "electron";
import { ensureBackupImportNotInProgress } from "../services/backup.service";

export function guardedHandle<TArgs extends Array<unknown>, TResult>(
  channel: string,
  listener: (...args: TArgs) => Promise<TResult> | TResult,
): void {
  ipcMain.handle(channel, async (...args: Array<unknown>) => {
    ensureBackupImportNotInProgress();
    return listener(...(args as TArgs));
  });
}
