import { ipcMain } from "electron";
import { ensureBackupImportNotInProgress } from "../../system";

export function guardedHandle<TArgs extends unknown[], TResult>(
  channel: string,
  listener: (...args: TArgs) => Promise<TResult> | TResult,
): void {
  ipcMain.handle(channel, async (...args: unknown[]) => {
    ensureBackupImportNotInProgress();
    return listener(...(args as TArgs));
  });
}
