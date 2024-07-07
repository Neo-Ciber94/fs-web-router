import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJSON } from "../lib";
import { type Todo } from "@server/lib/todos";

export default function TodoList() {
  const { data, isLoading, error } = useQuery<Todo[]>({
    queryKey: ["todos"],
    queryFn: () => fetchJSON("/api/todos") as Promise<Todo[]>,
  });

  return (
    <ul className="todo__card todo__list">
      {isLoading && <TodoListLoading />}
      {error && <TodoListError error={error} />}
      {!isLoading && (
        <>
          {data && data.length > 0 ? (
            data.map((todo) => <TodoListItem todo={todo} key={todo.id} />)
          ) : (
            <TodoListEmpty />
          )}
        </>
      )}
    </ul>
  );
}

function TodoListItem({ todo }: { todo: Todo }) {
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this todo?")) {
      return;
    }

    try {
      await fetchJSON(`/api/todos/${todo.id}`, {
        method: "DELETE",
      });

      void queryClient.invalidateQueries();
    } catch (err) {
      console.error(err);
      alert("Failed to delete todo");
    }
  };

  const handleUpdateTodo = async (input: Todo) => {
    const formData = new FormData();
    formData.set("id", input.id);
    formData.set("description", input.description);
    formData.set("done", input.done.toString());

    try {
      await fetchJSON(`/api/todos/${input.id}`, {
        method: "PUT",
        body: formData,
      });

      void queryClient.invalidateQueries();
    } catch (err) {
      console.error(err);
      alert("Failed to delete todo");
    }
  };

  return (
    <li>
      <div className="todo__item">
        <input
          type="checkbox"
          name="done"
          defaultChecked={todo.done}
          onChange={(ev) => handleUpdateTodo({ ...todo, done: ev.currentTarget.checked })}
        />
        <input
          className="todo__item__description"
          name="description"
          defaultValue={todo.description}
          onChange={(ev) => handleUpdateTodo({ ...todo, description: ev.currentTarget.value })}
        />
        <div className="todo__item__actions">
          <button data-action="delete" className="button__danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}

function TodoListLoading() {
  return (
    <li>
      <p className="todo__list__label">🕒 Loading...</p>
    </li>
  );
}

function TodoListEmpty() {
  return (
    <li>
      <p className="todo__list__label">No Todos Found</p>
    </li>
  );
}

function TodoListError({ error }: { error: Error }) {
  return (
    <li>
      <p className="todo__list__label">❌ {error.message}</p>
    </li>
  );
}
