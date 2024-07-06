import * as fs from "node:fs";

const encoder = new TextEncoder();

/**
 * Creates stream from the given file path.
 * @param filepath The file path.
 */
export function createReadableStream(filepath: string): ReadableStream<Uint8Array> {
  const nodeReadstream = fs.createReadStream(filepath);

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of nodeReadstream) {
          const data = typeof chunk === "string" ? encoder.encode(chunk) : (chunk as Uint8Array);
          controller.enqueue(data);
        }
      } catch (err) {
        controller.error(err);
      }

      controller.close();
    },
  });
}
