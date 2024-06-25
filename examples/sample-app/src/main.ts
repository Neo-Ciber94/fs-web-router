import polka from "polka";
import fileSystemRouter from "fs-router/node";

declare module "fs-router/types" {
  interface Register {
    Locals: {
      num: number;
    };
  }
}

const port = Number(process.env.PORT || 5000);
const origin = `http://localhost:${port}`;

const app = polka();

app.use(
  fileSystemRouter({
    origin,
    initializeLocals() {
      return {
        num: 1,
      };
    },
  })
);

app.listen(port, () => {
  console.log(`Listening on ${origin}`);
});
