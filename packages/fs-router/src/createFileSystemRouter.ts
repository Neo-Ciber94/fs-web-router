import { globSync } from "glob";
import { type MatchingPattern } from "./matchingPattern.js";
import { type Handler } from "./types.js";
import { createRouter } from "radix3";
import { posix as path } from "path";
import { dirname } from "path";
import url from "url";
import { createRoute, normalizePath } from "./utils.js";

const __dirname = normalizePath(dirname(url.fileURLToPath(import.meta.url)));

type RouteSegment =
  | { type: "static"; path: string }
  | { type: "dynamic"; path: string; optional: boolean }
  | { type: "catch-all"; path: string; optional: boolean };

interface CreateRouterOptions {
  cwd: string;
  routesDirPath: string;
  ignoreFiles?: string[];
  ignorePrefix: string;
  matchingPattern: MatchingPattern;
}

export interface Route {
  handler: Handler;
}

export default async function createFileSystemRouter(options: CreateRouterOptions) {
  const routesMap = getRouterMap(options);
  const routes: Record<string, Route> = {};
  const routePromises: Promise<Route>[] = [];

  for (const [key, routeFilePath] of Object.entries(routesMap)) {
    routePromises.push(
      createRoute(routeFilePath).then((route) => {
        routes[key] = route;
        return route;
      })
    );
  }

  await Promise.all(routePromises);
  console.log(routes);

  const router = createRouter<Route>({ routes });
  return router;
}

/**
 * @internal
 */
export function getRouterMap(options: CreateRouterOptions) {
  const { cwd, routesDirPath, ignoreFiles, ignorePrefix, matchingPattern } = options;

  const dir = routesDirPath.endsWith("/")
    ? routesDirPath.substring(0, routesDirPath.length - 1)
    : routesDirPath;

  const files = globSync(`${dir}/**`, {
    posix: true,
    nodir: true,
    ignore: ignoreFiles,
  });

  const routesMap = new Map<string, RouteSegment[]>();

  console.log({ files });
  for (const file of files) {
    if (isIgnored(file, ignorePrefix)) {
      continue;
    }

    const pathSegments = path
      .relative(routesDirPath, path.join(cwd, file))
      .replace(/\.[cm]?(ts|js)x?/, "")
      .split("/");

    if (pathSegments[pathSegments.length - 1] === "index") {
      pathSegments.pop();
    }

    const segments: RouteSegment[] = [];

    for (const pathSegment of pathSegments) {
      let match: string | null | undefined | false = undefined;

      if ((match = matchingPattern.matchOptionalCatchAll(pathSegment, pathSegments))) {
        segments.push({ path: match, type: "catch-all", optional: true });
      } else if ((match = matchingPattern.matchOptionalDynamic(pathSegment, pathSegments))) {
        segments.push({ path: match, type: "dynamic", optional: true });
      } else if ((match = matchingPattern.matchCatchAll(pathSegment, pathSegments))) {
        segments.push({ path: match, type: "catch-all", optional: false });
      } else if ((match = matchingPattern.matchDynamic(pathSegment, pathSegments))) {
        segments.push({ path: match, type: "dynamic", optional: false });
      } else {
        segments.push({ path: pathSegment, type: "static" });
      }
    }

    routesMap.set(file, segments);
  }

  const routes: Record<string, string> = {};

  for (const [routePath, segments] of routesMap.entries()) {
    for (const p of createRoutePaths(segments)) {
      if (p in routes) {
        throw new Error(`Route '${p}' already exists`);
      }
      const importPath = url.pathToFileURL(path.join(cwd, routePath)).href;

      // const idir = normalizePath(path.join(cwd, routePath));
      // const rel = path.relative(__dirname, path.join(cwd, routePath));
      // const importP = path
      //   .resolve(rel, path.join(cwd, routePath))
      //   .replace(/\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$/g, "");

      // console.log({ __dirname, idir, importP, rel });
      routes[p] = importPath;
    }
  }

  console.log({ __dirname, routes });
  return routes;
}

function createRoutePaths(segments: RouteSegment[]) {
  function reduceSegments(s: RouteSegment[]) {
    const routePath = s.reduce((acc, p) => {
      switch (p.type) {
        case "static":
          return `${acc}/${p.path}`;
        case "dynamic":
          return `${acc}/:${p.path}`;
        case "catch-all":
          return `${acc}/**:${p.path}`;
      }
    }, "");

    if (routePath.startsWith("/")) {
      return routePath;
    }

    return `/${routePath}`;
  }

  const paths: string[] = [reduceSegments(segments)];
  const optionalIndex = segments.findIndex(
    (s) => (s.type === "catch-all" || s.type === "dynamic") && s.optional
  );

  if (optionalIndex >= 0) {
    paths.push(reduceSegments(segments.slice(0, optionalIndex - 1)));
  }

  return paths;
}

function isIgnored(filePath: string, ignorePrefix: string) {
  return filePath
    .split("/")
    .filter(Boolean)
    .some((p) => p.startsWith(ignorePrefix));
}
