import { createServer } from "node:http";
import express from "express";
import { WebSocket, WebSocketServer } from "ws";
import log from "electron-log/main";
import {
  CHECKLIST_MATCHING,
  CHECKLIST_PARSING,
  JOBINFO_EXTRACTING,
  RESUME_PARSING,
  RESUME_TAILORING,
} from "@type/task-names";
import { createAIProvider } from "../ai/provider.factory";
import { parseResume } from "../ai/prompts/resume-parsing";
import { parseChecklist } from "../ai/prompts/checklist-parsing";
import { matchChecklist } from "../ai/prompts/checklist-matching";
import { tailorResume } from "../ai/prompts/resume-tailoring";
import { extractJobInfo } from "../ai/prompts/jobinfo-extracting";
import type { Server } from "node:http";
import type { NextFunction, Request, Response } from "express";
import type { AIProviderConfig } from "../ai/provider.interface";
import type { Checklist } from "@type/checklist";

type TaskType =
  | typeof RESUME_PARSING
  | typeof RESUME_TAILORING
  | typeof CHECKLIST_PARSING
  | typeof CHECKLIST_MATCHING
  | typeof JOBINFO_EXTRACTING;

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
              { streaming: true, onPartial },
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

  private async executeTask(
    taskType: TaskType,
    payload: Record<string, unknown>,
    providerConfig: AIProviderConfig,
    model: string,
    options?: { streaming?: boolean; onPartial?: (partial: unknown) => void },
  ): Promise<unknown> {
    const provider = createAIProvider(providerConfig);
    const { streaming = false, onPartial } = options || {};

    switch (taskType) {
      case RESUME_PARSING:
        return parseResume(
          provider,
          payload.rawResumeContent as string,
          payload.templateId as string,
          { streaming, onPartial, model },
        );

      case CHECKLIST_PARSING:
        return parseChecklist(provider, payload.jobDescription as string, {
          streaming,
          onPartial,
          model,
        });

      case CHECKLIST_MATCHING:
        return matchChecklist(
          provider,
          payload.checklist as Checklist,
          payload.resumeStructure as Record<string, unknown>,
          { streaming, onPartial, model },
        );

      case RESUME_TAILORING:
        return tailorResume(
          provider,
          payload.checklist as Checklist,
          payload.resumeStructure as Record<string, unknown>,
          payload.templateId as string,
          { streaming, onPartial, model },
        );

      case JOBINFO_EXTRACTING:
        return extractJobInfo(provider, payload.jobDescription as string, {
          streaming,
          onPartial,
          model,
        });

      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
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
