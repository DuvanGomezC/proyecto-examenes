'use strict';

const express = require('express');
const router = express.Router();
const { supabase } = require('../db');

function sanitizeText(str) {
  return typeof str === 'string' ? str.trim().replace(/[<>]/g, '') : '';
}

// GET /api/exams — listar todos los exámenes
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('examenes')
      .select('id, titulo, estado, fecha_creacion')
      .order('id', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error GET /exams:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/exams/active — obtener el examen habilitado actualmente
router.get('/active', async (req, res) => {
  try {
    const { data: exam, error } = await supabase
      .from('examenes')
      .select('*')
      .eq('estado', 'Habilitado')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (exam) exam.preguntas = JSON.parse(exam.preguntas);
    res.json(exam || null);
  } catch (err) {
    console.error('Error GET /exams/active:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/exams/:id — obtener un examen por ID
router.get('/:id', async (req, res) => {
  try {
    const { data: exam, error } = await supabase
      .from('examenes')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (exam) exam.preguntas = JSON.parse(exam.preguntas);
    res.json(exam || null);
  } catch (err) {
    console.error('Error GET /exams/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/exams — crear examen
router.post('/', async (req, res) => {
  const { titulo, preguntas } = req.body;
  const fecha = new Date().toISOString();
  try {
    const { data, error } = await supabase
      .from('examenes')
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
    console.error('Error POST /exams:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/exams/:id/enable — habilitar examen (deshabilita todos primero)
router.put('/:id/enable', async (req, res) => {
  const id = req.params.id;
  try {
    // Paso 1: deshabilitar todos
    const { error: err1 } = await supabase
      .from('examenes')
      .update({ estado: 'Deshabilitado' })
      .neq('id', 0); // condición siempre verdadera para actualizar todos

    if (err1) throw err1;

    // Paso 2: habilitar el seleccionado
    const { error: err2 } = await supabase
      .from('examenes')
      .update({ estado: 'Habilitado' })
      .eq('id', id);

    if (err2) throw err2;
    res.json({ success: true });
  } catch (err) {
    console.error('Error PUT /exams/:id/enable:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/exams/:id/disable — deshabilitar examen
router.put('/:id/disable', async (req, res) => {
  try {
    const { error } = await supabase
      .from('examenes')
      .update({ estado: 'Deshabilitado' })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Error PUT /exams/:id/disable:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/exams/:id — eliminar examen
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('examenes')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Error DELETE /exams/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
