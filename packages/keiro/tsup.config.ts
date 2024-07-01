import { defineConfig } from "tsup";
import { globSync } from "glob";

const entryFiles = globSync("./src/**/*", {
  posix: true,
  ignore: ["**/**/*.test.ts"],
});

export default defineConfig({
  entry: [...entryFiles],
  outDir: "./dist",
  format: "esm",
  minify: true,
  clean: true,
  sourcemap: true,
  dts: true,
});
