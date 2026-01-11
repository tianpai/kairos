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
      // No apiKey - Claude uses OAuth tokens or CLI
      authMode: "oauth" | "cli";
      cliPath: string | null; // User-configured path to claude binary
      selectedModel: string | null;
      cachedModels: Array<string>;
    };
    ollama: {
      // No apiKey - Ollama runs locally
      baseUrl: string;
      selectedModel: string | null;
      cachedModels: Array<string>;
    };
    xai: {
      apiKey: string | null;
      selectedModel: string | null;
      cachedModels: Array<string>;
    };
    gemini: {
      apiKey: string | null;
      selectedModel: string | null;
      cachedModels: Array<string>;
    };
    anthropic: {
      apiKey: string | null;
      selectedModel: string | null;
      cachedModels: Array<string>;
    };
  };
  activeProvider: "openai" | "deepseek" | "claude" | "ollama" | "xai" | "gemini" | "anthropic";
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
            authMode: "cli",
            cliPath: null,
            selectedModel: null,
            cachedModels: [],
          },
          ollama: {
            baseUrl: "http://localhost:11434",
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

    // Migrate existing Claude users to OAuth mode (backward compatibility)
    // New users without existing Claude config will default to CLI
    if (!this.store.has("aiProviders.claude.authMode")) {
      const hasClaudeModels = this.store.has("aiProviders.claude.selectedModel");
      const defaultMode = hasClaudeModels ? "oauth" : "cli";
      this.store.set("aiProviders.claude.authMode", defaultMode);
    }
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

  // Claude methods (no API key - uses OAuth tokens or CLI)
  getClaudeAuthMode(): "oauth" | "cli" {
    return this.store.get("aiProviders.claude.authMode");
  }

  setClaudeAuthMode(mode: "oauth" | "cli"): void {
    this.store.set("aiProviders.claude.authMode", mode);
  }

  getClaudeCliPath(): string | null {
    return this.store.get("aiProviders.claude.cliPath");
  }

  setClaudeCliPath(path: string | null): void {
    this.store.set("aiProviders.claude.cliPath", path);
  }

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

  // Ollama methods (no API key - runs locally)
  getOllamaBaseUrl(): string {
    return this.store.get("aiProviders.ollama.baseUrl");
  }

  setOllamaBaseUrl(url: string): void {
    this.store.set("aiProviders.ollama.baseUrl", url);
  }

  getOllamaSelectedModel(): string | null {
    return this.store.get("aiProviders.ollama.selectedModel");
  }

  setOllamaSelectedModel(model: string): void {
    this.store.set("aiProviders.ollama.selectedModel", model);
  }

  getOllamaCachedModels(): Array<string> {
    return this.store.get("aiProviders.ollama.cachedModels");
  }

  setOllamaCachedModels(models: Array<string>): void {
    this.store.set("aiProviders.ollama.cachedModels", models);
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

  getXAICachedModels(): Array<string> {
    return this.store.get("aiProviders.xai.cachedModels");
  }

  setXAICachedModels(models: Array<string>): void {
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

  getGeminiCachedModels(): Array<string> {
    return this.store.get("aiProviders.gemini.cachedModels");
  }

  setGeminiCachedModels(models: Array<string>): void {
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

  getAnthropicCachedModels(): Array<string> {
    return this.store.get("aiProviders.anthropic.cachedModels");
  }

  setAnthropicCachedModels(models: Array<string>): void {
    this.store.set("aiProviders.anthropic.cachedModels", models);
  }

  // Active provider methods
  getActiveProvider(): "openai" | "deepseek" | "claude" | "ollama" | "xai" | "gemini" | "anthropic" {
    return this.store.get("activeProvider");
  }

  setActiveProvider(provider: "openai" | "deepseek" | "claude" | "ollama" | "xai" | "gemini" | "anthropic"): void {
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
      case "claude":
        // Claude uses OAuth or CLI - renderer checks actual auth status
        // Return true here, let renderer handle detailed check
        return true;
      case "ollama":
        // Ollama runs locally - renderer checks if server is running
        // Return true here, let renderer handle detailed check
        return true;
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
  // Note: "claude" = CLI/OAuth auth, "anthropic" = direct API key auth (separate providers)
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
    this.store.set("aiProviders.claude.selectedModel", null);
    this.store.set("aiProviders.ollama.selectedModel", null);
    this.store.set("aiProviders.xai.selectedModel", null);
    this.store.set("aiProviders.gemini.selectedModel", null);
    this.store.set("aiProviders.anthropic.selectedModel", null);

    // Reset cached models
    this.store.set("aiProviders.openai.cachedModels", []);
    this.store.set("aiProviders.deepseek.cachedModels", []);
    this.store.set("aiProviders.claude.cachedModels", []);
    this.store.set("aiProviders.ollama.cachedModels", []);
    this.store.set("aiProviders.xai.cachedModels", []);
    this.store.set("aiProviders.gemini.cachedModels", []);
    this.store.set("aiProviders.anthropic.cachedModels", []);

    // Reset Claude CLI/OAuth config
    this.store.set("aiProviders.claude.authMode", "cli");
    this.store.set("aiProviders.claude.cliPath", null);

    // Reset Ollama to default
    this.store.set("aiProviders.ollama.baseUrl", "http://localhost:11434");

    // Reset active provider to default
    this.store.set("activeProvider", "openai");
  }
}
