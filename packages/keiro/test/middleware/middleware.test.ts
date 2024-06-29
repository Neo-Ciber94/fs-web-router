import polka, { Polka } from "polka";
import { fileSystemRouter } from "../../src/handler/node.js";
import { findAvailablePort } from "../utils.js";

let app: Polka | undefined;

const port = await findAvailablePort(5000);
const origin = `http://localhost:${port}`;

function startServer() {
  return new Promise<Polka>((resolve) => {
    const app = polka();
    app.use(fileSystemRouter({ origin, routesDir: "test/middleware/routes" }));
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

describe("Middleware", () => {
  test("Should get response from middleware: GET /a", async () => {
    const res = await fetch(`${origin}/a`);
    const text = await res.text();
    expect(text).toStrictEqual("a");
  });

  test("Should get 404 from middleware: GET /404", async () => {
    const res = await fetch(`${origin}/404`);
    const text = await res.text();

    expect(res.status).toStrictEqual(404);
    expect(text).toStrictEqual("404");
  });

  test("Should get 404 from middleware calling next()", async () => {
    const res = await fetch(`${origin}/not-existing-route`);
    expect(res.status).toStrictEqual(404);
  });
});
