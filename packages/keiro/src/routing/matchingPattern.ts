/**
 * Define how to match the path segments.
 */
export interface MatchingPattern {
  /**
   * Match a dynamic path segment.
   */
  matchDynamic: MatchPatternFunction;

  /**
   * Match a catch-all path segment.
   */
  matchCatchAll: MatchPatternFunction;

  /**
   * Match an optional catch-all path segment.
   */
  matchOptionalDynamic: MatchPatternFunction;

  /**
   * Match an optional catch-all path segment.
   */
  matchOptionalCatchAll: MatchPatternFunction;
}

type Falsy = undefined | null | false;

type MatchPatternFunction = (segment: string, pathSegments: string[]) => string | Falsy;

/**
 * Returns a pattern matching for:
 * - dynamic: `[id]`
 * - catch-all: `[...params]`
 * - optional dynamic: `[[id]]`
 * - optional catch-all: `[[...params]]`
 */
export function nextJsPatternMatching(): MatchingPattern {
  return {
    matchDynamic(segment) {
      const matches = /^\[(?<param>\w+)\]/.exec(segment);
      return matches && matches.groups?.param;
    },
    matchCatchAll(segment) {
      const matches = /^\[\.\.\.(?<param>\w+)\]/.exec(segment);
      return matches && matches.groups?.param;
    },
    matchOptionalDynamic(segment) {
      const matches = /^\[\[(?<param>\w+)\]\]/.exec(segment);
      return matches && matches.groups?.param;
    },
    matchOptionalCatchAll(segment) {
      const matches = /^\[\[\.\.\.(?<param>\w+)\]\]/.exec(segment);
      return matches && matches.groups?.param;
    },
  };
}
