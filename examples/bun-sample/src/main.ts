import { fileSystemRouter } from "keiro/web";

const server = Bun.serve({
  fetch: fileSystemRouter(),
});

console.log(`Listening on http://${server.hostname}:${server.port}`);
