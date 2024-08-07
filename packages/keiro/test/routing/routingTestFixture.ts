import type { Polka } from "polka";
import polka from "polka";
import { fileSystemRouter } from "../../src/handler/node.js";
import { findAvailablePort } from "../utils.js";
import { type FileSystemRouterOptions } from "../../src/fileSystemRouter.js";

export function routingTestFixture(options: Omit<FileSystemRouterOptions, "origin" | "routesDir">) {
  describe("Routing with default handler", async () => {
    let app: Polka | undefined;

    const port = await findAvailablePort(5000);
    const origin = `http://localhost:${port}`;

    function startServer() {
      return new Promise<Polka>((resolve) => {
        const app = polka();
        app.use(
          fileSystemRouter({
            origin,
            routesDir: "test/routing/routes",
            ...options,
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

    test("Static route: GET /a", async () => {
      const res = await fetch(`${origin}/a`);
      const text = await res.text();
      expect(text).toStrictEqual("/a");
    });

    test("Dynamic route: GET /b/[id]", async () => {
      const res = await fetch(`${origin}/b/red`);
      const text = await res.text();
      expect(text).toStrictEqual("/b/red");
    });

    test("Catch-all route: GET /c/[...args]", async () => {
      const res = await fetch(`${origin}/c/blue/red/green`);
      const text = await res.text();
      expect(text).toStrictEqual("/c/blue/red/green");
    });

    test("Optional Dynamic route: GET /d/[[id]]", async () => {
      const res = await fetch(`${origin}/d/mango`);
      const text = await res.text();
      expect(text).toStrictEqual("/d/mango");
    });

    test("Optional Dynamic route default: GET /d/[[id]]", async () => {
      const res = await fetch(`${origin}/d`);
      const text = await res.text();
      expect(text).toStrictEqual("/d/");
    });

    test("Optional Catch-all route: GET /e/[[...args]]", async () => {
      const res = await fetch(`${origin}/e/apple/pear/grape`);
      const text = await res.text();
      expect(text).toStrictEqual("/e/apple/pear/grape");
    });

    test("Optional Catch-all route default: GET /e/[[...args]]", async () => {
      const res = await fetch(`${origin}/e`);
      const text = await res.text();
      expect(text).toStrictEqual("/e/");
    });

    test("Should return 404", async () => {
      const res = await fetch(`${origin}/not-exists-route`);
      expect(res.status).toStrictEqual(404);
    });

    test("Should get multiple params: GET f/blue/apple/this/is/the/rest", async () => {
      const res = await fetch(`${origin}/f/blue/apple/this/is/the/rest`);
      const json = await res.json();

      expect(json).toStrictEqual({
        g: "blue",
        h: "apple",
        i: "this/is/the/rest",
      });
    });

    test("Should return 404 on ignored route", async () => {
      const res = await fetch(`${origin}/_ignore`);
      expect(res.status).toStrictEqual(404);
    });
  });

  describe("Routing with http methods", async () => {
    let app: Polka | undefined;

    const port = await findAvailablePort(5000);
    const origin = `http://localhost:${port}`;

    function startServer() {
      return new Promise<Polka>((resolve) => {
        const app = polka();
        app.use(
          fileSystemRouter({
            origin,
            routesDir: "test/routing/routes",
            ...options,
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

    test("Should call GET handler", async () => {
      const res = await fetch(`${origin}/x/api_1`);
      const text = await res.text();
      expect(text).toStrictEqual("get 1");
    });

    test("Should call POST handler", async () => {
      const res = await fetch(`${origin}/x/api_1`, { method: "POST" });
      const text = await res.text();
      expect(text).toStrictEqual("post 1");
    });

    test("Should call PUT handler", async () => {
      const res = await fetch(`${origin}/x/api_1`, { method: "PUT" });
      const text = await res.text();
      expect(text).toStrictEqual("put 1");
    });

    test("Should call PATCH handler", async () => {
      const res = await fetch(`${origin}/x/api_1`, { method: "PATCH" });
      const text = await res.text();
      expect(text).toStrictEqual("patch 1");
    });

    test("Should call DELETE handler", async () => {
      const res = await fetch(`${origin}/x/api_1`, { method: "DELETE" });
      const text = await res.text();
      expect(text).toStrictEqual("delete 1");
    });

    test("Should call HEAD handler", async () => {
      const res = await fetch(`${origin}/x/api_1`, { method: "HEAD" });
      expect(res.headers.get("data")).toStrictEqual("head 1");
    });

    test("Should call OPTIONS handler", async () => {
      const res = await fetch(`${origin}/x/api_1`, { method: "OPTIONS" });
      const text = await res.text();
      expect(text).toStrictEqual("options 1");
    });

    test("Should return 404 on not existing handler", async () => {
      const res = await fetch(`${origin}/x/api_2`, { method: "PUT" });
      expect(res.status).toStrictEqual(404);
    });

    test("Should call GET instead of default handler", async () => {
      const res = await fetch(`${origin}/x/api_3`, { method: "GET" });
      const text = await res.text();
      expect(text).toStrictEqual("get 3");
    });

    test("Should call POST instead of default handler", async () => {
      const res = await fetch(`${origin}/x/api_3`, { method: "POST" });
      const text = await res.text();
      expect(text).toStrictEqual("post 3");
    });

    test("Should call default handler", async () => {
      const res = await fetch(`${origin}/x/api_3`, { method: "PUT" });
      const text = await res.text();
      expect(text).toStrictEqual("Other method: put");
    });
  });
}
