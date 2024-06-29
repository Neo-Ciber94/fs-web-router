import { Cookies } from "./cookies";

describe("Cookies", () => {
  test("Get and set cookie", () => {
    const cookies = new Cookies();
    cookies.set("fruit", "orange");
    const cookieValue = cookies.get("fruit");
    expect(cookieValue).toStrictEqual("orange");
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
    const cookieValue = cookies.get("color");
    expect(cookieValue).toStrictEqual("red");
  });

  test("Entries iterator", () => {
    const cookies = new Cookies();

    cookies.set("fruit", "mango");
    cookies.set("color", "orange");
    cookies.set("animal", "cat");

    cookies.delete("animal");
    const entries = Array.from(cookies.entries());

    expect(entries).toHaveLength(2);

    expect(entries[0][1]).toStrictEqual("mango");
    expect(entries[1][1]).toStrictEqual("orange");
  });

  test("Cookies toJSON", () => {
    const cookies = new Cookies();

    cookies.set("fruit", "mango");
    cookies.set("color", "orange");
    cookies.set("animal", "cat");

    const json = cookies.toJSON();

    expect(json).toStrictEqual({
      fruit: "mango",
      color: "orange",
      animal: "cat",
    });
  });

  test("Should get cookies from initials", () => {
    const cookies = new Cookies({ color: "blue", fruit: "mango" });
    cookies.set("drink", "water");

    expect(cookies.get("color")).toStrictEqual("blue");
    expect(cookies.get("fruit")).toStrictEqual("mango");
    expect(cookies.get("drink")).toStrictEqual("water");
  });

  test("Should get cookies after delete from initials", () => {
    const cookies = new Cookies({ color: "red", fruit: "pear" });
    cookies.set("drink", "soda");
    cookies.delete("color");

    expect(cookies.get("color")).toBeUndefined();
    expect(cookies.get("fruit")).toStrictEqual("pear");
    expect(cookies.get("drink")).toStrictEqual("soda");
  });

  test("Should get cookies after delete and set from initials", () => {
    const cookies = new Cookies({ color: "red", fruit: "pear" });
    cookies.set("drink", "soda");
    cookies.delete("color");
    cookies.set("color", "magenta");

    expect(cookies.get("color")).toStrictEqual("magenta");
    expect(cookies.get("fruit")).toStrictEqual("pear");
    expect(cookies.get("drink")).toStrictEqual("soda");
  });
});
