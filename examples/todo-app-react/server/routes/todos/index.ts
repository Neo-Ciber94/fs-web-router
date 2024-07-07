import type { RequestHandler } from "keiro/types";
import { type Todo, DB } from "@server/lib/todos";

export const GET: RequestHandler = () => {
  const items = Array.from(DB.values()).reverse();
  return Response.json(items);
};

export const POST: RequestHandler = async (event) => {
  const formData = await event.request.formData();

  const description = formData.get("description");

  if (typeof description !== "string") {
    return Response.json({ error: "description is required" }, { status: 400 });
  }

  const todo: Todo = {
    id: crypto.randomUUID(),
    description,
    done: false,
  };

  DB.set(todo.id, todo);

  return Response.json(todo, {
    status: 201,
  });
};
