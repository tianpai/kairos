import { ipcMain } from "electron";
import { aiServerService } from "../services/ai-server.service";

export function registerAIServerHandlers(): void {
  ipcMain.handle("aiServer:getInfo", async () => {
    return {
      port: aiServerService.getPort(),
      baseURL: aiServerService.getBaseURL(),
      wsURL: aiServerService.getWebSocketURL(),
    };
  });
}
