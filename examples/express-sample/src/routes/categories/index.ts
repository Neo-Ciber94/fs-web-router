import { createCategory, getAllCategories } from "@/lib/db/queries";
import { ApplicationError } from "@/lib/error";
import { defineHandler } from "keiro";

export const POST = defineHandler(async ({ request }) => {
  const json = await request.json();

  if (typeof json.name !== "string") {
    throw new ApplicationError("category.name must be a string");
  }

  const category = await createCategory(json.name);
  return Response.json(category);
});

export const GET = defineHandler(async () => {
  const result = await getAllCategories();
  return Response.json(result);
});
