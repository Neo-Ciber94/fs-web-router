import { type Worker } from "worker_threads";
import { ResponseParts, RequestParts } from "../worker.mjs";

function deferred<T>() {
  let resolve = (value: T) => {};
  let reject = (err?: any) => {};

  const promise = new Promise<T>((resolveFunction, rejectFunction) => {
    resolve = resolveFunction;
    reject = rejectFunction;
  });

  return { promise, resolve, reject };
}

export function handleWorkerRequest(worker: Worker, request: Request) {
  // let streamController: ReadableStreamDefaultController<Uint8Array> | undefined = undefined;
  const streamControllerDefer = deferred<ReadableStreamDefaultController<Uint8Array>>();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return new Promise<Response>((resolve, _reject) => {
    const requestHeaders: Record<string, string | string[]> = {};

    for (const [key, value] of request.headers) {
      const h = requestHeaders[key];
      if (Array.isArray(h)) {
        requestHeaders[key] = [...h, value];
      } else {
        requestHeaders[key] = [value];
      }
    }

    async function recieveResponseParts(responseParts: ResponseParts) {
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

          const bodyStream = new ReadableStream<Uint8Array>({
            start(controller) {
              streamControllerDefer.resolve(controller);
            },
          });

          resolve(
            new Response(bodyStream, {
              status: responseParts.status,
              statusText: responseParts.statusText,
              headers,
            })
          );
          break;
        }
        case "body": {
          const streamController = await streamControllerDefer.promise;
          streamController.enqueue(responseParts.data);
          break;
        }
        case "done": {
          const streamController = await streamControllerDefer.promise;
          streamController.close();
          worker.off("message", recieveResponseParts);
          break;
        }
      }
    }

    // Wait until request is ready
    worker.on("message", recieveResponseParts);

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
