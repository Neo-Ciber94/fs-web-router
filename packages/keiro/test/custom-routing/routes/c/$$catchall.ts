import { defineHandler } from "../../../../src";

export default defineHandler(({ params }) => {
  return new Response(`catchall route: /c/${params.catchall}`);
});
