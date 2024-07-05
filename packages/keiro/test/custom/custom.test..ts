import type { Polka } from "polka";
import polka from "polka";
import { fileSystemRouter } from "../../src/handler/node.js";
import { findAvailablePort } from "../utils.js";

describe("Custom 404", async () => {
  let app: Polka | undefined;

  const port = await findAvailablePort(5000);
  const origin = `http://localhost:${port}`;

  function startServer() {
    return new Promise<Polka>((resolve) => {
      const app = polka();
      app.use(
        fileSystemRouter({
          origin,
          routesDir: "test/custom/routes",
          notFound: "not-found",
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

  test("Should get custom 404 error", async () => {
    const res = await fetch(`${origin}/not-found`);
    expect(res.ok).toBeFalsy();
    expect(res.status).toStrictEqual(404);
    await expect(res.text()).resolves.toStrictEqual("Not found");
  });
});

describe("Custom middleware", async () => {
  let app: Polka | undefined;

  const port = await findAvailablePort(5000);
  const origin = `http://localhost:${port}`;

  function startServer() {
    return new Promise<Polka>((resolve) => {
      const app = polka();
      app.use(
        fileSystemRouter({
          origin,
          routesDir: "test/custom/routes",
          middleware: "interceptor",
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

  test("Should call custom middleware", async () => {
    const res = await fetch(`${origin}/ping`);
    expect(res.ok).toBeTruthy();
    await expect(res.text()).resolves.toStrictEqual("Pong");
  });
});
