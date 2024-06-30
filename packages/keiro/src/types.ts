import type { Cookies } from "./cookies";

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
  readonly request: Request;

  /**
   * Parameters of the route match.
   */
  readonly params: Params;

  /**
   * Request url.
   */
  readonly url: URL;

  /**
   * Request cookies.
   */
  readonly cookies: Cookies;

  /**
   * Request locals.
   */
  readonly locals: Locals;
}

/**
 * A request handler.
 */
export type Handler = (event: RequestEvent, next: Handler) => MaybePromise<Response>;

/**
 * The next handler in a middleware chain.
 */
export type Next = (event: RequestEvent) => MaybePromise<Response>;

/**
 * A request middleware.
 */
export type Middleware = (event: RequestEvent, next: Next) => MaybePromise<Response>;
