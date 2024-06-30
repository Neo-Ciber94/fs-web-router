import { Cookies } from "../cookies";
import type { Locals, MaybePromise, Params } from "../types";
import { type RequestEvent } from "../types";

interface CreateRequestEventArgs {
  request: Request;
  params: Params;
  getLocals?: (event: RequestEvent) => MaybePromise<Locals>;
}

export function createRequestEvent({
  request,
  params,
  getLocals,
}: CreateRequestEventArgs): MaybePromise<RequestEvent> {
  const url = new URL(request.url);
  const cookies = Cookies.fromHeaders(request.headers);

  if (getLocals) {
    return Promise.resolve().then(async () => {
      const locals = await getLocals({ request, params, url, cookies, locals: {} });
      return { request, params, url, cookies, locals };
    });
  }

  return { request, params, url, cookies, locals: {} };
}

export function handleNotFound() {
  return new Response(null, { status: 404 });
}
