import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/**/*.ts"],
  outDir: "./dist",
  format: "esm",
  dts: true,
  clean: true,
  sourcemap: true,
  minify: true,
  splitting: true,
});
