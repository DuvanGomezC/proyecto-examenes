'use strict';

const express = require('express');
const router = express.Router();
const { supabase, sha256 } = require('../db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { documento, contrasena } = req.body;
  if (!documento || !contrasena) {
    return res.status(400).json({ ok: false, error: 'Ingresa tu número de documento y contraseña.' });
  }

  try {
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('documento', documento.trim())
      .maybeSingle();

    if (error) throw error;

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
  } catch (err) {
    console.error('Error en /login:', err.message);
    res.status(500).json({ ok: false, error: 'Error del servidor.' });
  }
});

// GET /api/auth/me?documento=123
router.get('/me', async (req, res) => {
  const { documento } = req.query;
  if (!documento) return res.status(400).json({ error: 'Missing document' });

  try {
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id, nombres, apellidos, documento, programa, rol, estado')
      .eq('documento', documento)
      .maybeSingle();

    if (error) throw error;
    res.json({ user: user || null });
  } catch (err) {
    console.error('Error en /me:', err.message);
    res.status(500).json({ error: 'Error del servidor.' });
  }
});

module.exports = router;
