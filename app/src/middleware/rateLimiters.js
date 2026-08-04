const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const skipInTest = () => env.nodeEnv === 'test';

// Limite geral da API: mitiga scraping/polling descontrolado de um IP.
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: skipInTest,
  message: { error: 'Muitas requisicoes - tente novamente em alguns minutos.' },
});

// Limite estrito para login / reset de senha (forca bruta e credential stuffing).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: skipInTest,
  message: { error: 'Muitas tentativas - tente novamente em alguns minutos.' },
});

module.exports = { apiLimiter, authLimiter };
