const rateLimit = require('express-rate-limit');
const env = require('../config/env');

// Desligado em teste (a suite faz dezenas de logins) e quando
// RATE_LIMIT_DISABLED=true — usado APENAS em teste de carga, e recusado
// com NODE_ENV=production (ver config/env.js).
const skip = () => env.nodeEnv === 'test' || env.rateLimitDisabled;

// Limite geral da API: mitiga scraping/polling descontrolado de um IP.
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: env.rateLimitApiMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  message: { error: 'Muitas requisicoes - tente novamente em alguns minutos.' },
});

// Limite estrito para login / reset de senha (forca bruta e credential stuffing).
// Padrao: 3 tentativas por IP, bloqueio de 30 min.
const authLimiter = rateLimit({
  windowMs: env.rateLimitAuthWindowMs,
  limit: env.rateLimitAuthMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  message: { error: 'Muitas tentativas - tente novamente em 30 minutos.' },
});

module.exports = { apiLimiter, authLimiter };
