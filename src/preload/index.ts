import { contextBridge } from "electron";
import { aiServer } from "./api/ai-server";
import { dialog } from "./api/dialog";
import { fs } from "./api/fs";
import { jobs } from "./api/jobs";
import { models } from "./api/models";
import { ollama } from "./api/ollama";
import { platform } from "./api/platform";
import { provider } from "./api/provider";
import { settings } from "./api/settings";
import { shell } from "./api/shell";
import { shortcuts } from "./api/shortcuts";
import { theme } from "./api/theme";
import { updater } from "./api/updater";

contextBridge.exposeInMainWorld("kairos", {
  shortcuts,
  platform,
  shell,
  dialog,
  fs,
  settings,
  models,
  provider,
  ollama,
  theme,
  aiServer,
  jobs,
  updater,
});
