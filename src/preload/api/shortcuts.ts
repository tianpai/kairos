import { ipcRenderer } from "electron";

type ShortcutCallback = () => void;
type Unsubscribe = () => void;

const onShortcut = (
  channel: string,
  callback: ShortcutCallback,
): Unsubscribe => {
  const handler = () => callback();
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
};

export const shortcuts = {
  onSettings: (callback: ShortcutCallback): Unsubscribe =>
    onShortcut("shortcut:settings", callback),
  onNewApplication: (callback: ShortcutCallback): Unsubscribe =>
    onShortcut("shortcut:new-application", callback),
  onSave: (callback: ShortcutCallback): Unsubscribe =>
    onShortcut("shortcut:save", callback),
  onExportPdf: (callback: ShortcutCallback): Unsubscribe =>
    onShortcut("shortcut:export-pdf", callback),
  onDocumentSettings: (callback: ShortcutCallback): Unsubscribe =>
    onShortcut("shortcut:document-settings", callback),
  onPrevApp: (callback: ShortcutCallback): Unsubscribe =>
    onShortcut("shortcut:prev-app", callback),
  onNextApp: (callback: ShortcutCallback): Unsubscribe =>
    onShortcut("shortcut:next-app", callback),
  onLatestApp: (callback: ShortcutCallback): Unsubscribe =>
    onShortcut("shortcut:latest-app", callback),
  onOldestApp: (callback: ShortcutCallback): Unsubscribe =>
    onShortcut("shortcut:oldest-app", callback),
  onTailor: (callback: ShortcutCallback): Unsubscribe =>
    onShortcut("shortcut:tailor", callback),
  onToggleSidebar: (callback: ShortcutCallback): Unsubscribe =>
    onShortcut("shortcut:toggle-sidebar", callback),
  onToggleColumns: (callback: ShortcutCallback): Unsubscribe =>
    onShortcut("shortcut:toggle-columns", callback),
  onBatchExport: (callback: ShortcutCallback): Unsubscribe =>
    onShortcut("shortcut:batch-export", callback),
};
