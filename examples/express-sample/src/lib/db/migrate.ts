import path from "path";
import { db } from ".";

await db.migrate({
  migrationsPath: path.join(process.cwd(), "migrations"),
});
