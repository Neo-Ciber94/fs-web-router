import polka, { Polka } from "polka";
import fileSystemRouter from "../../src/handler/node.js";
import { findAvailablePort } from "../utils.js";

let app: Polka | undefined;

const port = await findAvailablePort(5000);
const origin = `http://localhost:${port}`;

function startServer() {
  return new Promise<Polka>((resolve) => {
    const app = polka();
    app.use(fileSystemRouter({ origin, routesDir: "test/routing/routes" }));
    app.listen(port, () => {
      console.log(`Listening on ${origin}`);
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

describe("Routing", () => {
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

  test("Return 404", async () => {
    const res = await fetch(`${origin}/not-exists-route`);
    expect(res.status).toStrictEqual(404);
  });
});
