import fs from "node:fs/promises";

await fs.copyFile("../../README.md", "README.md");
await fs.copyFile("../../LICENSE", "LICENSE.md");
