// Semeia usuarios para o teste de carga. Roda contra o banco de TESTE,
// nunca contra producao — o guard abaixo aborta se o nome do banco nao
// contiver "test".
//
// Uso: node scripts/seed-carga.js [quantidade]

const mongoose = require('mongoose');
const User = require('../src/models/user.model');
const authService = require('../src/services/authService');

const TOTAL = Number(process.argv[2] || process.env.TOTAL_USUARIOS || 50);
const SENHA = process.env.SENHA_CARGA || 'CargaTeste123ok';
const URI = process.env.MONGO_URI || 'mongodb://localhost:27017/app_test_db';

async function main() {
  // Guarda de seguranca: seed de carga jamais deve tocar no banco de producao.
  const nomeBanco = new URL(URI.replace('mongodb://', 'http://')).pathname.slice(1);
  if (!/test/i.test(nomeBanco)) {
    console.error(`RECUSADO: "${nomeBanco}" nao parece um banco de teste (esperado conter "test").`);
    process.exit(1);
  }

  await mongoose.connect(URI);
  console.log(`Conectado a ${nomeBanco}`);

  // Hash calculado UMA vez: com bcrypt custo 12, 50 hashes levariam ~15s.
  // Todos os usuarios sinteticos compartilham a mesma senha de teste.
  const passwordHash = await authService.hashPassword(SENHA);

  const ops = [];
  for (let i = 1; i <= TOTAL; i += 1) {
    ops.push({
      updateOne: {
        filter: { email: `carga${i}@example.com` },
        update: {
          $set: {
            name: `Usuario Carga ${i}`,
            email: `carga${i}@example.com`,
            role: 'user',
            passwordHash,
            isActive: true,
            mustChangePassword: false,
            tokenValidAfter: new Date(Date.now() - 60_000),
          },
        },
        upsert: true,
      },
    });
  }

  const res = await User.bulkWrite(ops);
  console.log(`Usuarios de carga prontos: ${TOTAL} (inseridos ${res.upsertedCount}, atualizados ${res.modifiedCount})`);
  console.log(`Credenciais: carga1..carga${TOTAL}@example.com / ${SENHA}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Falha no seed de carga:', err.message);
  process.exit(1);
});
