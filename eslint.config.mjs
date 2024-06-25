import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.node } },
  {
    rules: {
      "@typescript-eslint/consistent-type-definitions": "error",
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
