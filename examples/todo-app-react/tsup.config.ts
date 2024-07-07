import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./server/**/*.ts"],
  outDir: "./build/server",
  clean: true,
  format: "esm",
  minify: true,
  splitting: true,
  skipNodeModulesBundle: true,
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});
