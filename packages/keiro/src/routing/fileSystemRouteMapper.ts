import { type MatchingPattern, nextJsPatternMatching } from "./matchingPattern";

/**
 * A part of a route path.
 */
export type RouteSegment =
  | {
      type: "static";
      path: string;
    }
  | {
      type: "dynamic";
      path: string;
      optional?: boolean;
    }
  | {
      type: "catch-all";
      path: string;
      optional?: boolean;
    };

/**
 * Maps a file-system path to a route path.
 */
export abstract class FileSystemRouteMapper {
  /**
   * Maps a file system path to a route path.
   * @param filePath A relative path to the file.
   */
  abstract toPath(filePath: string): RouteSegment[] | undefined;
}

/**
 * Options for the default file system route mapper.
 */
export interface DefaultFileSystemRouteMapperOptions {
  /**
   * Extract params from paths.
   */
  matching?: MatchingPattern;
}

/**
 * The default file system route mapper.
 *
 * By default it extracts the values using:
 * - dynamic: `[id]`
 * - catch-all: `[...params]`
 * - optional dynamic: `[[id]]`
 * - optional catch-all: `[[...params]]`
 */
export class DefaultFileSystemRouteMapper extends FileSystemRouteMapper {
  #matchingPattern: MatchingPattern;

  constructor(options?: DefaultFileSystemRouteMapperOptions) {
    super();
    const { matching = nextJsPatternMatching() } = options || {};

    this.#matchingPattern = matching;
  }

  toPath(filePath: string): RouteSegment[] | undefined {
    const filePathSegments = filePath
      // Remove the extensions: js, jsx, cjs, mjs, ts, tsx, cts, mts
      .replace(/(index)?\.[cm]?(ts|js)x?/, "")
      // Split into segments
      .split("/")
      // Skip empty segments
      .filter(Boolean)
      // We ignore folders with this pattern (<name>)
      .filter((s, idx, arr) => !/\(.+\)/.test(s) && idx < arr.length)
      // Convert segment to a RouteSegment
      .map((p, _, filePathSegments) => this.toRouteSegment(p, filePathSegments));

    return filePathSegments;
  }

  private toRouteSegment(pathSegment: string, filePathSegments: string[]): RouteSegment {
    const matchingPattern = this.#matchingPattern;
    let match: string | null | undefined | false = undefined;

    if ((match = matchingPattern.matchOptionalCatchAll(pathSegment, filePathSegments))) {
      return { path: match, type: "catch-all", optional: true };
    } else if ((match = matchingPattern.matchOptionalDynamic(pathSegment, filePathSegments))) {
      return { path: match, type: "dynamic", optional: true };
    } else if ((match = matchingPattern.matchCatchAll(pathSegment, filePathSegments))) {
      return { path: match, type: "catch-all" };
    } else if ((match = matchingPattern.matchDynamic(pathSegment, filePathSegments))) {
      return { path: match, type: "dynamic" };
    } else {
      return { path: pathSegment, type: "static" };
    }
  }
}
