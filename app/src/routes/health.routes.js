const express = require('express');
const { getMainConn } = require('../config/db');

const router = express.Router();

// Liveness: o processo esta de pe.
router.get('/live', (req, res) => res.json({ status: 'ok' }));

// Readiness: da para servir trafego (banco conectado)?
// Usamos a connection principal (mainConn), criada via createConnection em
// db.js — a connection padrao do mongoose nunca e conectada neste app.
router.get('/ready', (req, res) => {
  const conn = getMainConn();
  const dbUp = Boolean(conn && conn.readyState === 1);
  res.status(dbUp ? 200 : 503).json({ status: dbUp ? 'ok' : 'degraded', db: dbUp ? 'up' : 'down' });
});

router.get('/', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

module.exports = router;
