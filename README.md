# web-fs-router

A file-system routing compatible with [WinterGC](https://wintercg.org/).

## Features

- Middlewares
- Request Locals
- Worker Threads

## Web

```ts
// src/main.ts
import express from "express";
import fileSystemRouter from "fs-router/node";

const app = express();
app.use(fileSystemRouter());

app.listen(5000, () => {
  console.log("Listening on http://localhost:5000");
});

// src/routes/index.ts
import { defineHandler } from "fs-router";

export default defineHandler(() => {
  return new Response("Hello World");
});
```

## Node

```ts
// src/main.ts
import express from "express";
import fileSystemRouter from "fs-router/node";

const app = express();
app.use(fileSystemRouter());

app.listen(5000, () => {
  console.log("Listening on http://localhost:5000");
});

// src/routes/index.ts
import { defineHandler } from "fs-router";

export default defineHandler(() => {
  return new Response("Hello World");
});
```
