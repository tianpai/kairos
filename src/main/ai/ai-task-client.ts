import { randomUUID } from "node:crypto";
import log from "electron-log/main";
import { WebSocket } from "ws";
import { aiServerService } from "../services/ai-server.service";
import { getDefaultModel } from "../services/ai-models.service";
import type { ProviderType } from "../../shared/providers";
import type { TaskName } from "@type/task-contracts";
import type { SettingsService } from "../config/settings.service";

type PendingTask = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  onPartial?: (partial: unknown) => void;
  taskType: TaskName;
  startTime: number;
  timeoutId: ReturnType<typeof setTimeout>;
};

export interface ExecuteOptions {
  streaming?: boolean;
  onPartial?: (partial: unknown) => void;
}

interface WSResponse {
  id: string;
  type: "partial" | "completed" | "failed";
  partial?: unknown;
  result?: unknown;
  error?: string;
}

export class AITaskClient {
  private ws: WebSocket | null = null;
  private pendingTasks = new Map<string, PendingTask>();
  private connectionPromise: Promise<void> | null = null;
  private readonly timeoutMs = 120_000;

  constructor(private readonly settingsService: SettingsService) {}

  private getActiveProviderConfig(): {
    provider: ProviderType;
    model: string;
    apiKey: string;
  } {
    const provider = this.settingsService.getActiveProvider();

    let apiKey: string | null = null;
    switch (provider) {
      case "ollama":
        apiKey = "ollama";
        break;
      case "deepseek":
        apiKey = this.settingsService.getDeepSeekKey();
        break;
      case "xai":
        apiKey = this.settingsService.getXAIKey();
        break;
      case "gemini":
        apiKey = this.settingsService.getGeminiKey();
        break;
      case "anthropic":
        apiKey = this.settingsService.getAnthropicKey();
        break;
      case "openai":
      default:
        apiKey = this.settingsService.getOpenAIKey();
        break;
    }

    if (!apiKey) {
      throw new Error(`API key not configured for ${provider}`);
    }

    const selected = this.getSelectedModel(provider);
    const model = selected ?? getDefaultModel(provider);

    return { provider, model, apiKey };
  }

  private getSelectedModel(provider: ProviderType): string | null {
    switch (provider) {
      case "openai":
        return this.settingsService.getOpenAISelectedModel();
      case "deepseek":
        return this.settingsService.getDeepSeekSelectedModel();
      case "xai":
        return this.settingsService.getXAISelectedModel();
      case "gemini":
        return this.settingsService.getGeminiSelectedModel();
      case "ollama":
        return this.settingsService.getOllamaSelectedModel();
      case "anthropic":
        return this.settingsService.getAnthropicSelectedModel();
      default:
        return null;
    }
  }

  private async ensureConnection(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.connect();
    try {
      await this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  private async connect(): Promise<void> {
    const wsURL = aiServerService.getWebSocketURL();

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsURL);

      this.ws.on("open", () => {
        log.info("[AITaskClient] WebSocket connected");
        resolve();
      });

      this.ws.on("message", (data) => {
        this.handleMessage(JSON.parse(data.toString()) as WSResponse);
      });

      this.ws.on("error", (error) => {
        log.error("[AITaskClient] WebSocket error:", error);
        reject(new Error("WebSocket connection failed"));
      });

      this.ws.on("close", () => {
        log.info("[AITaskClient] WebSocket closed");
        this.ws = null;
        for (const [id, task] of this.pendingTasks) {
          task.reject(new Error("WebSocket connection closed"));
          this.clearPendingTask(id);
        }
      });
    });
  }

  private handleMessage(data: WSResponse): void {
    const task = this.pendingTasks.get(data.id);
    if (!task) return;

    switch (data.type) {
      case "partial":
        task.onPartial?.(data.partial);
        break;
      case "completed": {
        const duration = ((Date.now() - task.startTime) / 1000).toFixed(1);
        log.info(`AI task completed: ${task.taskType} (${duration}s)`);
        task.resolve(data.result);
        this.clearPendingTask(data.id);
        break;
      }
      case "failed":
        log.error(`AI task failed: ${task.taskType} - ${data.error}`);
        task.reject(new Error(data.error ?? "Unknown error"));
        this.clearPendingTask(data.id);
        break;
    }
  }

  async execute<T>(
    taskType: TaskName,
    payload: Record<string, unknown>,
    options?: ExecuteOptions,
  ): Promise<T> {
    const id = randomUUID();
    const { provider, model, apiKey } = this.getActiveProviderConfig();

    const streamingLabel = options?.streaming ? " (streaming)" : "";
    log.info(
      `AI task started: ${taskType}${streamingLabel} with ${provider}/${model}`,
    );

    if (options?.streaming) {
      return this.executeViaWebSocket(
        id,
        taskType,
        payload,
        provider,
        model,
        apiKey,
        options,
      );
    }

    return this.executeViaHttp(id, taskType, payload, provider, model, apiKey);
  }

  private async executeViaWebSocket<T>(
    id: string,
    taskType: TaskName,
    payload: Record<string, unknown>,
    provider: ProviderType,
    model: string,
    apiKey: string,
    options: ExecuteOptions,
  ): Promise<T> {
    await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const timeoutId = this.startTimeout(id);
      this.pendingTasks.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        onPartial: options.onPartial,
        taskType,
        startTime: Date.now(),
        timeoutId,
      });

      const message = {
        id,
        taskType,
        payload,
        provider,
        model,
        apiKey,
      };

      this.ws!.send(JSON.stringify(message));
    });
  }

  private async executeViaHttp<T>(
    id: string,
    taskType: TaskName,
    payload: Record<string, unknown>,
    provider: ProviderType,
    model: string,
    apiKey: string,
  ): Promise<T> {
    const baseURL = aiServerService.getBaseURL();
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${baseURL}/api/ai/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          taskType,
          payload,
          provider,
          model,
          apiKey,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      log.info(`AI task completed: ${taskType} (${duration}s)`);

      return data.result as T;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        log.error(`AI task timed out: ${taskType}`);
        throw new Error(`AI task timed out after ${this.timeoutMs / 1000}s`);
      }
      log.error(`AI task failed: ${taskType} - ${error}`);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  terminate(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    for (const [id] of this.pendingTasks) {
      this.clearPendingTask(id);
    }
  }

  private startTimeout(id: string): ReturnType<typeof setTimeout> {
    return setTimeout(() => {
      const task = this.pendingTasks.get(id);
      if (!task) return;
      log.error(`AI task timed out: ${task.taskType}`);
      task.reject(
        new Error(`AI task timed out after ${this.timeoutMs / 1000}s`),
      );
      this.clearPendingTask(id);
    }, this.timeoutMs);
  }

  private clearPendingTask(id: string): void {
    const task = this.pendingTasks.get(id);
    if (task) {
      clearTimeout(task.timeoutId);
    }
    this.pendingTasks.delete(id);
  }
}
