const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDb, disconnectDb, getModeConn, MODE_DB } = require('../../src/config/db');

let mongod;

// Banco em memoria por suite: testes reais contra o Mongoose, sem depender
// de um Mongo externo nem sujar dados. Sobe um servidor e conecta via o
// db.js do app (que cria as 3 databases por modo).
async function setupDb() {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  // Forca o env a reler a URI (env.js ja foi requerido em algum ponto).
  const env = require('../../src/config/env');
  env.mongoUri = mongod.getUri();
  await connectDb();
}

async function teardownDb() {
  await disconnectDb();
  if (mongod) await mongod.stop();
}

async function clearDb() {
  // Limpa as 3 databases (modos) para isolamento entre testes.
  for (const mode of Object.keys(MODE_DB)) {
    const conn = getModeConn(mode);
    const { collections } = conn;
    await Promise.all(Object.values(collections).map((c) => c.deleteMany({}).catch(() => {})));
  }
}

module.exports = { setupDb, teardownDb, clearDb };
