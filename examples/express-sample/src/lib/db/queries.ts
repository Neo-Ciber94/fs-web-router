import { db } from ".";
import { ApplicationError } from "../error";
import type { Post, Category } from "./types";

type JsonString = string;

interface PostRow {
  id: string;
  content: string;
  categoryId?: string;
  createdAt: string;
  updatedAt: string;
}

interface PostWithCategoryRow {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  categoryId?: string;
  category?: JsonString;
}

interface GetAllPostsArgs {
  category?: string;
  limit?: number;
}

export async function getAllPosts(args?: GetAllPostsArgs) {
  const whereConditions: string[] = [];

  if (args?.category) {
    whereConditions.push(`c.name LIKE :categoryName`);
  }

  const whereSql =
    whereConditions.length === 0 ? "1 = 1" : whereConditions.map((w) => `(${w})`).join(" AND ");

  const sql = `
    SELECT 
      post.id, 
      post.content, 
      post.createdAt, 
      post.updatedAt,
      post.categoryId,
      (CASE
        WHEN post.categoryId IS NOT NULL THEN json_object(
          'id', c.id,
          'name', c.name
        )
        ELSE NULL
      END) as category
    FROM post 
    LEFT JOIN category c ON c.id = post.categoryId
    WHERE ${whereSql}
    ${args?.limit && args?.limit > 0 ? `LIMIT :limit` : ""}
    `;

  const result = await db.all<PostWithCategoryRow[]>(sql, {
    ":categoryName": args?.category,
    ":limit": args?.limit,
  });

  return result.map(mapEntityToPostWithCategory);
}

export async function getPost(postId: string) {
  const post = await db.get<PostRow>(
    `SELECT 
        post.id, 
        post.content, 
        post.createdAt, 
        post.updatedAt,
        post.categoryId,
        (CASE
            WHEN post.categoryId IS NOT NULL THEN json_object(
            'id', c.id,
            'name', c.name
            )
            ELSE NULL
        END) as category
        FROM post 
        LEFT JOIN category c ON c.id = post.categoryId
        WHERE post.id = ?`,
    postId
  );

  if (!post) {
    return null;
  }

  return mapEntityToPostWithCategory(post);
}

export async function createPost(post: Pick<Post, "content"> & { categoryId: string }) {
  const newPost: Post = {
    id: crypto.randomUUID(),
    content: post.content,
    createdAt: new Date(),
    updatedAt: new Date(),
    categoryId: post.categoryId,
  };

  await db.exec("BEGIN TRANSACTION;");

  try {
    await checkCategoryExists(post.categoryId);

    await db.run(
      "INSERT INTO post (id, content, createdAt, updatedAt, categoryId) VALUES (?, ?, ?, ?, ?)",
      newPost.id,
      newPost.content,
      newPost.createdAt,
      newPost.updatedAt,
      newPost.categoryId
    );

    await db.exec("COMMIT TRANSACTION;");

    return newPost;
  } catch (err) {
    await db.exec("ROLLBACK TRANSACTION;");
    throw err;
  }
}

export async function updatePost(
  post: Pick<Post, "id"> & Partial<Pick<Post, "content" | "categoryId">>
) {
  await db.exec("BEGIN TRANSACTION;");

  try {
    const postToUpdate = await db.get<PostRow>(
      `SELECT id, content, categoryId, createdAt, updatedAt 
      FROM post 
      WHERE post.id = ?`,
      post.id
    );

    if (!postToUpdate) {
      return null;
    }

    postToUpdate.content = post.content ?? postToUpdate.content;
    postToUpdate.categoryId = post.categoryId ?? postToUpdate.categoryId;

    await db.run(
      `UPDATE post 
      SET content = ?, categoryId = ?, updatedAt = ?
      WHERE post.id = ?`,
      postToUpdate.content,
      postToUpdate.categoryId,
      new Date().toISOString(),
      post.id
    );

    await db.exec("COMMIT TRANSACTION;");

    return postToUpdate;
  } catch (err) {
    await db.exec("ROLLBACK TRANSACTION;");
    throw err;
  }
}

export async function deletePost(postId: string) {
  await db.exec("BEGIN TRANSACTION;");

  try {
    const postToDelete = await db.get<PostRow>(
      `SELECT id, content, categoryId, createdAt, updatedAt 
      FROM post 
      WHERE post.id = ?`,
      postId
    );

    if (!postToDelete) {
      return null;
    }

    await db.run("DELETE FROM post WHERE id = ?", postId);
    await db.exec("COMMIT TRANSACTION;");
    return mapEntityToPost(postToDelete);
  } catch (err) {
    await db.exec("ROLLBACK TRANSACTION;");
    throw err;
  }
}

export async function getAllCategories() {
  const result = await db.all<{ id: string; name: string }[]>("SELECT * FROM category");
  return result;
}

export async function createCategory(name: string) {
  const newCategory: Category = {
    id: crypto.randomUUID(),
    name,
  };

  await db.exec("BEGIN TRANSACTION;");

  try {
    await db.run(
      "INSERT INTO category (id, name) VALUES (?, ?, ?, ?, ?)",
      newCategory.id,
      newCategory.name
    );

    await db.exec("COMMIT TRANSACTION;");

    return newCategory;
  } catch (err) {
    await db.exec("ROLLBACK TRANSACTION;");
    throw err;
  }
}

function mapEntityToPost(entity: PostRow): Post {
  return {
    ...entity,
    createdAt: new Date(entity.createdAt),
    updatedAt: new Date(entity.updatedAt),
  };
}

function mapEntityToPostWithCategory(entity: PostWithCategoryRow): Post {
  return {
    id: entity.id,
    content: entity.content,
    createdAt: new Date(entity.createdAt),
    updatedAt: new Date(entity.updatedAt),
    categoryId: entity.categoryId,
    category: entity.category ? JSON.parse(entity.category) : undefined,
  };
}

async function checkCategoryExists(categoryId: string) {
  if (!categoryId) {
    return;
  }

  const categoryExists = await db
    .get<{ count: number }>("SELECT COUNT(*) FROM category WHERE id = ?", categoryId)
    .then((x) => Boolean(x?.count));

  if (!categoryExists) {
    throw new ApplicationError("Category don't exists", { status: 404 });
  }
}
