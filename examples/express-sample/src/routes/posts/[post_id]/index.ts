import { deletePost, getPost } from "@/lib/db/queries";
import { defineHandler } from "winter-router";

export const GET = defineHandler(async ({ params }) => {
  const result = await getPost(String(params.id));

  if (!result) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  return Response.json(result);
});

export const DELETE = defineHandler(async ({ params }) => {
  const result = await deletePost(String(params.id));

  if (!result) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  return Response.json(result);
});
