import { ipcRenderer } from "electron";
import type { ProviderType } from "../../../shared/providers";

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
