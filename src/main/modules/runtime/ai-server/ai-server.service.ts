import { createServer } from "node:http";
import express from "express";
import { WebSocket, WebSocketServer } from "ws";
import log from "electron-log/main";
import { createAIProvider, prompt } from "../../ai";
import type { AIProvider, AIProviderConfig } from "../../ai";
import type { ZodType } from "zod";
import type { TaskName } from "@type/workflow";
import type { Server } from "node:http";
import type { NextFunction, Request, Response } from "express";
import type { Checklist } from "@type/checklist";

// TODO: reduce this type alias
type TaskType = TaskName;

interface ExecuteRequest {
  id: string;
  taskType: TaskType;
  payload: Record<string, unknown>;
  provider: AIProviderConfig["type"];
  apiKey: string;
  model: string;
  streaming?: boolean;
}

interface WSMessage {
  id: string;
  taskType: TaskType;
  payload: Record<string, unknown>;
  provider: AIProviderConfig["type"];
  apiKey: string;
  model: string;
}

class AIServerService {
  private app = express();
  private server: Server;
  private wss: WebSocketServer;
  private port = 0;

  constructor() {
    // CORS middleware - allow requests from renderer (dev and prod)
    this.app.use((_req: Request, res: Response, next: NextFunction) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type");

      // Handle preflight requests
      if (_req.method === "OPTIONS") {
        res.sendStatus(204);
        return;
      }
      next();
    });

    this.app.use(express.json({ limit: "10mb" }));
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server, path: "/ws/ai" });
    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupRoutes(): void {
    // Health check
    this.app.get("/api/ai/health", (_req, res) => {
      res.json({ status: "ok", port: this.port });
    });

    // Non-streaming AI execution
    this.app.post("/api/ai/execute", async (req, res) => {
      const { id, taskType, payload, provider, apiKey, model } =
        req.body as ExecuteRequest;

      try {
        const keyPreview = apiKey ? `${apiKey.substring(0, 10)}...` : "MISSING";
        log.info(
          `[AIServer] HTTP task started: ${taskType} with ${provider}/${model} (key: ${keyPreview})`,
        );
        const startTime = Date.now();

        const result = await this.executeTask(
          taskType,
          payload,
          { type: provider, apiKey },
          model,
        );

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        log.info(`[AIServer] HTTP task completed: ${taskType} (${duration}s)`);

        res.json({ id, result });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log.error(`[AIServer] HTTP task failed: ${taskType} - ${message}`);
        res.status(500).json({ id, error: message });
      }
    });
  }

  private setupWebSocket(): void {
    this.wss.on("connection", (ws) => {
      log.info("[AIServer] WebSocket client connected");

      ws.on("message", async (data) => {
        try {
          const message = JSON.parse(data.toString()) as WSMessage;
          const { id, taskType, payload, provider, apiKey, model } = message;

          log.info(
            `[AIServer] WS task started: ${taskType} with ${provider}/${model}`,
          );
          const startTime = Date.now();

          const onPartial = (partial: unknown): void => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ id, type: "partial", partial }));
            }
          };

          try {
            const result = await this.executeTask(
              taskType,
              payload,
              { type: provider, apiKey },
              model,
              { onPartial },
            );

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            log.info(
              `[AIServer] WS task completed: ${taskType} (${duration}s)`,
            );

            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ id, type: "completed", result }));
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            log.error(
              `[AIServer] WS task failed: ${taskType} - ${errorMessage}`,
            );

            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({ id, type: "failed", error: errorMessage }),
              );
            }
          }
        } catch (parseError) {
          log.error(
            "[AIServer] Failed to parse WebSocket message:",
            parseError,
          );
        }
      });

      ws.on("close", () => {
        log.info("[AIServer] WebSocket client disconnected");
      });

      ws.on("error", (error) => {
        log.error("[AIServer] WebSocket error:", error);
      });
    });
  }

  private buildPrompt(
    taskType: TaskType,
    payload: Record<string, unknown>,
  ): { systemPrompt: string; userPrompt: string; schema: ZodType } {
    switch (taskType) {
      case "resume.parsing":
        return prompt.resumeParsing(
          payload.rawResumeContent as string,
          payload.templateId as string,
        );

      case "checklist.parsing":
        return prompt.checklistParsing(payload.jobDescription as string);

      case "checklist.matching":
        return prompt.checklistMatching(
          payload.checklist as Checklist,
          payload.resumeStructure as Record<string, unknown>,
        );

      case "resume.tailoring":
        return prompt.resumeTailoring(
          payload.checklist as Checklist,
          payload.resumeStructure as Record<string, unknown>,
          payload.templateId as string,
        );

      case "jobinfo.extracting":
        return prompt.jobInfoExtracting(payload.jobDescription as string);

      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  }

  private async executeTask(
    taskType: TaskType,
    payload: Record<string, unknown>,
    providerConfig: AIProviderConfig,
    model: string,
    options?: { onPartial?: (partial: unknown) => void },
  ): Promise<unknown> {
    const provider: AIProvider = createAIProvider(providerConfig);
    const p = this.buildPrompt(taskType, payload);

    return provider.generateStructuredOutput({
      ...p,
      model,
      onPartial: options?.onPartial,
    });
  }

  async start(): Promise<number> {
    log.info("[AIServer] Starting Express server...");
    return new Promise((resolve, reject) => {
      this.server.listen(0, "127.0.0.1", () => {
        const address = this.server.address();
        if (address && typeof address === "object") {
          this.port = address.port;
          log.info(
            `[AIServer] Express server started on http://127.0.0.1:${this.port}`,
          );
          log.info(
            `[AIServer] WebSocket available at ws://127.0.0.1:${this.port}/ws/ai`,
          );
          resolve(this.port);
        } else {
          reject(new Error("Failed to get server address"));
        }
      });

      this.server.on("error", (error) => {
        log.error("[AIServer] Server error:", error);
        reject(error);
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Close WebSocket connections
      this.wss.clients.forEach((client) => {
        client.close();
      });

      this.server.close((error) => {
        if (error) {
          log.error("[AIServer] Error stopping server:", error);
          reject(error);
        } else {
          log.info("[AIServer] Server stopped");
          resolve();
        }
      });
    });
  }

  getPort(): number {
    return this.port;
  }

  getBaseURL(): string {
    return `http://127.0.0.1:${this.port}`;
  }

  getWebSocketURL(): string {
    return `ws://127.0.0.1:${this.port}/ws/ai`;
  }
}

// Export singleton instance
export const aiServerService = new AIServerService();
