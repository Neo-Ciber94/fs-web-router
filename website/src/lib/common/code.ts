export const NODE_SAMPLE_CODE = `
import { fileSystemRouter } from "keiro/node";
import http from "node:http";

const port = 5000;
const origin = \`http://localhost:\${port}\`;

const server = http.createServer(fileSystemRouter({ origin }));
server.listen(port, () => console.log(\`Listening on \${origin}\`));
`;

export const DENO_SAMPLE_CODE = `
import { fileSystemRouter } from "keiro/web";

Deno.serve({
  handler: fileSystemRouter(),
  onListen(addr) {
    console.log(\`Listening on http://\${addr.hostname}:\${addr.port}\`);
  },
});
`;

export const BUN_SAMPLE_CODE = `
import { fileSystemRouter } from "keiro/web";

const server = Bun.serve({
  fetch: fileSystemRouter(),
});

console.log(\`Listening on http://\${server.hostname}:\${server.port}\`);
`;

export const API_HANDLER_CODE = `
import { defineHandler } from "keiro";

export default defineHandler(() => {
    return Response.json({
        hello: "world"
    })
})
`;
