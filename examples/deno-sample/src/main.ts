import { fileSystemRouter } from "keiro/web";

Deno.serve({
  handler: fileSystemRouter(),
  onListen(addr) {
    console.log(`Listening on http://${addr.hostname}:${addr.port}`);
  },
});
