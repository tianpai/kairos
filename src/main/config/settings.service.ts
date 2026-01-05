import Store from "electron-store";

type ThemeSource = "system" | "light" | "dark";

interface SettingsSchema {
  aiProviders: {
    openai: {
      apiKey: string | null;
      selectedModel: string | null;
      cachedModels: string[];
    };
    deepseek: {
      apiKey: string | null;
      selectedModel: string | null;
      cachedModels: string[];
    };
  };
  activeProvider: "openai" | "deepseek";
  theme: ThemeSource;
}

export class SettingsService {
  private store;

  constructor() {
    this.store = new Store<SettingsSchema>({
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
        },
        activeProvider: "openai",
        theme: "system",
      },
    });
  }

  getOpenAIKey(): string | null {
    return this.store.get("aiProviders.openai.apiKey");
  }

  setOpenAIKey(key: string): void {
    this.store.set("aiProviders.openai.apiKey", key);
  }

  hasOpenAIKey(): boolean {
    return !!this.store.get("aiProviders.openai.apiKey");
  }

  deleteOpenAIKey(): void {
    this.store.set("aiProviders.openai.apiKey", null);
  }

  // Fallback to environment variable (temporary, remove after Phase 3)
  getOpenAIKeyWithFallback(): string | null {
    const key = this.getOpenAIKey();
    if (key) return key;
    return process.env.OPENAI_API_KEY || null;
  }

  // OpenAI Model methods
  getOpenAISelectedModel(): string | null {
    return this.store.get("aiProviders.openai.selectedModel");
  }

  setOpenAISelectedModel(model: string): void {
    this.store.set("aiProviders.openai.selectedModel", model);
  }

  getOpenAICachedModels(): string[] {
    return this.store.get("aiProviders.openai.cachedModels");
  }

  setOpenAICachedModels(models: string[]): void {
    this.store.set("aiProviders.openai.cachedModels", models);
  }

  // DeepSeek methods
  getDeepSeekKey(): string | null {
    return this.store.get("aiProviders.deepseek.apiKey");
  }

  setDeepSeekKey(key: string): void {
    this.store.set("aiProviders.deepseek.apiKey", key);
  }

  hasDeepSeekKey(): boolean {
    return !!this.store.get("aiProviders.deepseek.apiKey");
  }

  deleteDeepSeekKey(): void {
    this.store.set("aiProviders.deepseek.apiKey", null);
  }

  getDeepSeekSelectedModel(): string | null {
    return this.store.get("aiProviders.deepseek.selectedModel");
  }

  setDeepSeekSelectedModel(model: string): void {
    this.store.set("aiProviders.deepseek.selectedModel", model);
  }

  getDeepSeekCachedModels(): string[] {
    return this.store.get("aiProviders.deepseek.cachedModels");
  }

  setDeepSeekCachedModels(models: string[]): void {
    this.store.set("aiProviders.deepseek.cachedModels", models);
  }

  // Active provider methods
  getActiveProvider(): "openai" | "deepseek" {
    return this.store.get("activeProvider");
  }

  setActiveProvider(provider: "openai" | "deepseek"): void {
    this.store.set("activeProvider", provider);
  }

  // Theme methods
  getTheme(): ThemeSource {
    return this.store.get("theme");
  }

  setTheme(theme: ThemeSource): void {
    this.store.set("theme", theme);
  }
}
