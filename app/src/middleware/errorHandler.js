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

// Catálogo de erros: mapeia cada status a um título amigável e a dica de
// recuperação exibida na página. Mantém o cliente informado sem vazar stack.
//  - retryable: o cliente pode tentar de novo (rede, lockout, validação).
//  - action: sugestão de próximo passo.
const ERROR_CATALOG = {
  400: { title: 'Requisição inválida', action: 'Verifique os dados enviados e tente novamente.' },
  401: { title: 'Não autenticado', action: 'Faça login para continuar.' },
  403: { title: 'Acesso negado', action: 'Esta conta não tem permissão para este recurso.' },
  404: { title: 'Não encontrado', action: 'O endereço pode estar errado ou o conteúdo foi removido.' },
  409: { title: 'Conflito', action: 'Já existe um registro com estes dados.' },
  422: { title: 'Dados inválidos', action: 'Corrija os campos destacados e envie de novo.' },
  429: { title: 'Muitas requisições', action: 'Aguarde alguns minutos antes de tentar novamente.' },
  500: { title: 'Erro interno', action: 'Tente novamente em instantes. Se persistir, avise o suporte.' },
  502: { title: 'Gateway inválido', action: 'Um serviço depende de outro que respondeu de forma inesperada.' },
  503: { title: 'Indisponível', action: 'O serviço está temporariamente fora do ar. Tente mais tarde.' },
  504: { title: 'Tempo esgotado', action: 'Um serviço demorou a responder. Tente novamente.' },
};

function catalogFor(status) {
  if (ERROR_CATALOG[status]) return ERROR_CATALOG[status];
  if (status >= 500) return ERROR_CATALOG[500];
  if (status >= 400) return { title: 'Erro na requisição', action: 'Verifique a solicitação e tente novamente.' };
  return { title: 'Concluído', action: '' };
}

function resolveError(err) {
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

  return { status, body };
}

// Erro interno NUNCA vaza stack/mensagem crua para o cliente.
function errorHandler(err, req, res, _next) {
  const { status, body } = resolveError(err);

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, env.nodeEnv === 'production' ? err.message : err);
  }

  if (wantsJson(req)) return res.status(status).json(body);

  const cat = catalogFor(status);
  // Botao "Voltar" aponta para a pagina de origem quando ela e do app
  // (Referer same-origin); caso contrario, cai na raiz. Evita javascript:
  // (bloqueado pela CSP) e mantem o voltar funcional e seguro.
  const referer = req.get('Referer') || '';
  const backUrl = referer.startsWith(env.appBaseUrl) ? referer : '/';
  return res.status(status).render('error', {
    status,
    message: body.error,
    title: cat.title,
    action: cat.action,
    details: body.details,
    backUrl,
    // Garante que a view encontre 't' mesmo se o middleware i18n nao rodou
    // (ex.: erro antes do i18n num app que nao o registrou).
    t: res.locals.t || ((k) => (cat && cat[k]) || k),
  });
}

module.exports = { notFoundHandler, errorHandler, catalogFor, ERROR_CATALOG };
