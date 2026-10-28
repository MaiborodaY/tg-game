import { once } from 'node:events';

/** Give each disposable suite its own loopback port, including concurrent runs. */
export async function listenBrowserServer(server) {
  if (!server.httpServer) throw new Error('Browser checks require a standalone HTTP server');
  // Vite's public listen(0) substitutes its default port. The wrapped HTTP
  // listener still initializes Vite and lets the operating system choose a port.
  const listening = once(server.httpServer, 'listening');
  server.httpServer.listen(0, '127.0.0.1');
  await listening;
  const address = server.httpServer.address();
  if (!address || typeof address === 'string' || address.address !== '127.0.0.1' || !address.port) {
    throw new Error('Browser check server did not bind to a loopback TCP port');
  }
  return `http://127.0.0.1:${address.port}/`;
}
