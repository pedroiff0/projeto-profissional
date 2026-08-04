const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const apiRoutes = require('./routes');
const pageRoutes = require('./routes/pages.routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const csrfGuard = require('./middleware/csrfGuard');
const sanitizeInput = require('./middleware/sanitizeInput');
const { apiLimiter } = require('./middleware/rateLimiters');
const env = require('./config/env');

function createApp() {
  const app = express();

  // Atras de nginx/Traefik/Tailscale: confia em 1 hop para req.ip correto
  // (rate limit por IP real). Ajuste conforme sua topologia.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../views'));

  // Disponivel em toda view sem precisar repetir no render de cada rota.
  app.locals.appName = env.appName;

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          // helmet liga upgrade-insecure-requests por padrao; em HTTP puro
          // (LAN/VPN) isso quebra CSS/JS. Ligue de volta quando servir HTTPS.
          upgradeInsecureRequests: env.cookieSecure ? [] : null,
        },
      },
      referrerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
    })
  );

  app.use(compression());
  // Limite de corpo: sem isto um POST gigante e DoS barato.
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser());
  app.use(sanitizeInput);
  app.use(express.static(path.join(__dirname, '../public'), { maxAge: '1h' }));

  // CORS por allowlist explicita (nunca '*' junto com credenciais).
  const extras = (env.corsAllowedOrigins || '').split(',').map((s) => s.trim()).filter(Boolean);
  const allowlist = new Set([env.appBaseUrl, ...extras].filter(Boolean));
  app.use('/api', (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowlist.has(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Vary', 'Origin');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  app.use('/api', apiLimiter);
  app.use('/api', csrfGuard);
  app.use('/api', apiRoutes);
  app.use('/', pageRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
