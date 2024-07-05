import polka from "polka";
import { fileSystemRouter } from "keiro/node";

const port = 6000;
const origin = `http://localhost:${port}`;

const app = polka();
app.use(fileSystemRouter({ origin }));
app.listen(port, () => console.log(`Listening on ${origin}`));
