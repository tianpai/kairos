import Store from "electron-store";

type ThemeSource = "system" | "light" | "dark";

interface SettingsSchema {
  aiProviders: {
    openai: {
      apiKey: string | null;
      selectedModel: string | null;
      cachedModels: Array<string>;
    };
    deepseek: {
      apiKey: string | null;
      selectedModel: string | null;
      cachedModels: Array<string>;
    };
    claude: {
      // No apiKey - Claude uses OAuth tokens stored separately
      selectedModel: string | null;
      cachedModels: Array<string>;
    };
  };
  activeProvider: "openai" | "deepseek" | "claude";
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
          claude: {
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

  getOpenAICachedModels(): Array<string> {
    return this.store.get("aiProviders.openai.cachedModels");
  }

  setOpenAICachedModels(models: Array<string>): void {
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

  getDeepSeekCachedModels(): Array<string> {
    return this.store.get("aiProviders.deepseek.cachedModels");
  }

  setDeepSeekCachedModels(models: Array<string>): void {
    this.store.set("aiProviders.deepseek.cachedModels", models);
  }

  // Claude methods (no API key - uses OAuth tokens stored separately)
  getClaudeSelectedModel(): string | null {
    return this.store.get("aiProviders.claude.selectedModel");
  }

  setClaudeSelectedModel(model: string): void {
    this.store.set("aiProviders.claude.selectedModel", model);
  }

  getClaudeCachedModels(): Array<string> {
    return this.store.get("aiProviders.claude.cachedModels");
  }

  setClaudeCachedModels(models: Array<string>): void {
    this.store.set("aiProviders.claude.cachedModels", models);
  }

  // Active provider methods
  getActiveProvider(): "openai" | "deepseek" | "claude" {
    return this.store.get("activeProvider");
  }

  setActiveProvider(provider: "openai" | "deepseek" | "claude"): void {
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
