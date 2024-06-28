export interface Post {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  categoryId?: string;
  category?: Category;
}

export interface Category {
  id: string;
  name: string;
}
