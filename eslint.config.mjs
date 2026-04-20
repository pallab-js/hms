import { defineConfig, globalIgnores } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";
import ReactHooksPlugin from "eslint-plugin-react-hooks";

export default defineConfig([
  globalIgnores(["**/node_modules/**", "**/.next/**", "**/src-tauri/target/**"]),
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
      "react-hooks": ReactHooksPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...ReactHooksPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
]);