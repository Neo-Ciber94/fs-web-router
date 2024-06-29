import { defineHandler } from "../../../src/index.js";

export const GET = defineHandler(({ cookies }) => {
  cookies.delete("color");
  cookies.set("fruit", "orange");
  cookies.delete("orange");
  cookies.set("language", "javascript");

  cookies.set("character", "Gojo");
  cookies.delete("character");
  return new Response();
});
