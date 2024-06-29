import polka, { Polka } from "polka";
import fileSystemRouter from "../../src/handler/node.js";
import { findAvailablePort } from "../utils.js";

let app: Polka | undefined;

const port = await findAvailablePort(5000);
const origin = `http://localhost:${port}`;

function startServer() {
  return new Promise<Polka>((resolve) => {
    const app = polka();
    app.use(fileSystemRouter({ origin, routesDir: "test/cookies/routes" }));
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

describe("Cookies", () => {
  test("Should set cookies", async () => {
    const res = await fetch(`${origin}/set_cookie`);
    const cookies = res.headers.getSetCookie();

    expect(res.ok).toBeTruthy();
    expect(cookies).toContain("fruit=apple");
    expect(cookies).toContain("color=purple");
    expect(cookies).toContain("character=Ryuji%20Ayukawa");
  });

  test("Should get cookies", async () => {
    const res = await fetch(`${origin}/get_cookie/fruit`, {
      method: "POST",
      headers: {
        Cookie: "fruit=apple",
      },
    });

    const value = await res.text();

    expect(res.ok).toBeTruthy();
    expect(value).toStrictEqual("apple");
  });
});
