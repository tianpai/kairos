import type { ProviderType } from "@shared/providers";

export { fetchModels, ModelInfo };

interface ModelInfo {
  id: string;
  name: string;
  owned_by?: string;
}

interface ProviderModelConfig {
  baseUrl: string;
  getUrl: (baseUrl: string, apiKey: string) => string;
  getHeaders: (apiKey: string) => Record<string, string>;
  parseModels: (json: unknown) => ModelInfo[];
}

const bearerHeaders = (apiKey: string) => ({
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
});

const modelsUrl = (baseUrl: string) => `${baseUrl}/models`;

/** OpenAI-compatible response: { data: [{ id, owned_by? }] } */
const parseOpenAICompatible = (json: unknown): ModelInfo[] => {
  const { data } = json as { data: { id: string; owned_by?: string }[] };
  return data.map((m) => ({ id: m.id, name: m.id, owned_by: m.owned_by }));
};

const PROVIDER_CONFIGS: Record<ProviderType, ProviderModelConfig> = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    getUrl: modelsUrl,
    getHeaders: bearerHeaders,
    parseModels: parseOpenAICompatible,
  },
  deepseek: {
    baseUrl: "https://api.deepseek.com/v1",
    getUrl: modelsUrl,
    getHeaders: bearerHeaders,
    parseModels: parseOpenAICompatible,
  },
  xai: {
    baseUrl: "https://api.x.ai/v1",
    getUrl: modelsUrl,
    getHeaders: bearerHeaders,
    parseModels: parseOpenAICompatible,
  },
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    getUrl: (baseUrl, apiKey) => `${baseUrl}/models?key=${apiKey}`,
    getHeaders: () => ({ "Content-Type": "application/json" }),
    parseModels: (json) => {
      const { models } = json as {
        models: { name: string; displayName: string }[];
      };
      return models
        .filter((m) => m.name.includes("gemini"))
        .map((m) => ({
          id: m.name.replace("models/", ""),
          name: m.displayName || m.name.replace("models/", ""),
        }))
        .sort((a, b) => a.id.localeCompare(b.id));
    },
  },
  moonshotai: {
    baseUrl: "https://api.moonshot.ai/v1",
    getUrl: modelsUrl,
    getHeaders: bearerHeaders,
    parseModels: parseOpenAICompatible,
  },
  anthropic: {
    baseUrl: "https://api.anthropic.com/v1",
    getUrl: modelsUrl,
    getHeaders: (apiKey) => ({
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    }),
    parseModels: (json) => {
      const { data } = json as {
        data: { id: string; display_name: string }[];
      };
      return data.map((m) => ({ id: m.id, name: m.display_name }));
    },
  },
};

async function fetchModels(
  provider: ProviderType,
  apiKey: string,
): Promise<ModelInfo[]> {
  const config = PROVIDER_CONFIGS[provider];
  const response = await fetch(config.getUrl(config.baseUrl, apiKey), {
    headers: config.getHeaders(apiKey),
  });
  if (!response.ok) {
    throw new Error(`${provider} API error: ${response.status}`);
  }
  return config.parseModels(await response.json());
}
