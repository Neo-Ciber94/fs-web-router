import { createRouter } from "radix3";
import { parentPort, workerData } from "worker_threads";
import type { Route } from "./createFileSystemRouter.js";
import { createMiddleware, createRoute } from "./utils.js";
import url from "url";

export type RequestParts =
  | {
      type: "trailers";
      url: string;
      method: string;
      headers: Record<string, string | string[]>;
    }
  | {
      type: "body";
      data: Uint8Array;
    }
  | {
      type: "done";
    };

export type ResponseParts =
  | {
      type: "trailers";
      status: number;
      statusText: string;
      headers: Record<string, string | string[]>;
    }
  | {
      type: "body";
      data: Uint8Array;
    }
  | {
      type: "done";
    };

const { router, middleware } = await createWorkerRouter();

parentPort!.on("message", handleWorkerRequest);

async function handleWorkerRequest(requestParts: RequestParts) {
  const stream = new TransformStream<Uint8Array, Uint8Array>();

  switch (requestParts.type) {
    case "trailers": {
      const requestHeaders = new Headers();
      for (const [key, value] of Object.entries(requestParts.headers)) {
        if (Array.isArray(value)) {
          value.forEach((v) => requestHeaders.append(key, v));
        } else {
          requestHeaders.append(key, value);
        }
      }

      const hasBody = !["get", "head"].includes(requestParts.method.toLowerCase());
      const request = new Request(requestParts.url, {
        method: requestParts.method,
        body: hasBody ? stream.readable : null,
        headers: requestHeaders,

        // @ts-expect-error This is required because the request may have a body
        duplex: "half",
      });

      await handleWorkerResponse(request);
      break;
    }
    case "body": {
      await stream.writable.getWriter().write(requestParts.data);
      break;
    }
    case "done": {
      await stream.writable.close();
      break;
    }
  }
}

async function handleWorkerResponse(request: Request) {
  if (!parentPort) {
    throw new Error("Handler was not executed as a worker");
  }

  console.log(request);

  const url = new URL(request.url);
  const match = router.lookup(url.pathname);
  const { handler = onNotFound, params = {} } = match || {};

  async function handleRequest() {
    const requestEvent = { request, params, locals: {} };

    if (middleware) {
      return middleware(requestEvent, handler);
    } else {
      return handler(requestEvent);
    }
  }

  const response = await handleRequest();
  const responseHeaders: Record<string, string | string[]> = {};
  for (const [key, value] of response.headers) {
    const h = responseHeaders[key];
    if (Array.isArray(h)) {
      responseHeaders[key] = [...h, value];
    } else {
      responseHeaders[key] = [value];
    }
  }

  parentPort.postMessage({
    type: "trailers",
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  } satisfies ResponseParts);

  if (response.body) {
    const reader = response.body.getReader();
    while (true) {
      const { value: data, done } = await reader.read();
      if (done) {
        break;
      }
      parentPort.postMessage({ type: "body", data } satisfies ResponseParts);
    }
  }

  parentPort.postMessage({ type: "done" } satisfies ResponseParts);
}

export interface WorkerRouterData {
  routesFilePaths: Record<string, string>;
  middlewareFilePath?: string;
}

async function createWorkerRouter() {
  const { middlewareFilePath, routesFilePaths } = workerData as WorkerRouterData;
  const routes: Record<string, Route> = {};

  for (const [key, routeFilePath] of Object.entries(routesFilePaths)) {
    routes[key] = await createRoute(routeFilePath);
  }

  const router = createRouter<Route>({ routes });
  const middleware = middlewareFilePath
    ? await createMiddleware(url.pathToFileURL(middlewareFilePath).href)
    : undefined;

  return { router, middleware };
}

function onNotFound() {
  return new Response(null, { status: 404 });
}
