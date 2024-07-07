import http from "node:http";
import { fileSystemRouter } from "keiro/node";

const isDev = process.env.NODE_ENV !== "production";
const port = isDev ? 5000 : 7500;
const origin = `http://localhost:${port}`;
const routesDir = isDev ? "server/routes" : "build/server/routes";

http
  .createServer(fileSystemRouter({ origin, routesDir, prefix: "/api" }))
  .listen(port, () => console.log(`Listening on ${origin}`));
