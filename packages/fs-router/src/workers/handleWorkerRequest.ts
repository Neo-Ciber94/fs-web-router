import { type Worker } from "worker_threads";
import { ResponseParts, RequestParts } from "../worker.mjs";

export function handleWorkerRequest(worker: Worker, request: Request) {
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
    worker.on("message", async (responseParts: ResponseParts) => {
      console.log(responseParts);

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
          await bodyStream.writable.getWriter().write(responseParts.data);
          break;
        }
        case "done": {
          await bodyStream.writable.close();

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
