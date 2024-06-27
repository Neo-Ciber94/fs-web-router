import express from "express";
import fileSystemRouter from "winter-router/node";

const port = Number(process.env.PORT ?? 5000);
const origin = `http://localhost:${port}`;

const app = express();

app.use(fileSystemRouter({ origin }));

app.listen(port, () => {
  console.log(`Listening on ${origin}`);
});
