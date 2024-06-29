import { defineHandler } from "../../../../../src/index.js";

export const GET = defineHandler(() => {
  return new Response("get 1");
});

export const POST = defineHandler(() => {
  return new Response("post 1");
});

export const PUT = defineHandler(() => {
  return new Response("put 1");
});

export const PATCH = defineHandler(() => {
  return new Response("patch 1");
});

export const DELETE = defineHandler(() => {
  return new Response("delete 1");
});

export const HEAD = defineHandler(() => {
  return new Response(null, { headers: { data: "head 1" } });
});

export const OPTIONS = defineHandler(() => {
  return new Response("options 1");
});
