const { createApp } = require('./app');
const { connectDb, disconnectDb } = require('./config/db');
const { seedAdminIfEmpty } = require('./seeds/admin.seed');
const env = require('./config/env');

async function main() {
  try {
    await connectDb();
    console.log('Conectado ao MongoDB');
  } catch (err) {
    console.error('Falha ao conectar ao MongoDB:', err.message);
    process.exit(1);
  }

  const seed = await seedAdminIfEmpty();
  if (seed.created) {
    console.log('============================================================');
    console.log('Conta admin criada (unica vez — guarde esta senha agora):');
    console.log(`  E-mail: ${seed.email}`);
    console.log(`  Senha:  ${seed.password}`);
    console.log('============================================================');
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`Servidor escutando na porta ${env.port} (${env.nodeEnv})`);
  });

  // Shutdown gracioso: para de aceitar conexoes, fecha o banco e sai.
  const shutdown = async (signal) => {
    console.log(`${signal} recebido — encerrando...`);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

if (require.main === module) main();

module.exports = { main, createApp };
