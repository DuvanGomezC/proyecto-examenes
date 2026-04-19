'use strict';

const express = require('express');
const router = express.Router();
const { supabase } = require('../db');

// POST /api/results — registrar resultado de examen
router.post('/', async (req, res) => {
  const { id_estudiante, id_examen, puntuacion, respuestas } = req.body;
  const fecha = new Date().toISOString();
  try {
    const { error } = await supabase
      .from('resultados')
      .insert({
        id_estudiante,
        id_examen:  Number(id_examen),
        puntuacion,
        respuestas: JSON.stringify(respuestas),
        fecha
      });

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Error POST /results:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/results/student/:documento — resultados de un estudiante específico
router.get('/student/:documento', async (req, res) => {
  try {
    // 1. Traer resultados del estudiante
    const { data: resultados, error: rErr } = await supabase
      .from('resultados')
      .select('id, id_estudiante, id_examen, puntuacion, respuestas, fecha')
      .eq('id_estudiante', req.params.documento)
      .order('fecha', { ascending: false });

    if (rErr) throw rErr;
    if (!resultados || resultados.length === 0) return res.json([]);

    // 2. Traer los títulos de los exámenes involucrados
    const examIds = [...new Set(resultados.map(r => r.id_examen))];
    const { data: examenes, error: eErr } = await supabase
      .from('examenes')
      .select('id, titulo')
      .in('id', examIds);

    if (eErr) throw eErr;

    const examMap = {};
    (examenes || []).forEach(e => { examMap[e.id] = e.titulo; });

    // 3. Combinar
    const results = resultados.map(r => ({
      id:            r.id,
      id_estudiante: r.id_estudiante,
      id_examen:     r.id_examen,
      puntuacion:    r.puntuacion,
      respuestas:    r.respuestas,
      fecha:         r.fecha,
      titulo:        examMap[r.id_examen] || ''
    }));

    res.json(results);
  } catch (err) {
    console.error('Error GET /results/student/:documento:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/results/all — todos los resultados (vista del instructor)
router.get('/all', async (req, res) => {
  try {
    // 1. Traer todos los resultados
    const { data: resultados, error: rErr } = await supabase
      .from('resultados')
      .select('id, id_estudiante, id_examen, puntuacion, respuestas, fecha')
      .order('fecha', { ascending: false });

    if (rErr) throw rErr;
    if (!resultados || resultados.length === 0) return res.json([]);

    // 2. Traer todos los usuarios (indexados por documento)
    const documentos = [...new Set(resultados.map(r => r.id_estudiante))];
    const { data: usuarios, error: uErr } = await supabase
      .from('usuarios')
      .select('nombres, apellidos, documento, programa')
      .in('documento', documentos);

    if (uErr) throw uErr;

    const userMap = {};
    (usuarios || []).forEach(u => { userMap[String(u.documento).trim()] = u; });

    // 3. Traer todos los exámenes involucrados (indexados por id)
    const examIds = [...new Set(resultados.map(r => r.id_examen))];
    const { data: examenes, error: eErr } = await supabase
      .from('examenes')
      .select('id, titulo')
      .in('id', examIds);

    if (eErr) throw eErr;

    const examMap = {};
    (examenes || []).forEach(e => { examMap[e.id] = e.titulo; });

    // 4. Combinar — misma forma que retornaba SQLite
    const combined = resultados.map(r => {
      const u = userMap[String(r.id_estudiante).trim()] || {};
      return {
        id:         r.id,
        nombres:    u.nombres    || '',
        apellidos:  u.apellidos  || '',
        documento:  u.documento  || r.id_estudiante,
        programa:   u.programa   || '',
        titulo:     examMap[r.id_examen] || '',
        puntuacion: r.puntuacion,
        respuestas: r.respuestas,
        fecha:      r.fecha,
        id_examen:  r.id_examen
      };
    });

    res.json(combined);
  } catch (err) {
    console.error('Error GET /results/all:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/results/check-today?documento=...&idExamen=... — verificar si ya rindió hoy
router.get('/check-today', async (req, res) => {
  const { documento, idExamen } = req.query;
  if (!documento || !idExamen) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const { data, error } = await supabase
      .from('resultados')
      .select('id')
      .eq('id_estudiante', documento)
      .eq('id_examen', Number(idExamen))
      .gte('fecha', today.toISOString())
      .lt('fecha', tomorrow.toISOString());

    if (error) throw error;
    res.json({ hasExamToday: data.length > 0 });
  } catch (err) {
    console.error('Error GET /results/check-today:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/results/:id — eliminar resultado (para permitir reintento)
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('resultados')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Error DELETE /results/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
