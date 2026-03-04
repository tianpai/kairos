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
    xai: {
      apiKey: string | null;
      selectedModel: string | null;
      cachedModels: string[];
    };
    gemini: {
      apiKey: string | null;
      selectedModel: string | null;
      cachedModels: string[];
    };
    anthropic: {
      apiKey: string | null;
      selectedModel: string | null;
      cachedModels: string[];
    };
  };
  activeProvider:
    | "openai"
    | "deepseek"
    | "xai"
    | "gemini"
    | "anthropic";
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

  // xAI methods
  getXAIKey(): string | null {
    return this.store.get("aiProviders.xai.apiKey");
  }

  setXAIKey(key: string): void {
    this.store.set("aiProviders.xai.apiKey", key);
  }

  hasXAIKey(): boolean {
    return !!this.store.get("aiProviders.xai.apiKey");
  }

  deleteXAIKey(): void {
    this.store.set("aiProviders.xai.apiKey", null);
  }

  getXAISelectedModel(): string | null {
    return this.store.get("aiProviders.xai.selectedModel");
  }

  setXAISelectedModel(model: string): void {
    this.store.set("aiProviders.xai.selectedModel", model);
  }

  getXAICachedModels(): string[] {
    return this.store.get("aiProviders.xai.cachedModels");
  }

  setXAICachedModels(models: string[]): void {
    this.store.set("aiProviders.xai.cachedModels", models);
  }

  // Gemini methods
  getGeminiKey(): string | null {
    return this.store.get("aiProviders.gemini.apiKey");
  }

  setGeminiKey(key: string): void {
    this.store.set("aiProviders.gemini.apiKey", key);
  }

  hasGeminiKey(): boolean {
    return !!this.store.get("aiProviders.gemini.apiKey");
  }

  deleteGeminiKey(): void {
    this.store.set("aiProviders.gemini.apiKey", null);
  }

  getGeminiSelectedModel(): string | null {
    return this.store.get("aiProviders.gemini.selectedModel");
  }

  setGeminiSelectedModel(model: string): void {
    this.store.set("aiProviders.gemini.selectedModel", model);
  }

  getGeminiCachedModels(): string[] {
    return this.store.get("aiProviders.gemini.cachedModels");
  }

  setGeminiCachedModels(models: string[]): void {
    this.store.set("aiProviders.gemini.cachedModels", models);
  }

  // Anthropic methods
  getAnthropicKey(): string | null {
    return this.store.get("aiProviders.anthropic.apiKey");
  }

  setAnthropicKey(key: string): void {
    this.store.set("aiProviders.anthropic.apiKey", key);
  }

  hasAnthropicKey(): boolean {
    return !!this.store.get("aiProviders.anthropic.apiKey");
  }

  deleteAnthropicKey(): void {
    this.store.set("aiProviders.anthropic.apiKey", null);
  }

  getAnthropicSelectedModel(): string | null {
    return this.store.get("aiProviders.anthropic.selectedModel");
  }

  setAnthropicSelectedModel(model: string): void {
    this.store.set("aiProviders.anthropic.selectedModel", model);
  }

  getAnthropicCachedModels(): string[] {
    return this.store.get("aiProviders.anthropic.cachedModels");
  }

  setAnthropicCachedModels(models: string[]): void {
    this.store.set("aiProviders.anthropic.cachedModels", models);
  }

  // Active provider methods
  getActiveProvider():
    | "openai"
    | "deepseek"
    | "xai"
    | "gemini"
    | "anthropic" {
    return this.store.get("activeProvider");
  }

  setActiveProvider(
    provider: "openai" | "deepseek" | "xai" | "gemini" | "anthropic",
  ): void {
    this.store.set("activeProvider", provider);
  }

  hasActiveProviderConfigured(): boolean {
    const active = this.getActiveProvider();
    switch (active) {
      case "openai":
        return this.hasOpenAIKey();
      case "deepseek":
        return this.hasDeepSeekKey();
      case "xai":
        return this.hasXAIKey();
      case "gemini":
        return this.hasGeminiKey();
      case "anthropic":
        return this.hasAnthropicKey();
    }
  }

  // Theme methods
  getTheme(): ThemeSource {
    return this.store.get("theme");
  }

  setTheme(theme: ThemeSource): void {
    this.store.set("theme", theme);
  }

  // Reset all provider settings to defaults
  resetAllProviders(): void {
    // Reset all API keys
    this.store.set("aiProviders.openai.apiKey", null);
    this.store.set("aiProviders.deepseek.apiKey", null);
    this.store.set("aiProviders.xai.apiKey", null);
    this.store.set("aiProviders.gemini.apiKey", null);
    this.store.set("aiProviders.anthropic.apiKey", null);

    // Reset all selected models
    this.store.set("aiProviders.openai.selectedModel", null);
    this.store.set("aiProviders.deepseek.selectedModel", null);
    this.store.set("aiProviders.xai.selectedModel", null);
    this.store.set("aiProviders.gemini.selectedModel", null);
    this.store.set("aiProviders.anthropic.selectedModel", null);

    // Reset cached models
    this.store.set("aiProviders.openai.cachedModels", []);
    this.store.set("aiProviders.deepseek.cachedModels", []);
    this.store.set("aiProviders.xai.cachedModels", []);
    this.store.set("aiProviders.gemini.cachedModels", []);
    this.store.set("aiProviders.anthropic.cachedModels", []);

    // Reset active provider to default
    this.store.set("activeProvider", "openai");
  }
}
