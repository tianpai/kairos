import { contextBridge } from "electron";
import { apiKey } from "./api/api-key";
import { aiServer } from "./api/ai-server";
import { backup } from "./api/backup";
import { dialog } from "./api/dialog";
import { fs } from "./api/fs";
import { jobs } from "./api/jobs";
import { platform } from "./api/platform";
import { provider } from "./api/provider";
import { shell } from "./api/shell";
import { theme } from "./api/theme";
import { updater } from "./api/updater";
import { workflow } from "./api/workflow";

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
