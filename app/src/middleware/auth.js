const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const AppError = require('../utils/AppError');
const env = require('../config/env');

// Ordem de extracao: cookie httpOnly (web) > Bearer (API/mobile).
// Token em query string NAO e aceito: vaza em log de proxy e no Referer.
function extractToken(req) {
  if (req.cookies?.token) return req.cookies.token;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

async function resolveUser(token) {
  const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
  const user = await User.findById(payload.id);
  if (!user || !user.isActive) return null;
  // Invalidacao global de sessao: token emitido antes de tokenValidAfter
  // (troca de senha, logout global, desativacao) e recusado.
  // ATENCAO: `iat` do JWT e em SEGUNDOS e truncado para baixo. Comparar
  // direto com milissegundos invalidaria tokens legitimos emitidos no mesmo
  // segundo — por isso os dois lados sao normalizados para segundos.
  if (payload.iat && user.tokenValidAfter) {
    const validAfterSec = Math.floor(user.tokenValidAfter.getTime() / 1000);
    if (payload.iat < validAfterSec) return null;
  }
  return user;
}

function toRequestUser(user) {
  return {
    id: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email,
    mustChangePassword: user.mustChangePassword || false,
  };
}

// API: responde 401 em JSON.
async function auth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw new AppError('Autenticacao necessaria', 401);
    const user = await resolveUser(token);
    if (!user) throw new AppError('Autenticacao necessaria', 401);
    req.user = toRequestUser(user);
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError('Token invalido ou expirado', 401));
  }
}

module.exports = { auth, extractToken, resolveUser, toRequestUser };
