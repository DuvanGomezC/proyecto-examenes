/**
 * server.js — INARFOTEC Exam System
 * Express server: sirve el frontend estático + API REST respaldada por Supabase (PostgreSQL).
 */

'use strict';

require('dotenv').config();

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Servir el frontend (index.html, styles.css, js/, assets/)
app.use(express.static(path.join(__dirname)));

// ─── Rutas de la API ───────────────────────────────────────────────────────────
app.use('/api/auth',             require('./backend/routes/auth'));
app.use('/api/users',            require('./backend/routes/users'));
app.use('/api/exams',            require('./backend/routes/exams'));
app.use('/api/results',          require('./backend/routes/results'));
app.use('/api/talleres',         require('./backend/routes/talleres'));
app.use('/api/workshop-results', require('./backend/routes/workshop-results'));

// ─── SPA Fallback ──────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── Iniciar servidor ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  INARFOTEC — Servidor iniciado`);
  console.log(`🌐  Abrir en:  http://localhost:${PORT}`);
  console.log(`☁️   Base de datos: Supabase (PostgreSQL)\n`);
});
