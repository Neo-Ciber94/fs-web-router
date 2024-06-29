import { defineHandler } from "../../../../../../../src/index.js";

export default defineHandler(({ params }) => {
  return Response.json(params);
});
