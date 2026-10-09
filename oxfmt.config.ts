import { defineConfig } from "oxfmt";

export default defineConfig({
  ignorePatterns: ["aube-lock.yaml"],
  sortImports: true,
  jsdoc: true,
});
