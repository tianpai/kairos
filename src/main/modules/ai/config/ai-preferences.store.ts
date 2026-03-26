import Store from "electron-store";
import type { ProviderType } from "../../../../shared/providers";

interface ProviderSettings {
  apiKey: string | null;
  selectedModel: string | null;
  cachedModels: string[];
}

interface AiSettingsSchema {
  aiProviders: Record<ProviderType, ProviderSettings>;
  activeProvider: ProviderType;
}

const PROVIDERS: ProviderType[] = [
  "openai",
  "deepseek",
  "xai",
  "gemini",
  "anthropic",
];

export class AiPreferencesStore {
  private store;

  constructor() {
    this.store = new Store<AiSettingsSchema>({
      name: "ai",
      defaults: {
        aiProviders: {
          openai: {
            apiKey: null,
            selectedModel: null,
            cachedModels: [],
          },
          deepseek: {
            apiKey: null,
            selectedModel: null,
            cachedModels: [],
          },
          xai: {
            apiKey: null,
            selectedModel: null,
            cachedModels: [],
          },
          gemini: {
            apiKey: null,
            selectedModel: null,
            cachedModels: [],
          },
          anthropic: {
            apiKey: null,
            selectedModel: null,
            cachedModels: [],
          },
        },
        activeProvider: "openai",
      },
    });
  }

  getApiKey(provider: ProviderType): string | null {
    return this.store.get(`aiProviders.${provider}.apiKey` as const);
  }

  setApiKey(provider: ProviderType, key: string): void {
    this.store.set(`aiProviders.${provider}.apiKey` as const, key);
  }

  hasApiKey(provider: ProviderType): boolean {
    return !!this.getApiKey(provider);
  }

  deleteApiKey(provider: ProviderType): void {
    this.store.set(`aiProviders.${provider}.apiKey` as const, null);
  }

  getSelectedModel(provider: ProviderType): string | null {
    return this.store.get(`aiProviders.${provider}.selectedModel` as const);
  }

  setSelectedModel(provider: ProviderType, model: string): void {
    this.store.set(`aiProviders.${provider}.selectedModel` as const, model);
  }

  getCachedModels(provider: ProviderType): string[] {
    return this.store.get(`aiProviders.${provider}.cachedModels` as const);
  }

  setCachedModels(provider: ProviderType, models: string[]): void {
    this.store.set(`aiProviders.${provider}.cachedModels` as const, models);
  }

  getActiveProvider(): ProviderType {
    return this.store.get("activeProvider");
  }

  setActiveProvider(provider: ProviderType): void {
    this.store.set("activeProvider", provider);
  }

  hasActiveProviderConfigured(): boolean {
    return this.hasApiKey(this.getActiveProvider());
  }

  resetAllProviders(): void {
    for (const provider of PROVIDERS) {
      this.store.set(`aiProviders.${provider}.apiKey` as const, null);
      this.store.set(`aiProviders.${provider}.selectedModel` as const, null);
      this.store.set(`aiProviders.${provider}.cachedModels` as const, []);
    }

    this.store.set("activeProvider", "openai");
  }
}
