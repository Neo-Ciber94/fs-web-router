import { useQueryClient } from "@tanstack/react-query";
import React, { useRef } from "react";
import { fetchJSON } from "../lib";

export default function AddTodoForm() {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    try {
      await fetchJSON("/api/todos", {
        method: "POST",
        body: formData,
      });

      formRef.current?.reset();
      void queryClient.invalidateQueries();
    } catch (err) {
      console.error(err);
      alert("Failed to add todo");
    }
  };

  return (
    <form ref={formRef} className="todo__card todo__form" onSubmit={handleSubmit}>
      <input type="text" name="description" placeholder="What you would like to do?" required />
      <button className="button__primary">Create</button>
    </form>
  );
}
