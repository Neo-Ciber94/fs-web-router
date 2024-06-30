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
  const files = scanFileSystemRoutes(cwd, routesDir, extensions, ignoreFiles);
  const routeSegmentsMap = new Map<string, RouteSegment[]>();

  for (const file of files) {
    const filePath = path.relative(routesDirPath, path.join(cwd, file));
    const segments = routeMapper.toPath(filePath);

    if (segments !== undefined) {
      routeSegmentsMap.set(file, segments);
    }
  }

  const routes: Record<string, string> = {};

  for (const [filePath, segments] of routeSegmentsMap.entries()) {
    const routePaths = [toRadix3(segments)];

    // radix3 router do not allow optional segments, to support it we add the dynamic segment
    // and then push the fallback route when the dynamic segment is not available
    {
      const optionalIndex = segments.findIndex((s) => {
        return (s.type === "catch-all" || s.type === "dynamic") && s.optional;
      });

      if (optionalIndex >= 0) {
        routePaths.push(toRadix3(segments.slice(0, optionalIndex)));
      }
    }

    for (const routeId of routePaths) {
      if (routeId in routes) {
        throw new Error(`Route '${routeId}' already exists`);
      }

      const importPath = url.pathToFileURL(filePath).href;
      routes[routeId] = importPath;
    }
  }

  return routes;
}

function scanFileSystemRoutes(
  cwd: string,
  routesDir: string,
  extensions: string[],
  ignoreFiles?: string[],
) {
  const files = globSync(`${routesDir}/**`, {
    cwd,
    posix: true,
    nodir: true,
    ignore: ignoreFiles,
  });

  const dotExtensions = extensions.map((ext) => `.${ext}`);
  return files.filter((file) => dotExtensions.includes(path.extname(file)));
}

function toRadix3(segments: RouteSegment[]) {
  const routePath = segments.reduce((acc, p) => {
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
