const AppError = require('../utils/AppError');
const env = require('../config/env');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Defesa em profundidade sobre cookie httpOnly + SameSite=Lax: bloqueia
// mutacoes autenticadas POR COOKIE cuja Origin/Referer nao bate com o host.
// Clientes Bearer nao carregam cookie => nao sao alvo de CSRF classico.
function csrfGuard(req, res, next) {
  if (env.nodeEnv === 'test') return next();
  if (SAFE_METHODS.has(req.method)) return next();
  if (!req.cookies?.token) return next();
  if (req.headers.authorization) return next();

  const origin = req.headers.origin || req.headers.referer;
  if (!origin) return next(new AppError('Requisicao bloqueada (origem ausente)', 403));

  let originHost;
  try {
    originHost = new URL(origin).host;
  } catch {
    return next(new AppError('Requisicao bloqueada (origem invalida)', 403));
  }

  if (originHost !== req.headers.host) {
    return next(new AppError('Requisicao bloqueada (origem nao confiavel)', 403));
  }
  next();
}

module.exports = csrfGuard;
