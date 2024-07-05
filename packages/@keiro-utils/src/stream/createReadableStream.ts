import * as fs from "node:fs";

const encoder = new TextEncoder();

/**
 * Creates stream from the given file path.
 * @param filepath The file path.
 */
export async function createReadableStream(filepath: string): Promise<ReadableStream<Uint8Array>> {
  const nodeReadstream = fs.createReadStream(filepath);
  let streamController: ReadableStreamDefaultController<Uint8Array> | undefined = undefined;

  return new ReadableStream({
    start(controller) {
      streamController = controller;
      nodeReadstream.on("data", (buffer) => {
        const data = typeof buffer === "string" ? encoder.encode(buffer) : (buffer as Uint8Array);
        controller.enqueue(data);
      });

      nodeReadstream.on("error", (err) => {
        controller.error(err);
      });

      nodeReadstream.on("close", () => {
        controller.close();
      });
    },
    cancel() {
      if (streamController) {
        streamController.close();
      }
    },
  });
}
