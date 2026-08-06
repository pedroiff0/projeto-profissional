const { extractToken, resolveUser, toRequestUser } = require('./auth');

// Paginas: redireciona para /login em vez de responder 401 JSON.
async function pageAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return res.redirect('/login');
    const user = await resolveUser(token, req.mode, req.models);
    if (!user) return res.redirect('/login');
    req.user = toRequestUser(user);
    res.locals.user = req.user;
    res.locals.modo = req.mode;
    next();
  } catch {
    res.redirect('/login');
  }
}

async function optionalPageAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return next();
    const user = await resolveUser(token, req.mode, req.models);
    if (user) {
      req.user = toRequestUser(user);
      res.locals.user = req.user;
    }
    next();
  } catch {
    next();
  }
}

function requirePageRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).render('error', { status: 403, message: 'Acesso negado.' });
    }
    next();
  };
}

// Conta provisionada pelo admin so navega depois de trocar a senha.
function requirePasswordChanged(req, res, next) {
  if (req.user?.mustChangePassword && req.path !== '/primeiro-acesso') {
    return res.redirect('/primeiro-acesso');
  }
  next();
}

module.exports = { pageAuth, optionalPageAuth, requirePageRole, requirePasswordChanged };
