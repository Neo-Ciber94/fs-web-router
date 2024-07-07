import type { RequestHandler } from "keiro/types";
import { DB } from "@/lib/todos";

export const PUT: RequestHandler = async (event) => {
  const todoId = event.params.todo_id;

  if (!todoId) {
    return Response.json(null, { status: 404 });
  }

  const formData = await event.request.formData();
  const description = String(formData.get("description") ?? "");
  const done = formData.get("done") === "true";

  const todo = DB.get(todoId);
  if (!todo) {
    return Response.json(null, { status: 404 });
  }

  const newTodo = { id: todo.id, description, done };

  if (todo) {
    DB.set(todo.id, newTodo);
  }

  return Response.json(newTodo);
};

export const DELETE: RequestHandler = async (event) => {
  const todoId = event.params.todo_id;

  if (!todoId) {
    return Response.json(null, { status: 404 });
  }

  if (DB.delete(todoId)) {
    return Response.json(null, { status: 200 });
  }

  return Response.json(null, { status: 404 });
};
