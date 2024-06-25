import type { Handler } from "../types";

export function defineWorkerHandler(f: Handler) {
  const self = globalThis as unknown as Worker;

  const stream = new TransformStream<Uint8Array, Uint8Array>();
  let request: Request | undefined = undefined;

  self.onmessage = async (msg) => {
    const parts = msg.data as RequestEventParts;

    switch (parts.type) {
      case "trailers": {
        if (request) {
          throw new Error("Request was already created");
        }

        const requestHeaders = new Headers();
        for (const [key, value] of Object.entries(parts.headers)) {
          if (Array.isArray(value)) {
            value.forEach((v) => requestHeaders.append(key, v));
          } else {
            requestHeaders.append(key, value);
          }
        }

        request = new Request(parts.url, {
          method: parts.method,
          body: stream.readable,
          headers: requestHeaders,

          // @ts-expect-error This is required because the request may have a body
          duplex: "half",
        });

        const response = await f({ request, params: parts.params, locals: {} });
        const responseHeaders: Record<string, string | string[]> = {};

        for (const [key, value] of response.headers) {
          const h = responseHeaders[key];
          if (Array.isArray(h)) {
            responseHeaders[key] = [...h, value];
          } else {
            responseHeaders[key] = [value];
          }
        }

        self.postMessage({
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

            self.postMessage({ type: "body", data } satisfies ResponseParts);
          }
        }

        self.postMessage({ type: "done" } satisfies ResponseParts);
        break;
      }
      case "body": {
        stream.writable.getWriter().write(parts.data);
        break;
      }
      case "done": {
        stream.writable.close();
        break;
      }
    }
  };
}

type RequestEventParts =
  | {
      type: "trailers";
      url: string;
      method: string;
      headers: Record<string, string | string[]>;
      params: Record<string, string | string[]>;
    }
  | {
      type: "body";
      data: Uint8Array;
    }
  | {
      type: "done";
    };

type ResponseParts =
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
