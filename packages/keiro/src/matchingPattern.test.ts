import { nextJsPatternMatching } from "./matchingPattern";

describe("Default pattern matching", () => {
  test("Match dynamic segment", () => {
    const matching = nextJsPatternMatching();

    expect(matching.matchDynamic("[id]", [])).toStrictEqual("id");
    expect(matching.matchDynamic("hello", [])).toBeFalsy();
  });

  test("Match catch-all segment", () => {
    const matching = nextJsPatternMatching();

    expect(matching.matchCatchAll("[...params]", [])).toStrictEqual("params");
    expect(matching.matchCatchAll("hello", [])).toBeFalsy();
  });

  test("Match optional dynamic segment", () => {
    const matching = nextJsPatternMatching();

    expect(matching.matchOptionalDynamic("[[id]]", [])).toStrictEqual("id");
    expect(matching.matchCatchAll("hello", [])).toBeFalsy();
  });

  test("Match optional catch-all segment", () => {
    const matching = nextJsPatternMatching();

    expect(matching.matchOptionalCatchAll("[[...params]]", [])).toStrictEqual(
      "params"
    );
    expect(matching.matchCatchAll("hello", [])).toBeFalsy();
  });
});
