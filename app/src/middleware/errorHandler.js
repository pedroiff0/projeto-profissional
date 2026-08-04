const { ZodError } = require('zod');
const AppError = require('../utils/AppError');
const env = require('../config/env');

function wantsJson(req) {
  return req.path.startsWith('/api/') || req.accepts(['html', 'json']) === 'json';
}

function notFoundHandler(req, res) {
  if (wantsJson(req)) return res.status(404).json({ error: 'Rota nao encontrada' });
  return res.status(404).render('error', { status: 404, message: 'Pagina nao encontrada.' });
}

// Erro interno NUNCA vaza stack/mensagem crua para o cliente.
function errorHandler(err, req, res, _next) {
  let status = 500;
  let body = { error: 'Erro interno do servidor' };

  if (err instanceof ZodError) {
    status = 422;
    body = { error: 'Dados invalidos', details: err.issues };
  } else if (err instanceof AppError) {
    status = err.statusCode;
    body = { error: err.message, ...(err.details ? { details: err.details } : {}) };
  } else if (err.name === 'CastError' || err.name === 'ValidationError') {
    status = 422;
    body = { error: 'Dados invalidos' };
  } else if (err.code === 11000) {
    status = 409;
    body = { error: 'Registro duplicado' };
  }

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, env.nodeEnv === 'production' ? err.message : err);
  }

  if (wantsJson(req)) return res.status(status).json(body);
  return res.status(status).render('error', { status, message: body.error });
}

module.exports = { notFoundHandler, errorHandler };
