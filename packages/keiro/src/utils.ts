import type { Route } from "./createFileSystemRouter";
import { invariant } from "./invariant";
import type { Middleware } from "./types";
import path from "node:path";

export const EXTENSIONS = Object.freeze(["js", "jsx", "cjs", "mjs", "ts", "tsx", "cts", "mts"]);
export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

export async function createRoute(filePath: string): Promise<Route> {
  const mod = await importModule(filePath);

  if (!mod) {
    throw new Error(`Unable to load module from '${filePath}'`);
  }

  const route: Route = {};

  if (mod.default) {
    invariant(typeof mod.default === "function", `'${filePath}' default export is not a function`);
    route.default = mod.default;
  }

  for (const method of HTTP_METHODS) {
    const handler = mod[method];

    if (handler) {
      invariant(typeof handler === "function", `'${filePath}' ${method} export is not a function`);
      route[method] = handler;
    }
  }

  return route;
}

export async function createMiddleware(filePath: string): Promise<Middleware> {
  const mod = await importModule(filePath);

  if (!mod || typeof mod.default !== "function") {
    throw new Error(
      `Unable to get middleware handler in '${filePath}', expected default exported function`,
    );
  }

  return mod.default;
}

export function getRouteHandler(request: Request, route: Route) {
  const defaultHandler = route.default;
  const method = request.method.toUpperCase() as HttpMethod;
  const httpMethodHandler = route[method];
  return httpMethodHandler ?? defaultHandler;
}

export function normalizePath(p: string) {
  return p.replaceAll(path.win32.sep, path.posix.sep);
}

export function headersToObject(headers: Headers) {
  const obj: Record<string, string[]> = {};

  for (const [key, value] of headers) {
    const headerValues = obj[key] || [];

    if (Array.isArray(value)) {
      headerValues.push(...value);
    } else {
      headerValues.push(value);
    }
  }

  return obj;
}

export function objectToHeaders(obj: Record<string, string[]>) {
  const headers = new Headers();

  for (const [key, value] of Object.entries(obj)) {
    value.forEach((v) => headers.append(key, v));
  }

  return headers;
}

function importModule(specifier: string) {
  return import(specifier);
}

export type DeepFreezed<T> =
  T extends Record<string, unknown>
    ? {
        readonly [K in keyof T]: DeepFreezed<T[K]>;
      }
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      T extends any[]
      ? ReadonlyArray<DeepFreezed<T[number]>>
      : T;

export function deepFreeze<T>(value: T): DeepFreezed<T> {
  if (value === undefined || value === null) {
    return value as DeepFreezed<T>;
  }

  if (typeof value !== "object") {
    return value as DeepFreezed<T>;
  }

  Object.freeze(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      deepFreeze(item);
    }
  } else {
    for (const key in value) {
      deepFreeze(value[key]);
    }
  }

  return value as DeepFreezed<T>;
}
