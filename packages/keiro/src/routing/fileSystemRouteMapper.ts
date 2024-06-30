// import { MatchingPattern, nextJsPatternMatching } from "./matchingPattern";

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

// interface DefaultFileSystemRouteMapperOptions {
//   matching?: MatchingPattern;
//   ignorePrefix?: string;
// }

// export class DefaultFileSystemRouteMapper extends FileSystemRouteMapper {
//   #matchingPattern: MatchingPattern;
//   #ignorePrefix: string;

//   constructor(options?: DefaultFileSystemRouteMapperOptions) {
//     super();
//     const { matching = nextJsPatternMatching(), ignorePrefix = "_" } = options || {};

//     this.#matchingPattern = matching;
//     this.#ignorePrefix = ignorePrefix;
//   }

//   toPath(filePath: string): RouteSegment[] | undefined {
//     throw new Error("Method not implemented.");
//   }

//   private isIgnored(filePath: string) {}
// }
