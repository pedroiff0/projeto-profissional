const AppError = require('../utils/AppError');

// Usar SEMPRE depois de `auth` (precisa de req.user populado).
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('Autenticacao necessaria', 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Acesso negado para este papel de usuario', 403));
    }
    next();
  };
}

const requireAdmin = requireRole('admin');

module.exports = { requireRole, requireAdmin };
