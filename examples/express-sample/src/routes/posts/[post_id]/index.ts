import { defineHandler } from "winter-router";
import { posts } from "@/lib/db";

export const GET = defineHandler(async ({ params }) => {
  const result = await posts.get(String(params.post_id));

  if (!result) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  return Response.json(result);
});

export const DELETE = defineHandler(async ({ params }) => {
  const result = await posts.delete(String(params.post_id));

  if (!result) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  return Response.json(result);
});
