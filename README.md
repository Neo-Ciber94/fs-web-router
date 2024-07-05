# keiro

[![CI](https://github.com/Neo-Ciber94/keiro/actions/workflows/ci.yml/badge.svg)](https://github.com/Neo-Ciber94/keiro/actions/workflows/ci.yml)

A file-system router compatible with [WinterGC](https://wintercg.org/).

## ⚡ Features

- Middlewares
- Request Locals
- Worker Threads

## 📖 Check out the [Docs](https://neo-ciber94.github.io/keiro/) 

## 📦 Examples

```ts
// src/routes/index.ts
import { defineHandler } from "keiro";

export default defineHandler(() => {
  return new Response("Hello World");
});
```

### 🐢 Node

```ts
// src/main.ts
import express from "express";
import { fileSystemRouter } from "keiro/node";

const port = Number(process.env.PORT ?? 5022);
const origin = `http://localhost:${port}`;

const app = express();
app.use(fileSystemRouter({ origin }));

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
```

### 🌐 Web

```ts
// src/main.ts
import { fileSystemRouter } from "keiro/web";

const port = Number(process.env.PORT ?? 5021);

const server = Bun.serve({
  port,
  fetch: fileSystemRouter(),
});

console.log(`Listening on http://${server.hostname}:${server.port}`);
```
