import { fileSystemRouter } from "keiro/web";

const port = Number(process.env.PORT ?? 5022);

const server = Bun.serve({
  port,
  fetch: fileSystemRouter(),
});

console.log(`Listening on http://${server.hostname}:${server.port}`);
