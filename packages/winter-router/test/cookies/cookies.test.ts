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
    expect(cookies).toHaveLength(3);
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

  test("Should get and delete cookies", async () => {
    const res = await fetch(`${origin}/get_delete_cookie`, {
      headers: {
        Cookie: "color=black",
      },
    });
    const cookies = res.headers.getSetCookie();

    expect(res.ok).toBeTruthy();
    expect(cookies).toHaveLength(3);
    expect(cookies.some((s) => s.includes("color=;"))).toBeTruthy();
    expect(cookies).toContain("fruit=orange");
    expect(cookies).toContain("language=javascript");
  });
});
