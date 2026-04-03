import { contextBridge } from "electron";
import { aiServer, apiKey, provider } from "./modules/ai";
import { checklist, jobs, resume } from "./modules/workspace";
import { job, workflow } from "./modules/workflow";
import { theme } from "./modules/user";
import { backup, dialog, fs, shell, updater } from "./modules/system";

contextBridge.exposeInMainWorld("kairos", {
  backup,
  shell,
  dialog,
  fs,
  apiKey,
  provider,
  theme,
  aiServer,
  jobs,
  checklist,
  resume,
  job,
  workflow,
  updater,
});
