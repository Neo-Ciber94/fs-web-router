import type { Route } from "./createFileSystemRouter.js";
import type { Middleware } from "./types.js";

export const EXTENSIONS = Object.freeze(["js", "jsx", "cjs", "mjs", "ts", "tsx", "cts", "mts"]);

export async function createRoute(filePath: string): Promise<Route> {
  const mod = await import(filePath);

  if (!mod || typeof mod.default !== "function") {
    throw new Error(
      `Unable to get route handler in '${filePath}', expected default exported function`
    );
  }

  return { handler: mod.default };
}

export async function createMiddleware(filePath: string): Promise<Middleware> {
  const mod = await import(filePath);

  if (!mod || typeof mod.default !== "function") {
    throw new Error(
      `Unable to get middleware handler in '${filePath}', expected default exported function`
    );
  }

  return mod.default;
}
