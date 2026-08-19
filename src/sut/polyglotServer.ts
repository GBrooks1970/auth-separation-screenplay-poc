import { createPolyglotCluster } from '../support/polyglotLauncher.js';

const cluster = createPolyglotCluster();
await cluster.start();

const shutdown = async () => {
  console.log('\nShutting down polyglot SUT services...');
  await cluster.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
