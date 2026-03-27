export { AITaskClient, getAIClient, initAIClient } from "./client/ai-task-client";
export { AiPreferencesStore } from "./config/ai-preferences.store";
export { registerApiKeyHandlers } from "./ipc/api-key.ipc";
export { registerProviderHandlers } from "./ipc/provider.ipc";
export { createAIProvider } from "./provider";
export type { AIProvider, AIProviderConfig } from "./provider";
export { prompt } from "./prompts";
