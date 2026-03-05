/* eslint-disable */
//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["eslint.config.js", "prettier.config.js", "**/*.d.ts"],
  },
  ...tanstackConfig,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      // Prefer `T[]` over `Array<T>`
      "@typescript-eslint/array-type": [
        "error",
        { default: "array", readonly: "array" },
      ],
      // Async methods without await are often intentional for API consistency
      "@typescript-eslint/require-await": "off",
      // Defensive coding with null checks is valid even if types say otherwise
      "@typescript-eslint/no-unnecessary-condition": "off",
      // Allow single-letter type params like W, T, K, V
      "@typescript-eslint/naming-convention": "off",
    },
  },
  {
    files: ["src/main/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "src/main/ai",
                "src/main/ai/*",
                "src/main/ai/**",
                "src/main/db",
                "src/main/db/*",
                "src/main/db/**",
                "src/main/ipc",
                "src/main/ipc/*",
                "src/main/ipc/**",
                "src/main/services",
                "src/main/services/*",
                "src/main/services/**",
                "src/main/workflow",
                "src/main/workflow/*",
                "src/main/workflow/**",
                "src/main/menu",
                "src/main/menu.ts",
                "src/main/index",
                "src/main/index.ts",
                "src/main/config/settings.service",
                "src/main/config/settings.service.ts",
              ],
              message:
                "Legacy main paths are removed. Use `src/main/modules/*` or supported root paths (`schemas`, `utils`).",
            },
            {
              regex:
                "^src/main/(?:ai|db|ipc|services|workflow)(?:/|$)|^src/main/(?:menu|index)(?:\\.ts)?$|^src/main/config/settings\\.service(?:\\.ts)?$",
              message:
                "Legacy main paths are removed. Import from module barrels under `src/main/modules/*`.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/main/modules/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex:
                "^(?:\\.\\./){3,}(?:ai|db|ipc|services|workflow)(?:/|$)",
              message:
                "Legacy main paths are removed. Import from module barrels under `src/main/modules/*`.",
            },
            {
              regex:
                "^(?:\\.\\./)+(?:runtime|workspace|workflow|ai|user|system|persistence)/.+/.+",
              message:
                "Cross-module imports must use a module barrel (`../<module>`) or a one-level sub-barrel (`../<module>/<public-subpath>`).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/preload/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(?:\\./|\\.\\./)api(?:/|$)|^src/preload/api(?:/|$)",
              message:
                "Legacy preload `api/*` paths are removed. Import from `src/preload/modules/<module>` barrels.",
            },
          ],
        },
      ],
    },
  },
];
