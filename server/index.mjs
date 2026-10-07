import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.mjs';
import { openDatabase } from './database.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const path = resolve(process.env.DEMO_DB || `${root}/.data/todos.sqlite`);
mkdirSync(dirname(path), { recursive: true });
const db = openDatabase(path);
const server = createApp(db);
server.listen(
  Number(process.env.DEMO_API_PORT || 4310),
  process.env.DEMO_API_HOST || '127.0.0.1',
  () => {
    console.log(
      JSON.stringify({ app: 'debug-cli-challenge', port: server.address().port, database: path }),
    );
  },
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () =>
    server.close(() => {
      db.close();
      process.exit(0);
    }),
  );
