export interface Todo {
  id: string;
  description: string;
  done: boolean;
}

export const DB = new Map<string, Todo>();
