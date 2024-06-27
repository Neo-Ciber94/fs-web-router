import { tsImport } from "tsx/esm/api";
import type { Route } from "./createFileSystemRouter.js";
import type { Middleware } from "./types.js";
import path from "path";

export const EXTENSIONS = Object.freeze(["js", "jsx", "cjs", "mjs", "ts", "tsx", "cts", "mts"]);

export async function createRoute(filePath: string): Promise<Route> {
  const mod = await importModule(filePath);

  if (!mod || typeof mod.default !== "function") {
    throw new Error(
      `Unable to get route handler in '${filePath}', expected default exported function`
    );
  }

  return { handler: mod.default };
}

export async function createMiddleware(filePath: string): Promise<Middleware> {
  const mod = await importModule(filePath);

  if (!mod || typeof mod.default !== "function") {
    throw new Error(
      `Unable to get middleware handler in '${filePath}', expected default exported function`
    );
  }

  return mod.default;
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
  return tsImport(specifier, import.meta.url);
}
