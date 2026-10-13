// Dev-only: starts an in-memory MongoDB on 127.0.0.1:27017 (db: vaultic).
// Run: node scripts/dev-db.js  (keep it running while developing)
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const mongod = await MongoMemoryServer.create({
    instance: { port: 27017, dbName: 'vaultic', ip: '127.0.0.1' },
  });
  console.log('in-memory mongo ready: ' + mongod.getUri('vaultic'));
  setInterval(() => {}, 1 << 30);
})().catch((e) => {
  console.error('dev-db failed:', e.message);
  process.exit(1);
});
