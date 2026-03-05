import { ipcRenderer } from "electron";
import type { ProviderType } from "../../shared/providers";

export const provider = {
  getActive: (): Promise<ProviderType> =>
    ipcRenderer.invoke("provider:getActive"),
  setActive: (providerType: ProviderType): Promise<void> =>
    ipcRenderer.invoke("provider:setActive", providerType),
  resetAll: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("provider:resetAll"),
  fetchModels: (providerType: ProviderType): Promise<{ id: string; name: string }[]> =>
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
  getDefaultModel: (providerType: ProviderType): Promise<string> =>
    ipcRenderer.invoke("provider:getDefaultModel", providerType),
};
