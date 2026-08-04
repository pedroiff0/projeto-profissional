const AppError = require('./AppError');

// Valida req.body/query/params com um schema Zod e SUBSTITUI o valor pelo
// dado ja tipado. Toda rota POST/PUT/PATCH deve usar isto.
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const message = Object.entries(fieldErrors)
        .map(([field, msgs]) => `${field}: ${msgs[0]}`)
        .join('; ') || 'Dados invalidos';
      return next(new AppError(message, 422, fieldErrors));
    }
    if (source === 'body') req.body = result.data;
    else req.validated = result.data;
    next();
  };
}

// Envolve handlers async para que rejeicoes cheguem ao errorHandler.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { validate, asyncHandler };
