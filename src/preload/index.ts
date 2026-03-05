import { contextBridge } from "electron";
import { aiServer, apiKey, provider } from "./modules/ai";
import { jobs } from "./modules/workspace";
import { workflow } from "./modules/workflow";
import { theme } from "./modules/user";
import { backup, dialog, fs, platform, shell, updater } from "./modules/system";

contextBridge.exposeInMainWorld("kairos", {
  platform,
  backup,
  shell,
  dialog,
  fs,
  apiKey,
  provider,
  theme,
  aiServer,
  jobs,
  workflow,
  updater,
});
