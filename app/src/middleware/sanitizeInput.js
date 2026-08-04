// Remove chaves que comecam com "$" ou contem "." de body/query/params,
// recursivamente. Sem isto, {"email": {"$gt": ""}} vira operador de query
// no Mongoose (injecao NoSQL). Segunda camada: os schemas Zod ja forcam
// string, mas isto nao depende de nenhuma rota lembrar de validar.
function sanitizeValue(value, depth = 0) {
  if (depth > 10) return undefined; // corta payload profundo demais (DoS)
  if (Array.isArray(value)) return value.map((v) => sanitizeValue(v, depth + 1));
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const clean = {};
    for (const [key, val] of Object.entries(value)) {
      if (key.startsWith('$') || key.includes('.')) continue;
      clean[key] = sanitizeValue(val, depth + 1);
    }
    return clean;
  }
  return value;
}

function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') req.body = sanitizeValue(req.body);
  if (req.params && typeof req.params === 'object') req.params = sanitizeValue(req.params);
  if (req.query && typeof req.query === 'object') {
    // Express 5: req.query e getter — mutar in place em vez de reatribuir.
    const clean = sanitizeValue({ ...req.query });
    for (const k of Object.keys(req.query)) if (!(k in clean)) delete req.query[k];
    Object.assign(req.query, clean);
  }
  next();
}

module.exports = sanitizeInput;
