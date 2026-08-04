require('dotenv').config();

function requiredInProd(name, value) {
  if ((process.env.NODE_ENV || 'development') === 'production' && !value) {
    throw new Error(`Variavel de ambiente obrigatoria em producao ausente: ${name}`);
  }
  return value;
}

const port = Number(process.env.PORT || 4447);
const jwtSecret = process.env.JWT_SECRET || '';

// Em producao um secret fraco/ausente e falha de boot, nao um default silencioso.
requiredInProd('JWT_SECRET', jwtSecret);
if (jwtSecret && jwtSecret.length < 32 && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET deve ter no minimo 32 caracteres em producao');
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/app_db',
  jwtSecret: jwtSecret || 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  appBaseUrl: process.env.APP_BASE_URL || `http://localhost:${port}`,
  appName: process.env.APP_NAME || 'Projeto Profissional',

  // Cookie Secure e descartado pelo navegador em HTTP puro. Liga sozinho
  // quando APP_BASE_URL e https; COOKIE_SECURE=true|false sobrepoe.
  cookieSecure: (() => {
    const raw = String(process.env.COOKIE_SECURE || '').trim().toLowerCase();
    if (raw === 'true' || raw === '1') return true;
    if (raw === 'false' || raw === '0') return false;
    return String(process.env.APP_BASE_URL || '').startsWith('https://');
  })(),

  corsAllowedOrigins: process.env.CORS_ALLOWED_ORIGINS || '',

  // --- Rate limiting -------------------------------------------------------
  // Configuravel para permitir teste de carga honesto: com o limite padrao
  // (300 req/5min) qualquer benchmark mede o limiter, nao a aplicacao.
  // RATE_LIMIT_DISABLED=true e recusado em producao de proposito — desligar
  // protecao de forca bruta em producao nunca pode ser um acidente de env.
  rateLimitDisabled: (() => {
    const off = String(process.env.RATE_LIMIT_DISABLED || '').toLowerCase() === 'true';
    if (off && (process.env.NODE_ENV || '') === 'production') {
      throw new Error('RATE_LIMIT_DISABLED=true nao e permitido com NODE_ENV=production');
    }
    return off;
  })(),
  rateLimitApiMax: Number(process.env.RATE_LIMIT_API_MAX || 300),
  rateLimitAuthMax: Number(process.env.RATE_LIMIT_AUTH_MAX || 3),
  rateLimitAuthWindowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW_MIN || 30) * 60 * 1000,

  // Bloqueio de conta: 3 tentativas malsucedidas travam o login por 30 min.
  // Complementa o limitador por IP — este protege a CONTA (credential
  // stuffing distribuido), aquele protege o SERVICO (forca bruta de um IP).
  maxFailedAttempts: Number(process.env.MAX_FAILED_ATTEMPTS || 3),
  lockoutMs: Number(process.env.LOCKOUT_MIN || 30) * 60 * 1000,

  // Seed do admin unico. Sem senha definida, o seed gera uma aleatoria e
  // imprime UMA vez no log de boot.
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  adminName: process.env.ADMIN_NAME || 'Administrador',
  adminPassword: process.env.ADMIN_PASSWORD || '',
};
