import { delay } from "@/lib/utils";
import { defineHandler } from "keiro";

export default defineHandler(async () => {
  await delay(5000);
  return new Response("Done!");
});
