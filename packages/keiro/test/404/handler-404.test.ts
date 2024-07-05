import type { Polka } from "polka";
import polka from "polka";
import { fileSystemRouter } from "../../src/handler/node.js";
import { findAvailablePort } from "../utils.js";

let app: Polka | undefined;

const port = await findAvailablePort(5000);
const origin = `http://localhost:${port}`;

function startServer() {
  return new Promise<Polka>((resolve) => {
    const app = polka();
    app.use(fileSystemRouter({ origin, routesDir: "test/404/routes" }));
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

describe("404 handler", () => {
  test("Should show 404 page on unknown route", async () => {
    const res = await fetch(`${origin}/not-existing-route`);
    expect(res.status).toStrictEqual(404);
    await expect(res.text()).resolves.toStrictEqual("Nothing here");
  });

  test("Should show 404 page on unknown method", async () => {
    const res1 = await fetch(`${origin}`);
    expect(res1.ok).toBeTruthy();

    const res2 = await fetch(`${origin}`, { method: "POST" });
    expect(res2.ok).toBeFalsy();
    await expect(res2.text()).resolves.toStrictEqual("Nothing here");
  });
});
