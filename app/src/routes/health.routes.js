const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// Liveness: o processo esta de pe.
router.get('/live', (req, res) => res.json({ status: 'ok' }));

// Readiness: da para servir trafego (banco conectado)?
router.get('/ready', (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({ status: dbUp ? 'ok' : 'degraded', db: dbUp ? 'up' : 'down' });
});

router.get('/', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

module.exports = router;
