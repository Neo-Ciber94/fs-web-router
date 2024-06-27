import { Locals, MaybePromise, Params, type RequestEvent } from "../types.js";

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

  if (getLocals) {
    return Promise.resolve().then(async () => {
      const locals = await getLocals({ request, params, url, locals: {} });
      return { request, params, url, locals };
    });
  }

  return { request, params, url, locals: {} };
}
