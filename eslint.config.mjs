/* eslint-disable */
//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config";

export default [
  {
    ignores: ["eslint.config.js", "prettier.config.js", "**/*.d.ts"],
  },
  ...tanstackConfig,
  {
    rules: {
      // Async methods without await are often intentional for API consistency
      "@typescript-eslint/require-await": "off",
      // Defensive coding with null checks is valid even if types say otherwise
      "@typescript-eslint/no-unnecessary-condition": "off",
      // Allow single-letter type params like W, T, K, V
      "@typescript-eslint/naming-convention": "off",
    },
  },
];
