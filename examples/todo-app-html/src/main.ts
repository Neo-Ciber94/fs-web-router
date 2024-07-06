import http from "node:http";
import { fileSystemRouter } from "keiro/node";

const port = 5000;
const origin = `http://localhost:${port}`;

http
  .createServer(fileSystemRouter({ origin }))
  .listen(port, () => console.log(`Listening on ${origin}`));
