import { defineConfig } from "tsup";
import { globSync } from "glob";
import path from "node:path";
import fs from "node:fs/promises";

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

  // TODO: Investigate how to ouput .mts as .mjs
  async onSuccess() {
    const handlerDir = path.join(process.cwd(), "dist", "handler");

    const files = {
      js: {
        from: path.join(handlerDir, "worker.js"),
        to: path.join(handlerDir, "worker.mjs"),
      },
      map: {
        from: path.join(handlerDir, "worker.js.map"),
        to: path.join(handlerDir, "worker.mjs.map"),
      },
    };

    await Promise.all([
      fs.rename(files.js.from, files.js.to),
      fs.rename(files.map.from, files.map.to),
    ]);
  },
});
