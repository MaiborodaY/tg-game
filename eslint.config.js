import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
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
