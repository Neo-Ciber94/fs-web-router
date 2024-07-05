import type { Polka } from "polka";
import polka from "polka";
import { fileSystemRouter } from "../../src/handler/node.js";
import { findAvailablePort } from "../utils.js";

describe("Routing with prefix on server", async () => {
  let app: Polka | undefined;
  const port = await findAvailablePort(5000);
  const origin = `http://localhost:${port}`;

  function startServer() {
    return new Promise<Polka>((resolve) => {
      const app = polka();
      app.use("/api", fileSystemRouter({ origin, routesDir: "test/routing/routes" }));
      app.listen(port, () => {
        resolve(app);
      });
    });
  }

  beforeEach(async () => {
    app = await startServer();
  });

  afterEach(() => {
    app?.server?.close();
  });

  test("Should get response", async () => {
    const res = await fetch(`${origin}/api/x/api_4`);

    expect(res.ok).toBeTruthy();
    await expect(res.text()).resolves.toStrictEqual("this is other route");
  });
});

describe("Routing with prefix on fileSystemRouter", async () => {
  let app: Polka | undefined;
  const port = await findAvailablePort(5000);
  const origin = `http://localhost:${port}`;

  function startServer() {
    return new Promise<Polka>((resolve) => {
      const app = polka();
      app.use(
        fileSystemRouter({
          origin,
          prefix: "/api",
          routesDir: "test/routing/routes",
        }),
      );
      app.listen(port, () => {
        resolve(app);
      });
    });
  }

  beforeEach(async () => {
    app = await startServer();
  });

  afterEach(() => {
    app?.server?.close();
  });

  test("Should get response", async () => {
    const res = await fetch(`${origin}/api/x/api_4`);

    expect(res.ok).toBeTruthy();
    await expect(res.text()).resolves.toStrictEqual("this is other route");
  });
});
