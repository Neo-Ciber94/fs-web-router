import { getRouterMap } from "../createFileSystemRouter";
import { type FileSystemRouterOptions, initializeFileSystemRouter } from "../fileSystemRouter";
import { nextJsPatternMatching } from "../matchingPattern";
import { RequestParts, ResponseParts, WorkerRouterData } from "../worker";
import { WorkerPool } from "../workers/workerPool";
import { posix as path } from "path";
import { Worker } from "worker_threads";

export default function fileSystemRouter(options?: FileSystemRouterOptions) {
  const fsRouter = initializeFileSystemRouter(options);

  if (fsRouter.type === "worker") {
    const {
      cwd = process.cwd(),
      ignorePrefix = "_",
      routesDir = "src/routes",
      ignoreFiles = [],
      matchingPattern = nextJsPatternMatching(),
    } = options || {};

    const routesDirPath = path.join(cwd, routesDir);
    const routesFilePaths = getRouterMap({
      cwd,
      ignorePrefix,
      matchingPattern,
      routesDirPath,
      ignoreFiles,
    });

    const middlewareFilePath = fsRouter.middlewareFilePath;
    const pool = new WorkerPool(fsRouter.workerCount, "../worker.js", {
      workerData: {
        routesFilePaths,
        middlewareFilePath,
      } as WorkerRouterData,
    });

    return async (request: Request) => {
      const worker = await pool.get();

      try {
        const response: Response = await handleWorkerRequest(worker, request);
        return response;
      } finally {
        pool.return(worker);
      }
    };
  }

  const { onNotFound, initializeLocals, routerPromise, middlewarePromise } = fsRouter;

  return async (request: Request) => {
    const router = await routerPromise;
    const middleware = await middlewarePromise;

    const url = new URL(request.url);
    const match = router.lookup(url.pathname);

    const { handler = onNotFound, params = {} } = match || {};
    const preEvent = { request, params, locals: {} };
    const locals = await Promise.resolve(initializeLocals(preEvent));
    const requestEvent = { ...preEvent, locals };

    if (middleware) {
      return middleware(requestEvent, handler);
    } else {
      return handler(requestEvent);
    }
  };
}

function handleWorkerRequest(worker: Worker, request: Request) {
  const bodyStream = new TransformStream<Uint8Array, Uint8Array>();
  let response: Response | undefined = undefined;

  return new Promise<Response>((resolve, reject) => {
    const requestHeaders: Record<string, string | string[]> = {};

    for (const [key, value] of request.headers) {
      const h = requestHeaders[key];
      if (Array.isArray(h)) {
        requestHeaders[key] = [...h, value];
      } else {
        requestHeaders[key] = [value];
      }
    }

    // Wait until request is ready
    worker.on("message", (responseParts: ResponseParts) => {
      switch (responseParts.type) {
        case "trailers": {
          const headers = new Headers();
          for (const [key, value] of Object.entries(responseParts.headers)) {
            if (Array.isArray(value)) {
              value.forEach((v) => headers.append(key, v));
            } else {
              headers.append(key, value);
            }
          }

          response = new Response(bodyStream.readable, {
            status: responseParts.status,
            statusText: responseParts.statusText,
            headers,
          });
          break;
        }
        case "body": {
          bodyStream.writable.getWriter().write(responseParts.data);
          break;
        }
        case "done": {
          if (!response) {
            return reject("Response was not ready");
          } else {
            resolve(response);
          }
          break;
        }
      }
    });

    // Send request parts
    worker.postMessage({
      type: "trailers",
      url: request.url,
      method: request.method,
      headers: requestHeaders,
    } as RequestParts);

    const body = request.body;

    if (body) {
      const reader = body.getReader();

      function drain() {
        reader.read().then(({ value, done }) => {
          if (done) {
            return;
          }

          worker.postMessage({
            type: "body",
            data: value,
          } as RequestParts);

          return drain();
        });
      }

      void drain();
    }

    worker.postMessage({
      type: "done",
    } as RequestParts);
  });
}
