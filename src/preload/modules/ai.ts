import { ipcRenderer } from "electron";
import type { ProviderType } from "../../shared/providers";

export const aiServer = {
  getInfo: (): Promise<{ port: number; baseURL: string; wsURL: string }> =>
    ipcRenderer.invoke("aiServer:getInfo"),
};

export const apiKey = {
  get: (provider: ProviderType): Promise<string | null> =>
    ipcRenderer.invoke("apiKey:get", provider),
  set: (provider: ProviderType, key: string): Promise<void> =>
    ipcRenderer.invoke("apiKey:set", provider, key),
  has: (provider: ProviderType): Promise<boolean> =>
    ipcRenderer.invoke("apiKey:has", provider),
  delete: (provider: ProviderType): Promise<void> =>
    ipcRenderer.invoke("apiKey:delete", provider),
};

export const provider = {
  getActive: (): Promise<ProviderType | null> =>
    ipcRenderer.invoke("provider:getActive"),
  setActive: (providerType: ProviderType): Promise<void> =>
    ipcRenderer.invoke("provider:setActive", providerType),
  resetAll: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("provider:resetAll"),
  fetchModels: (
    providerType: ProviderType,
  ): Promise<{ id: string; name: string }[]> =>
    ipcRenderer.invoke("provider:fetchModels", providerType),
  getCachedModels: (providerType: ProviderType): Promise<string[]> =>
    ipcRenderer.invoke("provider:getCachedModels", providerType),
  getSelectedModel: (providerType: ProviderType): Promise<string | null> =>
    ipcRenderer.invoke("provider:getSelectedModel", providerType),
  setSelectedModel: (
    providerType: ProviderType,
    model: string,
  ): Promise<void> =>
    ipcRenderer.invoke("provider:setSelectedModel", providerType, model),
};
