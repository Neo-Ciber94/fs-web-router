import { fileSystemRouter } from "../../../packages/keiro/src/handler/web.ts";
import nodeProcess from "node:process";

// eslint-disable-next-line no-var, @typescript-eslint/no-explicit-any
declare var process: any;

if (typeof process === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).process = nodeProcess;
}

Deno.serve({
  handler: fileSystemRouter(),
  onListen(addr) {
    console.log(`Listening on http://${addr.hostname}:${addr.port}`);
  },
});
