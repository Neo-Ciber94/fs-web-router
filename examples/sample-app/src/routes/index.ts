import { defineHandler } from "fs-router";
import { doWork } from "../lib/doWork";

export default defineHandler(async () => {
  await doWork(1000_000);
  return new Response("Hello World");
});
