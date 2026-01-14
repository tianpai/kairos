import { ipcRenderer } from "electron";
import type { ProviderType } from "../../shared/providers";

export const provider = {
  getActive: (): Promise<ProviderType> =>
    ipcRenderer.invoke("provider:getActive"),
  setActive: (providerType: ProviderType): Promise<void> =>
    ipcRenderer.invoke("provider:setActive", providerType),
};
