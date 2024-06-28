import { deletePost, getPost } from "@/lib/db/queries";
import { defineHandler } from "winter-router";

export const GET = defineHandler(async ({ params }) => {
  const postId = params.post_id;

  if (!postId) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  const result = await getPost(postId);

  if (!result) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  return Response.json(result);
});

export const DELETE = defineHandler(async ({ params }) => {
  const postId = params.post_id;

  if (!postId) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  const result = await deletePost(postId);

  if (!result) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  return Response.json(result);
});
