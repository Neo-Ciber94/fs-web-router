import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import TodoList from "./components/TodoList";
import AddTodoForm from "./components/AddTodoForm";

export default function App() {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="todo__container">
        <h1>Todo</h1>
        <AddTodoForm />
        <TodoList />
      </div>
    </QueryClientProvider>
  );
}
