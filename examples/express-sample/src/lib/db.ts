export interface Post {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

class PostService {
  #db = new Map<string, Post>();

  all() {
    const posts = Array.from(this.#db.values());
    return Promise.resolve(posts);
  }

  get(postId: string) {
    const post = this.#db.get(postId);
    return Promise.resolve(post == null ? null : post);
  }

  create(post: Pick<Post, "content">) {
    const newPost: Post = {
      id: crypto.randomUUID(),
      content: post.content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.#db.set(newPost.id, newPost);
    console.log(this.#db);
    return Promise.resolve(newPost);
  }

  update(post: Pick<Post, "id" | "content">) {
    const postToUpdate = this.#db.get(post.id);

    if (!postToUpdate) {
      return null;
    }

    postToUpdate.content = post.content;
    postToUpdate.updatedAt = new Date();
    return Promise.resolve(postToUpdate);
  }

  delete(postId: string) {
    const postToDelete = this.#db.get(postId);

    if (!postToDelete) {
      return null;
    }

    this.#db.delete(postId);
    return Promise.resolve(postToDelete);
  }
}

export const posts = new PostService();
