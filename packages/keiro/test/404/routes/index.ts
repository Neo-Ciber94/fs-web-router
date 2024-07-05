import type { RequestHandler } from "../../../src/types";

export const GET: RequestHandler = () => {
  return new Response("Hello there!");
};
