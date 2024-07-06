/**
 * Creates a 'text/html' response.
 * @param content The contents of the html.
 * @param init The response init.
 */
export function html(content: string, init?: ResponseInit) {
  return new Response(content, {
    ...init,
    headers: {
      ...init?.headers,
      "content-type": "text/html",
    },
  });
}