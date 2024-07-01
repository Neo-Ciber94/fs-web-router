import { fileSystemRouter } from "../../../packages/keiro/src/handler/web.ts";

Deno.serve({
  handler: fileSystemRouter(),
  onListen(addr) {
    console.log(`Listening on http://${addr.hostname}:${addr.port}`);
  },
});
