import { ipcRenderer } from "electron";

export const settings = {
  // OpenAI
  getApiKey: (): Promise<string | null> =>
    ipcRenderer.invoke("settings:getApiKey"),
  setApiKey: (key: string): Promise<void> =>
    ipcRenderer.invoke("settings:setApiKey", key),
  hasApiKey: (): Promise<boolean> => ipcRenderer.invoke("settings:hasApiKey"),
  deleteApiKey: (): Promise<void> =>
    ipcRenderer.invoke("settings:deleteApiKey"),
  // DeepSeek
  getDeepSeekApiKey: (): Promise<string | null> =>
    ipcRenderer.invoke("settings:getDeepSeekApiKey"),
  setDeepSeekApiKey: (key: string): Promise<void> =>
    ipcRenderer.invoke("settings:setDeepSeekApiKey", key),
  hasDeepSeekApiKey: (): Promise<boolean> =>
    ipcRenderer.invoke("settings:hasDeepSeekApiKey"),
  deleteDeepSeekApiKey: (): Promise<void> =>
    ipcRenderer.invoke("settings:deleteDeepSeekApiKey"),
  // xAI
  getXAIApiKey: (): Promise<string | null> =>
    ipcRenderer.invoke("settings:getXAIApiKey"),
  setXAIApiKey: (key: string): Promise<void> =>
    ipcRenderer.invoke("settings:setXAIApiKey", key),
  hasXAIApiKey: (): Promise<boolean> =>
    ipcRenderer.invoke("settings:hasXAIApiKey"),
  deleteXAIApiKey: (): Promise<void> =>
    ipcRenderer.invoke("settings:deleteXAIApiKey"),
  // Gemini
  getGeminiApiKey: (): Promise<string | null> =>
    ipcRenderer.invoke("settings:getGeminiApiKey"),
  setGeminiApiKey: (key: string): Promise<void> =>
    ipcRenderer.invoke("settings:setGeminiApiKey", key),
  hasGeminiApiKey: (): Promise<boolean> =>
    ipcRenderer.invoke("settings:hasGeminiApiKey"),
  deleteGeminiApiKey: (): Promise<void> =>
    ipcRenderer.invoke("settings:deleteGeminiApiKey"),
  // Anthropic
  getAnthropicApiKey: (): Promise<string | null> =>
    ipcRenderer.invoke("settings:getAnthropicApiKey"),
  setAnthropicApiKey: (key: string): Promise<void> =>
    ipcRenderer.invoke("settings:setAnthropicApiKey", key),
  hasAnthropicApiKey: (): Promise<boolean> =>
    ipcRenderer.invoke("settings:hasAnthropicApiKey"),
  deleteAnthropicApiKey: (): Promise<void> =>
    ipcRenderer.invoke("settings:deleteAnthropicApiKey"),
  resetAllProviders: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("settings:resetAllProviders"),
};
