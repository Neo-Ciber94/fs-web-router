import { defineConfig } from "eslint-define-config";
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import path from "node:path";
import url from "node:url";
import eslintPluginUnicorn from "eslint-plugin-unicorn";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  {
    languageOptions: {
      globals: globals.node,
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        tsconfigRootDir: __dirname,
        project: ["./tsconfig.root.json", "./packages/**/tsconfig.json"],
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "unicorn/prefer-node-protocol": "error",
    },
  },
  {
    plugins: {
      unicorn: eslintPluginUnicorn,
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
]);
