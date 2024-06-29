# keiro

A file-system router compatible with [WinterGC](https://wintercg.org/).

## Features

- Middlewares
- Request Locals
- Worker Threads

## Web

```ts
// src/main.ts
import express from "express";
import { fileSystemRouter } from "keiro/web";

const port = Number(process.env.PORT ?? 5000);

const app = express();
app.use(fileSystemRouter());

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});

// src/routes/index.ts
import { defineHandler } from "keiro";

export default defineHandler(() => {
  return new Response("Hello World");
});
```

## Node

```ts
// src/main.ts
import express from "express";
import { fileSystemRouter } from "keiro/node";

const port = Number(process.env.PORT ?? 5000);
const origin = `http://localhost:${port}`;

const app = express();
app.use(fileSystemRouter({ origin }));

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});

// src/routes/index.ts
import { defineHandler } from "keiro";

export default defineHandler(() => {
  return new Response("Hello World");
});
```
