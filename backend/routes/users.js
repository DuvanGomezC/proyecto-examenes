'use strict';

const express = require('express');
const router = express.Router();
const { supabase, sha256 } = require('../db');

function sanitizeText(str) {
  return typeof str === 'string' ? str.trim().replace(/[<>]/g, '') : '';
}
function sanitizeNumeric(str) {
  return typeof str === 'string' ? str.replace(/\D/g, '') : String(str).replace(/\D/g, '');
}

// GET /api/users — listar todos los usuarios
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombres, apellidos, documento, programa, rol, estado')
      .order('rol', { ascending: true })
      .order('apellidos', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error GET /users:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users — crear usuario
router.post('/', async (req, res) => {
  const { nombres, apellidos, documento, contrasena, programa, rol, estado } = req.body;
  try {
    const hash = sha256(contrasena);
    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        nombres:    sanitizeText(nombres),
        apellidos:  sanitizeText(apellidos),
        documento:  sanitizeNumeric(documento),
        contrasena: hash,
        programa,
        rol,
        estado: estado || 'Activo'
      })
      .select('id')
      .single();

    if (error) throw error;
    res.json({ id: data.id });
  } catch (err) {
    console.error('Error POST /users:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id — actualizar usuario (con o sin contraseña)
router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const { nombres, apellidos, documento, contrasena, programa, rol, estado } = req.body;
  try {
    const updateData = {
      nombres:   sanitizeText(nombres),
      apellidos: sanitizeText(apellidos),
      documento: sanitizeNumeric(documento),
      programa,
      rol,
      estado
    };
    if (contrasena) {
      updateData.contrasena = sha256(contrasena);
    }

    const { error } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Error PUT /users/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/status — cambiar estado (Activo/Inactivo)
router.put('/:id/status', async (req, res) => {
  const id = req.params.id;
  const { estado } = req.body;
  try {
    const { error } = await supabase
      .from('usuarios')
      .update({ estado })
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Error PUT /users/:id/status:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id — eliminar usuario
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Error DELETE /users/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
