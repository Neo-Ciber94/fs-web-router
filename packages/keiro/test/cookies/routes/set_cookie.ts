import { defineHandler } from "../../../src/index.js";

export const GET = defineHandler(({ cookies }) => {
  cookies.set("fruit", "apple");
  cookies.set("color", "purple");
  cookies.set("character", "Ryuji Ayukawa");
  return new Response();
});
