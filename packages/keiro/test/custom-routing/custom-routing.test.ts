import type { Polka } from "polka";
import polka from "polka";
import { fileSystemRouter } from "../../src/handler/node.js";
import { findAvailablePort } from "../utils.js";
import {
  FileSystemRouteMapper,
  type RouteSegment,
} from "../../src/routing/fileSystemRouteMapper.js";

let app: Polka | undefined;

const port = await findAvailablePort(5000);
const origin = `http://localhost:${port}`;

/**
 * Maps:
 *
 * /static -> static route
 * /$id -> dynamic route, with param: 'id'
 * /$$rest -> catch-all route with params: 'rest'
 * /($id) -> optional dynamic route, with param 'id'
 * /($$rest) -> optional dynamic route, with params: 'rest'
 */
class DollarSignRouteMapper extends FileSystemRouteMapper {
  toPath(filePath: string): RouteSegment[] | undefined {
    return filePath
      .replace(/(index)?\.[cm]?(ts|js)x?/, "")
      .split("/")
      .filter(Boolean)
      .map((p) => this.#mapToSegment(p));
  }

  #mapToSegment(path: string): RouteSegment {
    let param: string | null = null;

    // Order matters
    if ((param = this.#geOptionalCatchAllParam(path))) {
      return { path: param, type: "catch-all", optional: true };
    } else if ((param = this.#geOptionalDynamicParam(path))) {
      return { path: param, type: "dynamic", optional: true };
    } else if ((param = this.#getCatchAllParam(path))) {
      return { path: param, type: "catch-all" };
    } else if ((param = this.#getDynamicParam(path))) {
      return { path: param, type: "dynamic" };
    } else {
      return { path, type: "static" };
    }
  }

  #getDynamicParam(p: string) {
    const param = /^\$(?<param>.+)/.exec(p);
    return (param && param.groups?.param) ?? null;
  }

  #getCatchAllParam(p: string) {
    const param = /^\$\$(?<param>.+)/.exec(p);
    return (param && param.groups?.param) ?? null;
  }

  #geOptionalDynamicParam(p: string) {
    const param = /^\(\$(?<param>.+)\)/.exec(p);
    return (param && param.groups?.param) ?? null;
  }

  #geOptionalCatchAllParam(p: string) {
    const param = /^\(\$\$(?<param>.+)\)/.exec(p);
    return (param && param.groups?.param) ?? null;
  }
}

function startServer() {
  return new Promise<Polka>((resolve) => {
    const app = polka();
    app.use(
      fileSystemRouter({
        origin,
        routesDir: "test/custom-routing/routes",
        routeMapper: new DollarSignRouteMapper(),
      }),
    );
    app.listen(port, () => {
      resolve(app);
    });
  });
}

beforeAll(async () => {
  app = await startServer();
});

afterAll(() => {
  app?.server?.close();
});

describe("Custom Router", () => {
  test("Should call static route", async () => {
    const res = await fetch(`${origin}/a/static`);

    expect(res.ok).toBeTruthy();
    await expect(res.text()).resolves.toStrictEqual("static route: /a/static");
  });

  test("Should call dynamic route", async () => {
    const res = await fetch(`${origin}/b/red`);

    expect(res.ok).toBeTruthy();
    await expect(res.text()).resolves.toStrictEqual("dynamic route: /b/red");
  });

  test("Should call catch-all route", async () => {
    const res1 = await fetch(`${origin}/c/1`);
    const res2 = await fetch(`${origin}/c/x/y/z`);

    expect(res1.ok).toBeTruthy();
    await expect(res1.text()).resolves.toStrictEqual("catchall route: /c/1");

    expect(res2.ok).toBeTruthy();
    await expect(res2.text()).resolves.toStrictEqual("catchall route: /c/x/y/z");
  });

  test("Should call optional dynamic route", async () => {
    const res1 = await fetch(`${origin}/d`);
    const res2 = await fetch(`${origin}/d/mango`);

    expect(res1.ok).toBeTruthy();
    await expect(res1.text()).resolves.toStrictEqual("optional dynamic route: /d/");

    expect(res2.ok).toBeTruthy();
    await expect(res2.text()).resolves.toStrictEqual("optional dynamic route: /d/mango");
  });

  test("Should call catch-all route", async () => {
    const res1 = await fetch(`${origin}/e`);
    const res2 = await fetch(`${origin}/e/strawberry`);
    const res3 = await fetch(`${origin}/e/one/two/three`);

    expect(res1.ok).toBeTruthy();
    await expect(res1.text()).resolves.toStrictEqual("optional catchall route: /e/");

    expect(res2.ok).toBeTruthy();
    await expect(res2.text()).resolves.toStrictEqual("optional catchall route: /e/strawberry");

    expect(res3.ok).toBeTruthy();
    await expect(res3.text()).resolves.toStrictEqual("optional catchall route: /e/one/two/three");
  });

  test("Should return 404 on ignored route", async () => {
    const res = await fetch(`${origin}/_ignore`);
    expect(res.status).toStrictEqual(404);
  });
});
