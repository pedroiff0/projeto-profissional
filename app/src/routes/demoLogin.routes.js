const express = require('express');
const { seedAdminIfEmpty } = require('../seeds/admin.seed');
const { carregarDemo } = require('../services/demoService');
const { signToken } = require('../middleware/auth');
const env = require('../config/env');

const router = express.Router();

// Acessível em /demo/start (montado com selectDb('demo')). Popula o banco demo
// (se vazio) e autentica num usuário demo, caindo direto no dashboard (/demo/).
router.get('/start', async (req, res, next) => {
  try {
    await seedAdminIfEmpty({ populaDemo: false }, req.models);
    await carregarDemo({ usuarios: 30, projetos: 40, itens: 120 }, req.models);
    const User = req.models.User;
    const demoUser = await User.findOne({ email: 'demo1@example.com' }).select('+passwordHash');
    if (!demoUser) return res.redirect('/login');
    const token = signToken(demoUser, 'demo');
    res.cookie('token', token, {
      httpOnly: true, secure: env.cookieSecure, sameSite: 'lax', path: '/', maxAge: 2 * 60 * 60 * 1000,
    });
    res.redirect('/demo/');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
