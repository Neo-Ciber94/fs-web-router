export type MaybePromise<T> = T | Promise<T>;

/**
 * Module to extends the types.
 */
export interface Register {}

/**
 * Request locals.
 */
export type Locals = Register extends {
  Locals: infer _Locals;
}
  ? _Locals
  : Record<string, unknown>;

/**
 * Request params.
 */
export type Params = Partial<Record<string, string>>;

/**
 * The incoming request event.
 */
export interface RequestEvent {
  /**
   * The request.
   */
  request: Request;

  /**
   * Parameters of the route match.
   */
  params: Params;

  /**
   * Request url.
   */
  url: URL;

  /**
   * Request locals.
   */
  locals: Locals;
}

/**
 * A request handler.
 */
export type Handler = (event: RequestEvent) => MaybePromise<Response>;

/**
 * A middleware handler.
 */
export type Middleware = (event: RequestEvent, next: Handler) => MaybePromise<Response>;
