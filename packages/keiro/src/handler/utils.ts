import type { WorkerOptions } from "node:worker_threads";
import { Cookies } from "../cookies";
import { WorkerPoolType, type WorkersRoutingOptions } from "../fileSystemRouter";
import type { RequestHandler, Locals, MaybePromise, Next, Params } from "../types";
import { type RequestEvent } from "../types";
import { DynamicWorkerPool, FixedWorkerPool, type WorkerPool } from "../workers/workerPool";

interface CreateRequestEventArgs {
  request: Request;
  params: Params;
  getLocals?: (event: RequestEvent) => MaybePromise<Locals>;
}

export function createRequestEvent({
  request,
  params,
  getLocals,
}: CreateRequestEventArgs): MaybePromise<RequestEvent> {
  const url = new URL(request.url);
  const cookies = Cookies.fromHeaders(request.headers);

  if (getLocals) {
    return Promise.resolve().then(async () => {
      const locals = await getLocals({ request, params, url, cookies, locals: {} });
      return { request, params, url, cookies, locals };
    });
  }

  return { request, params, url, cookies, locals: {} };
}

export function handleNotFound() {
  return new Response(null, { status: 404 });
}

export function chain(...handlers: RequestHandler[]): Next {
  return (event) => {
    function handle(index: number): MaybePromise<Response> {
      const h = handlers[index];
      if (h) {
        return h(event, () => handle(index + 1));
      } else {
        return handleNotFound();
      }
    }

    return handle(0);
  };
}

export type WorkerPoolFactory = (
  workerCount: number,
  filename: string,
  options?: WorkerOptions,
) => WorkerPool;

export function getWorkerPoolFactory(
  pool: NonNullable<WorkersRoutingOptions["pool"]>,
): WorkerPoolFactory {
  if (typeof pool === "function") {
    return pool;
  }

  switch (pool) {
    case WorkerPoolType.Fixed:
      return (...args) => new FixedWorkerPool(...args);
    case WorkerPoolType.Dynamic:
      return (...args) => new DynamicWorkerPool(...args);
    default:
      throw new Error("unreachable");
  }
}
