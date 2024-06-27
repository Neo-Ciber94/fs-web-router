import { defineHandler } from "winter-router";
import { posts } from "../lib/db";

export const GET = defineHandler(async () => {
  const result = await posts.all();
  return Response.json(result);
});

export const POST = defineHandler(async (event) => {
  const json = await event.request.json();

  if (!json) {
    return Response.json({ error: "Empty body" }, { status: 404 });
  }

  if (typeof json.content !== "string") {
    return Response.json({ error: "$.content is not an string" }, { status: 404 });
  }

  const result = await posts.create({ content: json.content });
  return Response.json(result, {
    status: 201,
    headers: {
      Location: `/${result.id}`,
    },
  });
});

export const PUT = defineHandler(async (event) => {
  const json = await event.request.json();

  if (!json) {
    return Response.json({ error: "Empty body" }, { status: 404 });
  }

  if (typeof json.id !== "string") {
    return Response.json({ error: "$.id is not an string" }, { status: 404 });
  }

  if (typeof json.content !== "string") {
    return Response.json({ error: "$.content is not an string" }, { status: 404 });
  }

  const result = await posts.update({ id: json.id, content: json.content });

  if (!result) {
    return Response.json({ error: "Posts not found" }, { status: 404 });
  }

  return Response.json(result, {
    status: 200,
  });
});
