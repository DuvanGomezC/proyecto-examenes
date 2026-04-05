const express = require('express');
const router = express.Router();
const { db, sha256 } = require('../db');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { documento, contrasena } = req.body;
  if (!documento || !contrasena) {
    return res.status(400).json({ ok: false, error: 'Ingresa tu número de documento y contraseña.' });
  }

  try {
    const user = db.prepare("SELECT * FROM usuarios WHERE documento=?").get(documento.trim());

    if (!user) {
      return res.status(401).json({ ok: false, error: 'Documento o contraseña incorrectos.' });
    }

    if (user.estado === 'Inactivo') {
      return res.status(403).json({ ok: false, error: 'Tu cuenta está inactiva. Contacta al instructor.' });
    }

    const hash = sha256(contrasena);
    if (hash !== user.contrasena) {
      return res.status(401).json({ ok: false, error: 'Documento o contraseña incorrectos.' });
    }

    res.json({ ok: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: 'Error del servidor.' });
  }
});

// GET /api/auth/me?documento=123
router.get('/me', (req, res) => {
  const { documento } = req.query;
  if (!documento) return res.status(400).json({ error: 'Missing document' });
  const user = db.prepare("SELECT id, nombres, apellidos, documento, programa, rol, estado FROM usuarios WHERE documento=?").get(documento);
  res.json({ user: user || null });
});

module.exports = router;
