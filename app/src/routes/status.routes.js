const express = require('express');
const AppError = require('../utils/AppError');

const router = express.Router();

// Catalogo de status HTTP exibidos na pagina /status. Centralizado aqui:
// quem precisar de novo codigo so adiciona neste mapa (sem caçar ifs no
// errorHandler). 'retryable' marca os que o cliente pode tentar de novo.
const HTTP_CATALOG = {
  // 2xx — sucesso
  200: { name: 'OK', kind: 'success', retryable: false, desc: 'Requisição processada com sucesso.' },
  201: { name: 'Created', kind: 'success', retryable: false, desc: 'Recurso criado com sucesso.' },
  202: { name: 'Accepted', kind: 'success', retryable: false, desc: 'Requisição aceita para processamento assíncrono.' },
  204: { name: 'No Content', kind: 'success', retryable: false, desc: 'Sucesso sem corpo de resposta.' },

  // 3xx — redirecionamento
  301: { name: 'Moved Permanently', kind: 'redirect', retryable: false, desc: 'Recurso movido definitivamente.' },
  302: { name: 'Found', kind: 'redirect', retryable: false, desc: 'Redirecionamento temporário.' },
  304: { name: 'Not Modified', kind: 'redirect', retryable: false, desc: 'Cache válido; nada a retornar.' },

  // 4xx — erro do cliente
  400: { name: 'Bad Request', kind: 'client', retryable: true, desc: 'Requisição malformada.' },
  401: { name: 'Unauthorized', kind: 'client', retryable: true, desc: 'Não autenticado — faça login.' },
  403: { name: 'Forbidden', kind: 'client', retryable: false, desc: 'Autenticado, mas sem permissão.' },
  404: { name: 'Not Found', kind: 'client', retryable: true, desc: 'Rota ou recurso inexistente.' },
  409: { name: 'Conflict', kind: 'client', retryable: true, desc: 'Conflito de estado (registro duplicado).' },
  422: { name: 'Unprocessable Entity', kind: 'client', retryable: true, desc: 'Dados inválidos (falha de validação).' },
  429: { name: 'Too Many Requests', kind: 'client', retryable: true, desc: 'Limite de requisições excedido.' },

  // 5xx — erro do servidor
  500: { name: 'Internal Server Error', kind: 'server', retryable: true, desc: 'Erro inesperado no servidor.' },
  502: { name: 'Bad Gateway', kind: 'server', retryable: true, desc: 'Resposta inválida de serviço upstream.' },
  503: { name: 'Service Unavailable', kind: 'server', retryable: true, desc: 'Serviço temporariamente indisponível.' },
  504: { name: 'Gateway Timeout', kind: 'server', retryable: true, desc: 'Upstream não respondeu a tempo.' },
};

// Leitura estruturada — útil para o frontend (fetch) resolver o rótulo de um
// status sem conhecer o catálogo. Retorna 404 se o código não estiver mapeado.
router.get('/:code', (req, res) => {
  const code = Number(req.params.code);
  const entry = HTTP_CATALOG[code];
  if (!entry) throw new AppError('Status nao mapeado', 404);
  res.json({ code, ...entry });
});

module.exports = router;
module.exports.HTTP_CATALOG = HTTP_CATALOG;
