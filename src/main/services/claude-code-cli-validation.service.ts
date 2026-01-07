import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import log from "electron-log/main";

// Common installation paths for Claude CLI across different install methods
const COMMON_PATHS = [
  join(homedir(), ".local", "bin", "claude"), // curl installer (official)
  "/opt/homebrew/bin/claude", // brew on Apple Silicon
  "/usr/local/bin/claude", // brew on Intel / npm global
  join(homedir(), ".npm-global", "bin", "claude"), // npm custom global
  join(homedir(), ".bun", "bin", "claude"), // bun global
];

let cachedPath: string | null = null;
let userConfiguredPath: string | null = null;

/**
 * Set the user-configured path (called from main process)
 */
export function setUserConfiguredPath(path: string | null): void {
  userConfiguredPath = path;
  cachedPath = null; // Clear cache to force re-detection
}

/**
 * Find the claude binary path.
 * Priority: user-configured path > auto-detected common paths
 */
export function findClaudePath(): string | null {
  // Check user-configured path first
  if (userConfiguredPath && existsSync(userConfiguredPath)) {
    cachedPath = userConfiguredPath;
    return userConfiguredPath;
  }

  // Return cached path if still valid
  if (cachedPath && existsSync(cachedPath)) {
    return cachedPath;
  }

  // Auto-detect from common paths
  for (const path of COMMON_PATHS) {
    if (existsSync(path)) {
      cachedPath = path;
      log.info(`[Claude CLI] Found at: ${path}`);
      return path;
    }
  }

  cachedPath = null;
  return null;
}

/**
 * Clear the cached path (useful when user changes settings)
 */
export function clearClaudePathCache(): void {
  cachedPath = null;
}

/**
 * Check if Claude CLI is installed
 */
export function isClaudeCliInstalled(): boolean {
  return findClaudePath() !== null;
}

/**
 * Check if Claude CLI is authenticated.
 * We skip the actual API check (slow & costs money) and assume authenticated if installed.
 * Auth errors will be handled at runtime when actually using the AI.
 */
export async function isClaudeCliAuthenticated(): Promise<boolean> {
  // If CLI is installed, assume authenticated
  // User should run `claude` in terminal at least once to login
  return isClaudeCliInstalled();
}

/**
 * Get Claude CLI version
 */
export async function getClaudeCliVersion(): Promise<string | null> {
  const claudePath = findClaudePath();
  if (!claudePath) {
    return null;
  }

  return new Promise((resolve) => {
    const proc = spawn(claudePath, ["--version"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    const timeout = setTimeout(() => {
      proc.kill();
      resolve(null);
    }, 5000);

    proc.on("close", (code) => {
      clearTimeout(timeout);

      if (code === 0) {
        // Parse version from output like "2.0.76 (Claude Code)"
        const match = stdout.match(/(\d+\.\d+\.\d+)/);
        resolve(match ? match[1] : null);
      } else {
        resolve(null);
      }
    });

    proc.on("error", () => {
      clearTimeout(timeout);
      resolve(null);
    });
  });
}
