import net from "node:net";

const MAX_PORT_NUMBER = 1 << 16;

export async function findAvailablePort(startPort: number) {
  function isPortAvailable(port: number): Promise<boolean> {
    const server = net.createServer();
    server.unref();

    return new Promise<boolean>((resolve, reject) => {
      server.once("error", (err: NodeJS.ErrnoException) => {
        if (err?.code === "EADDRINUSE") {
          resolve(false);
        } else {
          reject(err);
        }
      });

      server.listen(port, () => {
        server.close(() => {
          resolve(true);
        });
      });
    });
  }

  for (let port = startPort; port < MAX_PORT_NUMBER; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(`No available ports in range ${startPort} - ${MAX_PORT_NUMBER}`);
}
