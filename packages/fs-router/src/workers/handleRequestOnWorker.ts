import { type Worker } from "worker_threads";
import { ResponseParts, RequestParts } from "../worker.mjs";
import { headersToObject, objectToHeaders } from "../utils.js";

export function handleRequestOnWorker(worker: Worker, request: Request) {
  const streamControllerDefer = deferred<ReadableStreamDefaultController<Uint8Array>>();

  return new Promise<Response>((resolve) => {
    const requestHeaders = headersToObject(request.headers);

    async function recieveResponseParts(responseParts: ResponseParts) {
      switch (responseParts.type) {
        case "response": {
          const responseHeaders = objectToHeaders(responseParts.headers);
          const bodyStream = new ReadableStream<Uint8Array>({
            start(controller) {
              streamControllerDefer.resolve(controller);
            },
          });

          resolve(
            new Response(bodyStream, {
              status: responseParts.status,
              statusText: responseParts.statusText,
              headers: responseHeaders,
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
      type: "request",
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

function deferred<T>() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let resolve = (value: T) => {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  let reject = (err?: any) => {};

  const promise = new Promise<T>((resolveFunction, rejectFunction) => {
    resolve = resolveFunction;
    reject = rejectFunction;
  });

  return { promise, resolve, reject };
}
