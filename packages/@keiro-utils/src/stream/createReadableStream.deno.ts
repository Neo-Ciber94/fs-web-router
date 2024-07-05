/* eslint-disable no-var */
import type { Deno as _Deno } from "@deno/shim-deno";

declare var Deno: typeof _Deno;

/**
 * Creates stream from the given file path.
 * @param filepath The file path.
 */
export async function createReadableStream(filepath: string): Promise<ReadableStream<Uint8Array>> {
  const file = await Deno.open(filepath);
  return file.readable as unknown as ReadableStream<Uint8Array>;
}
