import { ipcRenderer } from "electron";
import type { OllamaPullProgress } from "../../shared/ollama";

type OllamaPullProgressEvent = {
  modelName: string;
  progress: OllamaPullProgress;
};

export const ollama = {
  isRunning: (): Promise<boolean> => ipcRenderer.invoke("ollama:isRunning"),
  getVersion: (): Promise<string | null> =>
    ipcRenderer.invoke("ollama:getVersion"),
  getInstalledModels: (): Promise<Array<{ id: string; name: string }>> =>
    ipcRenderer.invoke("ollama:getInstalledModels"),
  getCuratedModels: (): Promise<Array<{ id: string; name: string }>> =>
    ipcRenderer.invoke("ollama:getCuratedModels"),
  pullModel: (
    modelName: string,
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke("ollama:pullModel", modelName),
  cancelPull: (): Promise<void> => ipcRenderer.invoke("ollama:cancelPull"),
  getBaseUrl: (): Promise<string> => ipcRenderer.invoke("ollama:getBaseUrl"),
  setBaseUrl: (url: string): Promise<void> =>
    ipcRenderer.invoke("ollama:setBaseUrl", url),
  onPullProgress: (callback: (data: OllamaPullProgressEvent) => void) => {
    const handler = (_: unknown, data: OllamaPullProgressEvent) =>
      callback(data);
    ipcRenderer.on("ollama:pullProgress", handler);
    return () => ipcRenderer.removeListener("ollama:pullProgress", handler);
  },
};
