import { globSync } from "glob";
import { posix as path } from "node:path";
import url from "node:url";
import type { RouteSegment } from "./fileSystemRouteMapper";
import type { CreateRouterOptions } from "../fileSystemRouter";

/**
 * @internal
 */
export function getFileSystemRoutesMap(options: CreateRouterOptions) {
  const { cwd, routesDir, extensions, ignoreFiles, routeMapper } = options;
  const routesDirPath = path.join(cwd, routesDir);

  const dir = routesDirPath.endsWith("/")
    ? routesDirPath.substring(0, routesDirPath.length - 1)
    : routesDirPath;

  const files = scanFileSystemRoutes(dir, extensions, ignoreFiles);
  const routesMap = new Map<string, RouteSegment[]>();

  for (const file of files) {
    const filePath = path.relative(routesDirPath, path.join(cwd, file));
    const segments = routeMapper.toPath(filePath);

    if (segments) {
      routesMap.set(file, segments);
    }
  }

  const routes: Record<string, string> = {};

  for (const [routePath, segments] of routesMap.entries()) {
    for (const p of toRadix3(segments)) {
      if (p in routes) {
        throw new Error(`Route '${p}' already exists`);
      }
      const importPath = url.pathToFileURL(path.join(cwd, routePath)).href;
      routes[p] = importPath;
    }
  }

  return routes;
}

function scanFileSystemRoutes(dir: string, extensions: string[], ignoreFiles?: string[]) {
  const files = globSync(`${dir}/**`, {
    posix: true,
    nodir: true,
    ignore: ignoreFiles,
  });

  const dotExtensions = extensions.map((ext) => `.${ext}`);
  return files.filter((file) => dotExtensions.includes(path.extname(file)));
}

function toRadix3(segments: RouteSegment[]) {
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
    (s) => (s.type === "catch-all" || s.type === "dynamic") && s.optional,
  );

  if (optionalIndex >= 0) {
    paths.push(reduceSegments(segments.slice(0, optionalIndex)));
  }

  return paths;
}
