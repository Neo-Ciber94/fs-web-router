import { db } from ".";
import { Category, Post } from "./types";
import { faker } from "@faker-js/faker";

async function seedDatabase() {
  console.log("⌛ Seeding database...");
  const result = await db.get<{ count: number }>("SELECT count(*) as count FROM post");

  if (result?.count) {
    console.log(`⚠️ Database already have ${result.count} posts, aborting`);
    return;
  }

  await db.exec("BEGIN TRANSACTION;");

  try {
    const categories = await seedCategories();
    const posts = await seedPosts(categories);

    await db.exec("COMMIT TRANSACTION;");

    console.log(`✅ ${posts.length} posts were added successfully`);
    console.log(`✅ ${categories.length} categories were added successfully`);
  } catch (err) {
    console.error("❌ Failed to seed database", err);
    await db.exec("ROLLBACK TRANSACTION;");
  }
}

async function seedCategories() {
  const categories: Category[] = faker.helpers.multiple(createRandomCategory, { count: 20 });

  function createRandomCategory(): Category {
    return {
      id: crypto.randomUUID(),
      name: faker.word.adjective(),
    };
  }

  // insert categories
  for (const category of categories) {
    await db.run("INSERT INTO category (id, name) VALUES (?, ?)", category.id, category.name);
  }

  return categories;
}

async function seedPosts(categories: Category[]) {
  function createRandomPost(): Post {
    const createdAt = faker.date.anytime();

    // We only mark the 30% of the posts as updated
    const isUpdated = faker.number.int(100) <= 30;

    return {
      id: crypto.randomUUID(),
      content: faker.lorem.paragraphs({ min: 1, max: 5 }),
      createdAt,
      updatedAt: isUpdated ? faker.date.future({ refDate: createdAt }) : createdAt,
    };
  }

  const posts: Post[] = faker.helpers.multiple(createRandomPost, { count: 100 });

  // Insert posts
  for (const post of posts) {
    const hasCategory = Math.random() > 0.2;
    const category = hasCategory ? categories[Math.floor(Math.random() * categories.length)] : null;

    await db.run(
      `INSERT INTO post (id, content, categoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
      post.id,
      post.content,
      category?.id,
      post.createdAt.toISOString(),
      post.updatedAt.toISOString()
    );
  }

  return posts;
}

await seedDatabase();
