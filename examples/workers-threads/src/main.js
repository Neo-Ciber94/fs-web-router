import { fileSystemRouter } from "keiro/node";
import http from "node:http";

const useWorkers = process.argv.some((s) => s === "--use-workers");
const portArg = (() => {
  const idx = process.argv.indexOf("--port");
  const arg = parseInt(process.argv[idx + 1]);
  return Number.isNaN(arg) ? null : arg;
})();

const port = Number(portArg || process.env.PORT || 6530);
const origin = `http://localhost:${port}`;

http.createServer(fileSystemRouter({ origin, workers: useWorkers })).listen(port, () => {
  if (useWorkers) {
    console.log("⚡ Using workers threads");
  }

  console.log(`Listening on ${origin}`);
});
