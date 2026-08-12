import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["draft-battler/src/**/*.ts", "workers/draft-battler-pvp/src/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    files: [
      "draft-battler/scripts/**/*.mjs",
      "draft-battler/tests/**/*.mjs",
      "workers/draft-battler-pvp/tests/**/*.mjs",
    ],
    languageOptions: {
      globals: {
        AbortSignal: "readonly",
        Buffer: "readonly",
        console: "readonly",
        fetch: "readonly",
        process: "readonly",
        Response: "readonly",
        URL: "readonly",
      },
    },
  },
  {
    files: ["docs/prototypes/gladiator-arena/src/**/*.ts"],
    languageOptions: {
      globals: {
        document: "readonly",
        window: "readonly",
      },
    },
    rules: {
      "no-undef": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
