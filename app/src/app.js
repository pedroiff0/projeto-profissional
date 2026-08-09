const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const apiRoutes = require('./routes');
const pageRoutes = require('./routes/pages.routes');
const landingRoutes = require('./routes/landing.routes');
const demoLoginRoutes = require('./routes/demoLogin.routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const csrfGuard = require('./middleware/csrfGuard');
const sanitizeInput = require('./middleware/sanitizeInput');
const { apiLimiter } = require('./middleware/rateLimiters');
const { selectDb } = require('./middleware/selectDb');
const i18n = require('./middleware/i18n');
const env = require('./config/env');

function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../views'));

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
          upgradeInsecureRequests: env.cookieSecure ? [] : null,
        },
      },
      referrerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
    })
  );

  app.use(compression());
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser());
  app.use(sanitizeInput);
  app.use(i18n);
  // Sem cache agressivo em assets estaticos: o navegador sempre revalida,
  // evitando CSS/JS obsoletos apos rebuild (maxAge 1h causava "nao reiniciou").
  app.use(express.static(path.join(__dirname, '../public'), { maxAge: 0, etag: true }));

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

  // Landing publica (raiz) com os 3 bancos.
  app.use('/', landingRoutes);

  // API: alias de producao em /api (preserva testes antigos) + prefixos.
  app.use('/api', selectDb('production'), apiRoutes);
  app.use('/api/app', selectDb('production'), apiRoutes);
  app.use('/api/test', selectDb('test'), apiRoutes);
  app.use('/api/demo', selectDb('demo'), apiRoutes);

  // Paginas: alias de producao em / (preserva testes antigos) + prefixos.
  app.use('/', selectDb('production'), pageRoutes);
  app.use('/app', selectDb('production'), pageRoutes);
  app.use('/test', selectDb('test'), pageRoutes);
  app.use('/demo', selectDb('demo'), demoLoginRoutes); // /demo -> autologa
  app.use('/demo', selectDb('demo'), pageRoutes);      // /demo/* -> dashboard etc.

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
