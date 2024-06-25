export type MaybePromise<T> = T | Promise<T>;

export type RequestEvent = {
  request: Request;
  params: Record<string, string | string[]>;
};

export type Handler = (event: RequestEvent) => MaybePromise<Response>;

export type Middleware = (event: RequestEvent, next: Handler) => MaybePromise<Response>;
