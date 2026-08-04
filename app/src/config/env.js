require('dotenv').config();

function requiredInProd(name, value) {
  if ((process.env.NODE_ENV || 'development') === 'production' && !value) {
    throw new Error(`Variavel de ambiente obrigatoria em producao ausente: ${name}`);
  }
  return value;
}

const port = Number(process.env.PORT || 5000);
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

  // Seed do admin unico. Sem senha definida, o seed gera uma aleatoria e
  // imprime UMA vez no log de boot.
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  adminName: process.env.ADMIN_NAME || 'Administrador',
  adminPassword: process.env.ADMIN_PASSWORD || '',
};
