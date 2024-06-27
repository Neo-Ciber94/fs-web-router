// import "tsx/esm";
// import polka from "polka";
// import fileSystemRouter from "winter-router/node";

// declare module "winter-router/types" {
//   interface Register {
//     Locals: {
//       num: number;
//     };
//   }
// }

// const useWorker = process.argv.some((s) => s === "--use-workers");
// const portArg = (() => {
//   const idx = process.argv.indexOf("--port");
//   return idx >= 0 ? process.argv[idx + 1] : null;
// })();
// const port = Number(process.env.PORT ?? portArg ?? 5000);
// const origin = `http://localhost:${port}`;

// const app = polka();

// app.use(
//   fileSystemRouter({
//     origin,
//     middleware: false,
//     workers: useWorker,
//     initializeLocals() {
//       return {
//         num: 1,
//       };
//     },
//   })
// );

// app.listen(port, () => {
//   console.log(`Listening on ${origin}`);
// });
