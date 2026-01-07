import { spawn } from "node:child_process";
import log from "electron-log/main";
import { zodToJsonSchema } from "zod-to-json-schema";
import { findClaudePath } from "../../services/claude-code-cli-validation.service";
import type {
  AIProvider,
  AIProviderConfig,
  DeepPartial,
  GenerateParams,
  StreamParams,
} from "../provider.interface";

export class ClaudeCodeCLIProvider implements AIProvider {
  private readonly defaultModel: string;

  constructor(config: AIProviderConfig) {
    this.defaultModel = config.defaultModel ?? "sonnet";
  }

  async generateStructuredOutput<T>(params: GenerateParams<T>): Promise<T> {
    const result = await this.executeCLI(params, false);
    return result as T;
  }

  async streamStructuredOutput<T>(params: StreamParams<T>): Promise<T> {
    const result = await this.executeCLI(params, true, params.onPartial);
    return result as T;
  }

  private async executeCLI<T>(
    params: GenerateParams<T>,
    streaming: boolean,
    onPartial?: (partial: DeepPartial<T>) => void
  ): Promise<T> {
    const claudePath = findClaudePath();
    if (!claudePath) {
      throw new Error(
        "Claude CLI not found. Please install Claude Code or configure the path in settings."
      );
    }

    return new Promise((resolve, reject) => {
      // Convert Zod schema to JSON Schema for --json-schema flag
      const jsonSchema = zodToJsonSchema(params.schema, "schema");
      const jsonSchemaStr = JSON.stringify(jsonSchema);

      // Build prompt (system + user combined)
      const fullPrompt = `${params.systemPrompt}\n\n${params.userPrompt}`;

      log.info("[Claude CLI Provider] Spawning claude process...");
      log.info(`[Claude CLI Provider] Path: ${claudePath}`);
      log.info(`[Claude CLI Provider] Model: ${params.model ?? this.defaultModel}`);

      // Build args - use --json-schema for structured output
      const args = [
        "-p",
        "--output-format",
        streaming ? "stream-json" : "json",
        "--json-schema",
        jsonSchemaStr,
        "--model",
        params.model ?? this.defaultModel,
        "--no-session-persistence",
        "--tools",
        "", // Disable all tools
        "--", // Separator before positional arg
        fullPrompt,
      ];

      const claudeProcess = spawn(claudePath, args, {
        stdio: ["pipe", "pipe", "pipe"],
        cwd: "/", // Run outside project context
      });

      let stdout = "";
      let stderr = "";
      let lastPartialObject: DeepPartial<T> | null = null;

      claudeProcess.stdout.setEncoding("utf8");
      claudeProcess.stderr.setEncoding("utf8");

      claudeProcess.stdout.on("data", (data: string) => {
        stdout += data;

        if (streaming && onPartial) {
          // Parse stream-json lines for partial updates
          const lines = data.split("\n").filter((line) => line.trim());
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              // Look for partial structured output updates
              if (parsed.structured_output) {
                const partial = parsed.structured_output as DeepPartial<T>;
                if (JSON.stringify(partial) !== JSON.stringify(lastPartialObject)) {
                  lastPartialObject = partial;
                  onPartial(partial);
                }
              }
            } catch {
              // Ignore parsing errors for partial data
            }
          }
        }
      });

      claudeProcess.stderr.on("data", (data: string) => {
        stderr += data;
        // Only log actual errors, not verbose output
        if (data.includes("error") || data.includes("Error")) {
          log.warn("[Claude CLI Provider] stderr:", data);
        }
      });

      claudeProcess.on("close", (code) => {
        log.info("[Claude CLI Provider] Process closed with code:", code);

        if (code !== 0) {
          reject(
            new Error(
              `Claude CLI exited with code ${code}. stderr: ${stderr}`
            )
          );
          return;
        }

        try {
          let result: any;

          if (streaming) {
            // Parse stream-json: find the final result line
            const lines = stdout.split("\n").filter((line) => line.trim());
            const resultLine = lines.find((line) => {
              try {
                const parsed = JSON.parse(line);
                return parsed.type === "result";
              } catch {
                return false;
              }
            });

            if (!resultLine) {
              throw new Error("No result found in stream output");
            }
            result = JSON.parse(resultLine);
          } else {
            // Parse single JSON output
            result = JSON.parse(stdout);
          }

          // With --json-schema, the structured output is in structured_output field
          if (result.structured_output) {
            log.info("[Claude CLI Provider] Successfully parsed structured_output");
            resolve(result.structured_output as T);
          } else if (result.result) {
            // Fallback: try to parse result as JSON (shouldn't happen with --json-schema)
            log.warn("[Claude CLI Provider] No structured_output, falling back to result field");
            const parsed = typeof result.result === "string"
              ? JSON.parse(result.result)
              : result.result;
            resolve(parsed as T);
          } else {
            throw new Error("No structured_output or result in CLI output");
          }
        } catch (error) {
          log.error("[Claude CLI Provider] Failed to parse output:", error);
          log.error("[Claude CLI Provider] stdout:", stdout);
          reject(
            new Error(
              `Failed to parse CLI output: ${error instanceof Error ? error.message : String(error)}`
            )
          );
        }
      });

      claudeProcess.on("error", (error) => {
        log.error("[Claude CLI Provider] Process error:", error);
        reject(new Error(`Failed to spawn Claude CLI: ${error.message}`));
      });
    });
  }
}
