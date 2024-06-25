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
  params: Record<string, string | string[]>;

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
