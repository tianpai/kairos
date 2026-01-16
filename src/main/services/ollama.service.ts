import type { ModelInfo } from "./ai-models.service";
import type { OllamaPullProgress } from "../../shared/ollama";

const OLLAMA_DEFAULT_BASE_URL = "http://localhost:11434";

// Curated models known to work well with structured output
export const OLLAMA_CURATED_MODELS: Array<ModelInfo> = [
  { id: "llama3.2:3b", name: "Llama 3.2 3B (Recommended)" },
  { id: "llama3.1:8b", name: "Llama 3.1 8B" },
  { id: "qwen2.5:7b", name: "Qwen 2.5 7B" },
  { id: "mistral:7b", name: "Mistral 7B" },
  { id: "gemma2:9b", name: "Gemma 2 9B" },
];

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

interface OllamaVersionResponse {
  version: string;
}

interface OllamaTagsResponse {
  models: Array<{
    name: string;
    size: number;
    digest: string;
    modified_at: string;
  }>;
}

let baseUrl = OLLAMA_DEFAULT_BASE_URL;

export function getOllamaBaseUrl(): string {
  return baseUrl;
}

export function setOllamaBaseUrl(url: string): void {
  baseUrl = url;
}

export async function isOllamaRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/api/version`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function getOllamaVersion(): Promise<string | null> {
  try {
    const response = await fetch(`${baseUrl}/api/version`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as OllamaVersionResponse;
    return data.version;
  } catch {
    return null;
  }
}

export async function listOllamaModels(): Promise<Array<OllamaModel>> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`);
    if (!response.ok) {
      console.error(`Ollama tags fetch failed: ${response.status}`);
      return [];
    }
    const data = (await response.json()) as OllamaTagsResponse;
    return data.models || [];
  } catch (error) {
    console.error("Failed to fetch Ollama models:", error);
    return [];
  }
}

export async function getInstalledCuratedModels(): Promise<Array<ModelInfo>> {
  const installed = await listOllamaModels();
  const result: Array<ModelInfo> = [];

  for (const curated of OLLAMA_CURATED_MODELS) {
    const baseName = curated.id.split(":")[0];

    // First check for exact match
    const exactMatch = installed.find((m) => m.name === curated.id);
    if (exactMatch) {
      result.push({ id: exactMatch.name, name: curated.name });
      continue;
    }

    // Otherwise find any installed model with same base name
    const baseMatch = installed.find((m) => m.name.startsWith(baseName + ":"));
    if (baseMatch) {
      // Use actual installed model name, but curated display name
      const tag = baseMatch.name.split(":")[1] || "latest";
      const displayName = curated.name.replace(/\s*\([^)]*\)\s*$/, ""); // Remove "(Recommended)" etc
      result.push({
        id: baseMatch.name,
        name: `${displayName} (${tag})`,
      });
    }
  }

  return result;
}

export function getOllamaCuratedModels(): Array<ModelInfo> {
  return OLLAMA_CURATED_MODELS;
}

// Active pull abort controller
let activePullController: AbortController | null = null;

export async function pullOllamaModel(
  modelName: string,
  onProgress: (progress: OllamaPullProgress) => void,
): Promise<void> {
  // Cancel any existing pull
  if (activePullController) {
    activePullController.abort();
  }

  activePullController = new AbortController();
  const signal = activePullController.signal;

  try {
    const response = await fetch(`${baseUrl}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: modelName, stream: true }),
      signal,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to pull model: ${response.status} ${response.statusText}`,
      );
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.trim()) {
          try {
            const progress = JSON.parse(line) as OllamaPullProgress;
            onProgress(progress);
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim()) {
      try {
        const progress = JSON.parse(buffer) as OllamaPullProgress;
        onProgress(progress);
      } catch {
        // Skip invalid JSON
      }
    }
  } finally {
    if (activePullController?.signal === signal) {
      activePullController = null;
    }
  }
}

export function cancelPullModel(): void {
  if (activePullController) {
    activePullController.abort();
    activePullController = null;
  }
}
