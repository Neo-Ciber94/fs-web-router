import { db } from ".";
import { Category, Post } from "./types";

async function seedCategories() {
  const categories: Category[] = [
    { id: crypto.randomUUID(), name: "Technology" },
    { id: crypto.randomUUID(), name: "Science" },
    { id: crypto.randomUUID(), name: "Art" },
    { id: crypto.randomUUID(), name: "Politics" },
    { id: crypto.randomUUID(), name: "Travel" },
    { id: crypto.randomUUID(), name: "Fashion" },
    { id: crypto.randomUUID(), name: "Food" },
    { id: crypto.randomUUID(), name: "Health" },
    { id: crypto.randomUUID(), name: "Sports" },
    { id: crypto.randomUUID(), name: "Music" },
    { id: crypto.randomUUID(), name: "Books" },
    { id: crypto.randomUUID(), name: "History" },
    { id: crypto.randomUUID(), name: "Business" },
    { id: crypto.randomUUID(), name: "Education" },
    { id: crypto.randomUUID(), name: "Environment" },
    { id: crypto.randomUUID(), name: "Gaming" },
    { id: crypto.randomUUID(), name: "Movies" },
    { id: crypto.randomUUID(), name: "Pets" },
    { id: crypto.randomUUID(), name: "Photography" },
    { id: crypto.randomUUID(), name: "Design" },
  ];

  // insert categories
  for (const category of categories) {
    await db.run("INSERT INTO category (id, name) VALUES (?, ?)", category.id, category.name);
  }

  return categories;
}

async function seedPosts(categories: Category[]) {
  function createPost(content: string, categoryName: string): Post {
    const category = categories.find((x) => x.name === categoryName);

    if (!category) {
      throw new Error("Category not found: " + categoryName);
    }

    return {
      id: crypto.randomUUID(),
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
      categoryId: category.id,
    };
  }

  const posts: Post[] = [
    createPost("New breakthrough in AI research.", "Technology"),
    createPost("Exploring the mysteries of black holes.", "Science"),
    createPost("Analysis of Picasso's Blue Period.", "Art"),
    createPost("Current political landscape in Europe.", "Politics"),
    createPost("Top destinations to visit in Southeast Asia.", "Travel"),
    createPost("Latest fashion trends for summer 2024.", "Fashion"),
    createPost("Delicious recipes using seasonal ingredients.", "Food"),
    createPost("Tips for maintaining a healthy lifestyle.", "Health"),
    createPost("Recap of the NBA finals.", "Sports"),
    createPost("Review of the latest album by Taylor Swift.", "Music"),
    createPost("Must-read books of the year.", "Books"),
    createPost("Key events in ancient Roman history.", "History"),
    createPost("Startup strategies for sustainable growth.", "Business"),
    createPost("Innovative approaches in modern education.", "Education"),
    createPost("Impact of climate change on marine ecosystems.", "Environment"),
    createPost("Top gaming laptops for gamers.", "Gaming"),
    createPost("Analysis of the summer blockbuster movies.", "Movies"),
    createPost("Choosing the right pet for your lifestyle.", "Pets"),
    createPost("Capturing stunning landscapes through photography.", "Photography"),
    createPost("Design principles for user-friendly interfaces.", "Design"),
    createPost("Future of autonomous vehicles.", "Technology"),
    createPost("Advancements in quantum computing.", "Science"),
    createPost("Interpreting contemporary art trends.", "Art"),
    createPost("Global perspectives on climate change policies.", "Politics"),
    createPost("Hidden gems in European travel.", "Travel"),
    createPost("Eco-friendly fashion choices.", "Fashion"),
    createPost("Plant-based recipes for a healthier diet.", "Food"),
    createPost("Mindfulness techniques for stress relief.", "Health"),
    createPost("Recap of the World Cup matches.", "Sports"),
    createPost("Evolution of jazz music.", "Music"),
    createPost("Classic literature recommendations.", "Books"),
    createPost("Ancient civilizations: Egypt and Mesopotamia.", "History"),
    createPost("Strategies for scaling tech startups.", "Business"),
    createPost("Challenges in modern education systems.", "Education"),
    createPost("Conservation efforts in the Amazon rainforest.", "Environment"),
    createPost("Top RPG games of all time.", "Gaming"),
    createPost("Critique of recent sci-fi movies.", "Movies"),
    createPost("Choosing the best dog breed for families.", "Pets"),
    createPost("Mastering portrait photography techniques.", "Photography"),
    createPost("Minimalist design principles.", "Design"),
  ];

  // Insert posts
  for (const post of posts) {
    await db.run(
      `INSERT INTO post (id, content, categoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
      post.id,
      post.content,
      post.categoryId,
      post.createdAt.toISOString(),
      post.updatedAt.toISOString()
    );
  }

  return posts;
}

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

await seedDatabase();
