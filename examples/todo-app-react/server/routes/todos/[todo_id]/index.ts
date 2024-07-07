import type { RequestHandler } from "keiro/types";
import { DB } from "@server/lib/todos";

export const PUT: RequestHandler = async (event) => {
  const todoId = event.params.todo_id;

  if (!todoId) {
    return Response.json(null, { status: 404 });
  }

  const formData = await event.request.formData();
  const description = String(formData.get("description") ?? "");
  const done = formData.get("done") === "true";

  const todo = DB.get(todoId);

  if (todo) {
    DB.set(todo.id, { id: todo.id, description, done });
  }

  return new Response(null, {
    status: 303,
    headers: {
      location: "/",
    },
  });
};

export const DELETE: RequestHandler = async (event) => {
  const todoId = event.params.todo_id;

  if (!todoId) {
    return Response.json(null, { status: 404 });
  }

  if (DB.has(todoId)) {
    DB.delete(todoId);
  }

  return new Response(null, {
    status: 303,
    headers: {
      location: "/",
    },
  });
};
