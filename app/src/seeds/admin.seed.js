const crypto = require('crypto');
const User = require('../models/user.model');
const authService = require('../services/authService');
const env = require('../config/env');

// Cria o admin inicial APENAS se nao houver nenhum admin no banco.
// A senha vem de ADMIN_PASSWORD ou e gerada aleatoriamente e impressa UMA
// unica vez no log de boot — nunca fica hardcoded no repositorio.
async function seedAdminIfEmpty() {
  const existing = await User.findOne({ role: 'admin' });
  if (existing) return { created: false };

  const password = env.adminPassword || crypto.randomBytes(18).toString('base64url');
  const passwordHash = await authService.hashPassword(password);

  await User.create({
    role: 'admin',
    name: env.adminName,
    email: env.adminEmail,
    passwordHash,
    // Senha vinda do .env deve ser trocada no primeiro acesso.
    mustChangePassword: Boolean(env.adminPassword),
  });

  return { created: true, email: env.adminEmail, password };
}

module.exports = { seedAdminIfEmpty };
