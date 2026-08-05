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

  // Popula demo em tudo que NAO seja producao: dev local (development),
  // testes (test) e stack de carga (staging). Producao fica so com o
  // admin@admin.com — o dono insere os dados pela interface.
  // POPULA_DEMO=false desliga explicitamente (ex.: teste de carga sem demo).
  const demoEnv = process.env.POPULA_DEMO;
  const populaDemo =
    env.nodeEnv !== 'production' && demoEnv !== 'false' && demoEnv !== '0';
  const seed = await seedAdminIfEmpty({ populaDemo });
  if (seed.created) {
    console.log('============================================================');
    console.log('Conta admin criada (unica vez — guarde esta senha agora):');
    console.log(`  E-mail: ${seed.email}`);
    console.log(`  Senha:  ${seed.password}`);
    if (seed.doArquivo) console.log('  (senha lida de SEED_PASSWORD_FILE — comum a outros projetos)');
    if (populaDemo) console.log('  Banco de teste populado com usuarios demo.');
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
