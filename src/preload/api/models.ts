import { ipcRenderer } from "electron";
import type { ProviderType } from "../../shared/providers";

export const models = {
  fetch: (provider: ProviderType): Promise<Array<{ id: string; name: string }>> =>
    ipcRenderer.invoke("models:fetch", provider),
  getCachedIds: (provider: ProviderType): Promise<Array<string>> =>
    ipcRenderer.invoke("models:getCachedIds", provider),
  getSelected: (provider: ProviderType): Promise<string | null> =>
    ipcRenderer.invoke("models:getSelected", provider),
  setSelected: (provider: ProviderType, model: string): Promise<void> =>
    ipcRenderer.invoke("models:setSelected", provider, model),
  getDefault: (provider: ProviderType): Promise<string> =>
    ipcRenderer.invoke("models:getDefault", provider),
};
