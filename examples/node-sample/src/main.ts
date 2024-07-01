import { fileSystemRouter } from "keiro/node";
import http from "node:http";

const port = 5000;
const origin = `http://localhost:${port}`;

const server = http.createServer(fileSystemRouter({ origin }));
server.listen(port, () => console.log(`Listening on ${origin}`));
