import Store from "electron-store";
import type { ProviderType } from "@shared/providers";

interface ProviderSettings {
  apiKey: string | null;
  selectedModel: string | null;
  cachedModels: string[];
}

interface AiSettingsSchema {
  aiProviders: Record<ProviderType, ProviderSettings>;
  activeProvider: ProviderType | null;
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
    const defaultProvider: ProviderSettings = {
      apiKey: null,
      selectedModel: null,
      cachedModels: [],
    };

    this.store = new Store<AiSettingsSchema>({
      name: "ai",
      defaults: {
        aiProviders: Object.fromEntries(
          PROVIDERS.map((p) => [p, { ...defaultProvider }]),
        ) as Record<ProviderType, ProviderSettings>,
        activeProvider: null,
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

  getActiveProvider(): ProviderType | null {
    return this.store.get("activeProvider");
  }

  setActiveProvider(provider: ProviderType): void {
    this.store.set("activeProvider", provider);
  }

  hasActiveProviderConfigured(): boolean {
    const active = this.getActiveProvider();
    return active !== null && this.hasApiKey(active);
  }

  resetAllProviders(): void {
    for (const provider of PROVIDERS) {
      this.store.set(`aiProviders.${provider}.apiKey` as const, null);
      this.store.set(`aiProviders.${provider}.selectedModel` as const, null);
      this.store.set(`aiProviders.${provider}.cachedModels` as const, []);
    }

    this.store.set("activeProvider", null);
  }
}
