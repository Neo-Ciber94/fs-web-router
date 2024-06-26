import { createRouter } from "radix3";
import { parentPort, workerData, threadId } from "node:worker_threads";
import type { Route } from "../utils";
import {
  importMiddleware,
  importRoute,
  getRouteHandler,
  headersToObject,
  objectToHeaders,
  importHandler,
} from "../utils";
import url from "node:url";
import { chain, createRequestEvent, handleNotFound } from "./utils";
import { applyResponseCookies } from "../cookies";

export type RequestParts =
  | {
      type: "request";
      url: string;
      method: string;
      headers: Record<string, string[]>;
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
      type: "response";
      status: number;
      statusText: string;
      headers: Record<string, string[]>;
      body?: string;
    }
  | {
      type: "chunk";
      data: Uint8Array;
      done: false;
    }
  | {
      type: "chunk";
      data?: undefined;
      done: true;
    };

const { router, middleware, handle404 } = await createWorkerRouter();

parentPort!.on("message", handleWorkerRequest);

const SAFE_HTTP_METHODS = ["get", "head"];

async function handleWorkerRequest(requestParts: RequestParts) {
  const stream = new TransformStream<Uint8Array, Uint8Array>();

  switch (requestParts.type) {
    case "request": {
      const requestHeaders = objectToHeaders(requestParts.headers);
      const hasBody = !SAFE_HTTP_METHODS.includes(requestParts.method.toLowerCase());
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

  const url = new URL(request.url);
  const match = router.lookup(url.pathname);
  const { params = {}, ...route } = match || {};
  const handler = getRouteHandler(request, route) || handleNotFound;
  const nextHandler = chain(handler, handle404);

  const response = await (async () => {
    const requestEvent = await createRequestEvent({ request, params });
    let response: Response;

    if (middleware) {
      response = await middleware(requestEvent, nextHandler);
    } else {
      response = await handler(requestEvent, nextHandler);
    }

    applyResponseCookies(response, requestEvent.cookies);
    return response;
  })();

  const responseHeaders = headersToObject(response.headers);

  if (process.env.NODE_ENV !== "production") {
    responseHeaders["X-Worker-Id"] = [threadId.toString()];
  }

  if (isPlainText(response.headers)) {
    const body = await response.text();

    // Send response and body
    parentPort.postMessage({
      type: "response",
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body,
    } satisfies ResponseParts);
  } else {
    // Send response headers
    parentPort.postMessage({
      type: "response",
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    } satisfies ResponseParts);

    // Send response chunks
    if (response.body) {
      const reader = response.body.getReader();

      while (true) {
        const { value: data, done } = await reader.read();
        if (done) {
          break;
        }

        parentPort.postMessage({ type: "chunk", data, done: false } satisfies ResponseParts);
      }
    }

    parentPort.postMessage({ type: "chunk", done: true } satisfies ResponseParts);
  }
}

function isPlainText(headers: Headers) {
  const contentType = headers.get("content-type");
  return contentType != null && contentType.startsWith("text/");
}

export interface WorkerRouterData {
  routesFilePaths: Record<string, string>;
  middlewareFilePath?: string;
  notFoundFilePath?: string;
}

async function createWorkerRouter() {
  const { middlewareFilePath, notFoundFilePath, routesFilePaths } = workerData as WorkerRouterData;
  const routes: Record<string, Route> = {};

  for (const [key, routeFilePath] of Object.entries(routesFilePaths)) {
    routes[key] = await importRoute(routeFilePath);
  }

  const router = createRouter<Route>({ routes });
  const middleware = middlewareFilePath
    ? await importMiddleware(url.pathToFileURL(middlewareFilePath).href)
    : undefined;

  const handle404 = notFoundFilePath
    ? await importHandler(url.pathToFileURL(notFoundFilePath).href)
    : handleNotFound;

  return { router, middleware, handle404 };
}
