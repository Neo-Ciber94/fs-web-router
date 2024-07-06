/**
 * Temporary redirect status codes.
 */
export type TemporaryRedirectStatus = 302 | 303 | 307;

/**
 * Creates a temporary redirect response.
 * @param location The location to redirect to.
 * @param status The redirection status code.
 * @param init The response init.
 */
export function redirect(location: string, status: TemporaryRedirectStatus, init?: ResponseInit) {
  return _redirect(location, status, init);
}

/**
 * Permanent redirect status codes.
 */
export type PermanentRedirectStatus = 302 | 303 | 307;

/**
 *
 * Creates a permanent redirect response.
 * @param location The location to redirect to.
 * @param status The redirection status code.
 * @param init The response init.
 */
export function redirectPermanent(
  location: string,
  status: PermanentRedirectStatus,
  init?: ResponseInit,
) {
  return _redirect(location, status, init);
}

function _redirect(location: string, status: number, init?: ResponseInit) {
  return new Response(null, {
    ...init,
    status,
    headers: {
      ...init?.headers,
      location: location,
    },
  });
}
