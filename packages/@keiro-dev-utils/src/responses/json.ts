/**
 * Creates a 'application/json' response.
 * @param value The value to convert to JSON.
 * @param init The response init.
 */
export function json(value: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(value), {
    ...init,
    headers: {
      ...init?.headers,
      "content-type": "application/json",
    },
  });
}
