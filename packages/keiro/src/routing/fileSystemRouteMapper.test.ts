import { DefaultFileSystemRouteMapper, type RouteSegment } from "./fileSystemRouteMapper";

describe("DefaultFileSystemRouteMapper", () => {
  const mapper = new DefaultFileSystemRouteMapper();

  test("Should get path segments", () => {
    const segments = mapper.toPath("/this/is/a/route.ts");

    expect(segments).toStrictEqual<RouteSegment[]>([
      { type: "static", path: "this" },
      { type: "static", path: "is" },
      { type: "static", path: "a" },
      { type: "static", path: "route" },
    ]);
  });

  test("Should ignore index file at the end", () => {
    const segments = mapper.toPath("/other/route/index.ts");

    expect(segments).toStrictEqual<RouteSegment[]>([
      { type: "static", path: "other" },
      { type: "static", path: "route" },
    ]);
  });

  test("Should ignore index file at the start", () => {
    const segments = mapper.toPath("index.ts");

    expect(segments).toStrictEqual<RouteSegment[]>([]);
  });

  test("Should ignore group segments", () => {
    const segments = mapper.toPath("/(group)/some/(ignore)/other.js");

    expect(segments).toStrictEqual<RouteSegment[]>([
      { type: "static", path: "some" },
      { type: "static", path: "other" },
    ]);
  });

  test("Should get dynamic segments", () => {
    const segments = mapper.toPath("/some/[id]/other/[param]/route.ts");

    expect(segments).toStrictEqual<RouteSegment[]>([
      { type: "static", path: "some" },
      { type: "dynamic", path: "id" },
      { type: "static", path: "other" },
      { type: "dynamic", path: "param" },
      { type: "static", path: "route" },
    ]);
  });

  test("Should get catch-all segments", () => {
    const segments = mapper.toPath("/some/[...args]/route.ts");

    expect(segments).toStrictEqual<RouteSegment[]>([
      { type: "static", path: "some" },
      { type: "catch-all", path: "args" },
      { type: "static", path: "route" },
    ]);
  });

  test("Should get optional dynamic segments", () => {
    const segments = mapper.toPath("/some/[[id]]/route.ts");

    expect(segments).toStrictEqual<RouteSegment[]>([
      { type: "static", path: "some" },
      { type: "dynamic", path: "id", optional: true },
      { type: "static", path: "route" },
    ]);
  });

  test("Should get optional catch-all segments", () => {
    const segments = mapper.toPath("/some/[[...params]]/route.ts");

    expect(segments).toStrictEqual<RouteSegment[]>([
      { type: "static", path: "some" },
      { type: "catch-all", path: "params", optional: true },
      { type: "static", path: "route" },
    ]);
  });
});
