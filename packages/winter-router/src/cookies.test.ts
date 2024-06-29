import { Cookies } from "./cookies.js";

describe("Cookies", () => {
  test("Get and set cookie", () => {
    const cookies = new Cookies();
    cookies.set("fruit", "orange");
    const cookie = cookies.get("fruit");

    expect(cookie?.name).toBe("fruit");
    expect(cookie?.value).toBe("orange");
  });

  test("Delete cookie", () => {
    const cookies = new Cookies();

    cookies.set("fruit", "orange");
    cookies.delete("fruit");
    const cookie = cookies.get("fruit");
    expect(cookie).toBeUndefined();
  });

  test("Initialize from headers", () => {
    const headers = new Headers();
    headers.set("Cookie", "color=red");
    const cookies = Cookies.fromHeaders(headers);
    const cookie = cookies.get("color");

    expect(cookie?.name).toBe("color");
    expect(cookie?.value).toBe("red");
  });

  test("Entries iterator without deleted cookies", () => {
    const cookies = new Cookies();

    cookies.set("fruit", "mango");
    cookies.set("color", "orange");
    cookies.set("animal", "cat");

    cookies.delete("animal");
    const entries = Array.from(cookies.entries());

    expect(entries).toHaveLength(2);

    expect(entries[0][1]).toMatchObject(
      expect.objectContaining({
        name: "fruit",
        value: "mango",
      })
    );

    expect(entries[1][1]).toMatchObject(
      expect.objectContaining({
        name: "color",
        value: "orange",
      })
    );
  });

  test("Entries iterator with deleted cookies", () => {
    const cookies = new Cookies();

    cookies.set("fruit", "mango");
    cookies.set("color", "orange");
    cookies.set("animal", "cat");

    cookies.delete("animal");
    const entries = Array.from(cookies.entries(false));

    expect(entries).toHaveLength(3);

    expect(entries[0][1]).toMatchObject(
      expect.objectContaining({
        name: "fruit",
        value: "mango",
      })
    );

    expect(entries[1][1]).toMatchObject(
      expect.objectContaining({
        name: "color",
        value: "orange",
      })
    );

    expect(entries[2][1]).toMatchObject(
      expect.objectContaining({
        name: "animal",
        value: "",
      })
    );
  });
});
