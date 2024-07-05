import { fileSystemRouter } from "./deps/keiro.ts";

Deno.serve({
  handler: fileSystemRouter(),
  onListen(addr) {
    console.log(`Listening on http://${addr.hostname}:${addr.port}`);
  },
});
