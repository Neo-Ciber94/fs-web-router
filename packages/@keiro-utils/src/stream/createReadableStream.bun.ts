/**
 * Creates stream from the given file path.
 * @param filepath The file path.
 */
export async function createReadableStream(filepath: string): Promise<ReadableStream<Uint8Array>> {
  return Bun.file(filepath).stream();
}
