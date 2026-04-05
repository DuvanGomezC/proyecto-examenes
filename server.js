/**
 * server.js — INARFOTEC Exam System
 * Express server: serves static frontend + REST API backed by SQLite.
 */

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());

// Serve the frontend (index.html, styles.css, js/, assets/)
app.use(express.static(path.join(__dirname)));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',    require('./backend/routes/auth'));
app.use('/api/users',   require('./backend/routes/users'));
app.use('/api/exams',   require('./backend/routes/exams'));
app.use('/api/results', require('./backend/routes/results'));

// ─── SPA Fallback ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  INARFOTEC — Servidor iniciado`);
  console.log(`🌐  Abrir en:  http://localhost:${PORT}`);
  console.log(`📂  Base de datos: ./database/inarfotec.db\n`);
});
