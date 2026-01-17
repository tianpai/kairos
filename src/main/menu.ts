import { Menu, app } from "electron";
import type { BrowserWindow } from "electron";

export function createAppMenu(mainWindow: BrowserWindow | null) {
  const isMac = process.platform === "darwin";

  const template: Array<Electron.MenuItemConstructorOptions> = [
    // App menu (macOS only)
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              {
                label: "Settings...",
                accelerator: "CommandOrControl+,",
                click: () => {
                  mainWindow?.webContents.send("shortcut:settings");
                },
              },
              { type: "separator" as const },
              { role: "services" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          } as Electron.MenuItemConstructorOptions,
        ]
      : []),
    // File menu
    {
      label: "File",
      submenu: [
        {
          label: "New Application",
          accelerator: "CommandOrControl+N",
          click: () => {
            mainWindow?.webContents.send("shortcut:new-application");
          },
        },
        {
          label: "Save",
          accelerator: "CommandOrControl+S",
          click: () => {
            mainWindow?.webContents.send("shortcut:save");
          },
        },
        {
          label: "Export PDF...",
          accelerator: "CommandOrControl+Shift+E",
          click: () => {
            mainWindow?.webContents.send("shortcut:export-pdf");
          },
        },
        {
          label: "Export PDFs...",
          accelerator: "CommandOrControl+Shift+B",
          click: () => {
            mainWindow?.webContents.send("shortcut:batch-export");
          },
        },
        { type: "separator" },
        {
          label: "Document Settings...",
          accelerator: "CommandOrControl+D",
          click: () => {
            mainWindow?.webContents.send("shortcut:document-settings");
          },
        },
        { type: "separator" },
        {
          label: "Previous Application",
          accelerator: "CommandOrControl+[",
          click: () => {
            mainWindow?.webContents.send("shortcut:prev-app");
          },
        },
        {
          label: "Next Application",
          accelerator: "CommandOrControl+]",
          click: () => {
            mainWindow?.webContents.send("shortcut:next-app");
          },
        },
        {
          label: "Jump to First",
          accelerator: "CommandOrControl+Shift+[",
          click: () => {
            mainWindow?.webContents.send("shortcut:latest-app");
          },
        },
        {
          label: "Jump to Last",
          accelerator: "CommandOrControl+Shift+]",
          click: () => {
            mainWindow?.webContents.send("shortcut:oldest-app");
          },
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    // AI menu
    {
      label: "AI",
      submenu: [
        {
          label: "Tailor Resume",
          accelerator: "CommandOrControl+T",
          click: () => {
            mainWindow?.webContents.send("shortcut:tailor");
          },
        },
      ],
    },
    // Workflow menu (placeholder)
    {
      label: "Workflow",
      submenu: [
        {
          label: "No workflows available",
          enabled: false,
        },
      ],
    },
    // Edit menu
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...(isMac
          ? [
              { role: "pasteAndMatchStyle" as const },
              { role: "delete" as const },
              { role: "selectAll" as const },
            ]
          : [
              { role: "delete" as const },
              { type: "separator" as const },
              { role: "selectAll" as const },
            ]),
      ],
    },
    // View menu
    {
      label: "View",
      submenu: [
        {
          label: "Toggle Checklist",
          accelerator: "CommandOrControl+\\",
          click: () => {
            mainWindow?.webContents.send("shortcut:toggle-columns");
          },
        },
        { type: "separator" },
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    // Window menu
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? [
              { type: "separator" as const },
              { role: "front" as const },
              { type: "separator" as const },
              { role: "window" as const },
            ]
          : [{ role: "close" as const }]),
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
