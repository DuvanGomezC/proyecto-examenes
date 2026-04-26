'use strict';

const express = require('express');
const router  = express.Router();
const { supabase } = require('../db');

function sanitizeText(str) {
  return typeof str === 'string' ? str.trim().replace(/[<>]/g, '') : '';
}

// GET /api/talleres — listar todos los talleres
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('talleres')
      .select('id, titulo, estado, fecha_creacion')
      .order('id', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error GET /talleres:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/talleres/active — obtener el taller habilitado actualmente
router.get('/active', async (req, res) => {
  try {
    const { data: taller, error } = await supabase
      .from('talleres')
      .select('*')
      .eq('estado', 'Habilitado')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (taller) taller.preguntas = JSON.parse(taller.preguntas);
    res.json(taller || null);
  } catch (err) {
    console.error('Error GET /talleres/active:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/talleres/:id — obtener un taller por ID
router.get('/:id', async (req, res) => {
  try {
    const { data: taller, error } = await supabase
      .from('talleres')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (taller) taller.preguntas = JSON.parse(taller.preguntas);
    res.json(taller || null);
  } catch (err) {
    console.error('Error GET /talleres/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/talleres — crear taller
router.post('/', async (req, res) => {
  const { titulo, preguntas } = req.body;
  const fecha = new Date().toISOString();
  try {
    const { data, error } = await supabase
      .from('talleres')
      .insert({
        titulo:         sanitizeText(titulo),
        preguntas:      JSON.stringify(preguntas),
        estado:         'Deshabilitado',
        fecha_creacion: fecha
      })
      .select('id')
      .single();

    if (error) throw error;
    res.json({ id: data.id });
  } catch (err) {
    console.error('Error POST /talleres:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/talleres/:id/enable — habilitar taller (deshabilita todos primero)
router.put('/:id/enable', async (req, res) => {
  const id = req.params.id;
  try {
    // Paso 1: deshabilitar todos
    const { error: err1 } = await supabase
      .from('talleres')
      .update({ estado: 'Deshabilitado' })
      .neq('id', 0);

    if (err1) throw err1;

    // Paso 2: habilitar el seleccionado
    const { error: err2 } = await supabase
      .from('talleres')
      .update({ estado: 'Habilitado' })
      .eq('id', id);

    if (err2) throw err2;
    res.json({ success: true });
  } catch (err) {
    console.error('Error PUT /talleres/:id/enable:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/talleres/:id/disable — deshabilitar taller
router.put('/:id/disable', async (req, res) => {
  try {
    const { error } = await supabase
      .from('talleres')
      .update({ estado: 'Deshabilitado' })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Error PUT /talleres/:id/disable:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/talleres/:id — eliminar taller
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('talleres')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Error DELETE /talleres/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
