import polka from "polka";
import fileSystemRouter from "fs-router/node";

const port = Number(process.env.PORT || 5000);
const origin = `http://localhost:${port}`;

const app = polka();

app.use(fileSystemRouter({ origin }));

app.listen(port, () => {
  console.log(`Listening on ${origin}`);
});
