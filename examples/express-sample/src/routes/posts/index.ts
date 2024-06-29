import { createPost, getAllPosts, updatePost } from "@/lib/db/queries";
import { ApplicationError } from "@/lib/error";
import { defineHandler } from "keiro";

export const GET = defineHandler(async ({ url }) => {
  const limitQuery = url.searchParams.get("limit");
  const categoryQuery = url.searchParams.get("category");

  const limit = limitQuery && !Number.isNaN(limitQuery) ? parseInt(limitQuery) : undefined;
  const category =
    categoryQuery && categoryQuery.trim().length > 0 ? categoryQuery.trim() : undefined;

  const result = await getAllPosts({ category, limit });
  return Response.json(result);
});

export const POST = defineHandler(async (event) => {
  const json = await event.request.json();

  if (!json) {
    throw new ApplicationError("Empty post");
  }

  if (typeof json.content !== "string") {
    throw new ApplicationError("post.content must be a string");
  }

  if (json.categoryId) {
    if (typeof json.categoryId !== "string") {
      throw new ApplicationError("post.categoryId must be a string");
    }
  }

  const result = await createPost({ content: json.content, categoryId: json.categoryId });

  return Response.json(result, {
    status: 201,
    headers: {
      Location: `${event.url.href}/${result.id}`,
    },
  });
});

export const PUT = defineHandler(async (event) => {
  const json = await event.request.json();

  if (!json) {
    throw new ApplicationError("Empty post");
  }

  if (typeof json.id !== "string") {
    throw new ApplicationError("post.id must be a string");
  }

  if (json.content) {
    if (typeof json.content !== "string") {
      throw new ApplicationError("post.content must be a string");
    }
  }

  if (json.categoryId) {
    if (typeof json.categoryId !== "string") {
      throw new ApplicationError("post.categoryId must be a string");
    }
  }

  const result = await updatePost({ id: json.id, categoryId: json.categoryId });

  if (!result) {
    return Response.json({ error: "Posts not found" }, { status: 404 });
  }

  return Response.json(result, {
    status: 200,
  });
});
