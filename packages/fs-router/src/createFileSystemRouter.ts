import { globSync } from "glob";
import { MatchingPattern } from "./matchingPattern";
import { createRouter } from "radix3";
import { Handler } from "./types";
import { posix as path } from "path";
import url from "url";

type RouteSegment =
  | { type: "static"; path: string }
  | { type: "dynamic"; path: string; optional: boolean }
  | { type: "catch-all"; path: string; optional: boolean };

type CreateRouterOptions = {
  cwd: string;
  routesDirPath: string;
  ignoreFiles?: string[];
  ignorePrefix: string;
  matchingPattern: MatchingPattern;
};

type Route = {
  handler: Handler;
};

export default async function createFileSystemRouter(options: CreateRouterOptions) {
  const { cwd, routesDirPath, ignoreFiles, ignorePrefix, matchingPattern } = options;

  const dir = routesDirPath.endsWith("/")
    ? routesDirPath.substring(0, routesDirPath.length - 1)
    : routesDirPath;

  const files = globSync(`${dir}/**`, {
    posix: true,
    nodir: true,
    dotRelative: true,
    ignore: ignoreFiles,
  });

  const routesMap = new Map<string, RouteSegment[]>();

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

  const routes: Record<string, Route> = {};
  const routePromises: Promise<Route>[] = [];

  for (const [routePath, segments] of routesMap.entries()) {
    for (const p of createRoutePaths(segments)) {
      const importPath = url.pathToFileURL(path.join(routesDirPath, p)).href;

      if (p in routes) {
        throw new Error(`Route '${p}' already exists`);
      }

      routePromises.push(
        import(importPath).then(async (mod) => {
          if (!mod || typeof mod.default !== "function") {
            throw new Error(
              `Unable to get route handler in '${routePath}', expected default exported function`
            );
          }

          const handler = mod.default;

          routes[p] = { handler };

          return handler;
        })
      );
    }
  }

  await Promise.all(routePromises);
  console.log(routes);

  const router = createRouter<Route>({ routes });
  return router;
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
