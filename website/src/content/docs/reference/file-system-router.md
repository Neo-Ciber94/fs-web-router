---
title: Configuring the FileSystemRouter
description: The file system router
---

## `FileSystemRouterOptions`

Here is an extended example on how to configure the file system router.

### origin

- `origin`: Origin used for the request, by default uses the `process.env.ORIGIN`. On the web version, this is not needed because the `origin` is determined from the request.

```ts
import { fileSystemRouter } from "keiro/node";
import http from "node:http";

http
  .createServer(
    fileSystemRouter({
      origin: "http://example.com",
    }),
  )
  .listen(3000);
```

### cwd

- `cwd`: The absolute path of the working directory, defaults to `process.cwd()`.

```ts
import { fileSystemRouter } from "keiro/node";
import http from "node:http";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

http
  .createServer(
    fileSystemRouter({
      cwd: path.join(__dirname, "../packages/api"),
    }),
  )
  .listen(3000);
```

### routesDir

- `routesDir`: The path where the routes are located, relative to the `cwd`, defaults to `src/routes/`.

```ts
import { fileSystemRouter } from "keiro/node";
import http from "node:http";

http
  .createServer(
    fileSystemRouter({
      routesDir: "src/routes/api",
    }),
  )
  .listen(3000);
```

### middleware

- `middleware`: The name of the middleware, defaults to `middleware`.

```ts
import { fileSystemRouter } from "keiro/node";
import http from "node:http";

http
  .createServer(
    fileSystemRouter({
      middleware: "hook",
    }),
  )
  .listen(3000);
```

### notFound

- `notFound`: The name of the file used for 404 handling, defaults to `404`.

```ts
import { fileSystemRouter } from "keiro/node";
import http from "node:http";

http
  .createServer(
    fileSystemRouter({
      notFound: "not-found",
    }),
  )
  .listen(3000);
```

### prefix

- `prefix`: A prefix used for all the routes.

```ts
import { fileSystemRouter } from "keiro/node";
import http from "node:http";

http
  .createServer(
    fileSystemRouter({
      prefix: "/api",
    }),
  )
  .listen(3000);
```

### routeMapper

- `routeMapper`: A class that maps a file-system path to a route, the default uses a `NextJS` like routing.

```ts
import { fileSystemRouter } from "keiro/node";
import http from "node:http";
import { SvelteKitRouteMapper } from "./mapper";

http
  .createServer(
    fileSystemRouter({
      routeMapper: new SvelteKitRouteMapper(),
    }),
  )
  .listen(3000);
```

### extensions

- `extensions`: Extensions of valid routes, defaults to `["js", "jsx", "cjs", "mjs", "ts", "tsx", "cts", "mts"]`.

```ts
import { fileSystemRouter } from "keiro/node";
import http from "node:http";

http
  .createServer(
    fileSystemRouter({
      extensions: ["ts", "tsx"],
    }),
  )
  .listen(3000);
```

### ignorePrefix

- `ignorePrefix`: A prefix used for ignore files or directories, defaults to `_`.

```ts
import { fileSystemRouter } from "keiro/node";
import http from "node:http";

http
  .createServer(
    fileSystemRouter({
      ignorePrefix: "~",
    }),
  )
  .listen(3000);
```

### ignoreFiles

- `ignoreFiles`: A glob of files to ignore.

```ts
import { fileSystemRouter } from "keiro/node";
import http from "node:http";

http
  .createServer(
    fileSystemRouter({
      ignoreFiles: "**/*.test.ts",
    }),
  )
  .listen(3000);
```

### getLocals

- `getLocals`: A function to initialize the request locals, this runs even before the middleware.

```ts
import { fileSystemRouter } from "keiro/node";
import http from "node:http";

http
  .createServer(
    fileSystemRouter({
      async getLocals() {
        return { time: new Date() };
      },
    }),
  )
  .listen(3000);
```

### workers

- `workers`: Controls the worker threads, by default this is not enabled.

You can pass `true` which will spawn workers threads up to the number of logical processors,
or specify a number of workers. This workers are spawned in a pool and reused.

```ts
import { fileSystemRouter } from "keiro/node";
import http from "node:http";

http
  .createServer(
    fileSystemRouter({
      workers: { workerCount: 4 },
    }),
  )
  .listen(3000);
```
