'use strict';

const express = require('express');
const router  = express.Router();
const { supabase } = require('../db');

// POST /api/workshop-results — guardar entrega del estudiante (sin puntuación aún)
router.post('/', async (req, res) => {
  const { id_estudiante, id_taller, respuestas } = req.body;
  const fecha = new Date().toISOString();
  try {
    const { error } = await supabase
      .from('resultados_taller')
      .insert({
        id_estudiante,
        id_taller:  Number(id_taller),
        respuestas: JSON.stringify(respuestas),
        puntuacion: null,
        fecha
      });

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Error POST /workshop-results:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workshop-results/student/:documento — entregas de un estudiante
router.get('/student/:documento', async (req, res) => {
  try {
    const { data: resultados, error: rErr } = await supabase
      .from('resultados_taller')
      .select('id, id_estudiante, id_taller, respuestas, puntuacion, fecha')
      .eq('id_estudiante', req.params.documento)
      .order('fecha', { ascending: false });

    if (rErr) throw rErr;
    if (!resultados || resultados.length === 0) return res.json([]);

    // Traer títulos de los talleres
    const tallerIds = [...new Set(resultados.map(r => r.id_taller))];
    const { data: talleres, error: tErr } = await supabase
      .from('talleres')
      .select('id, titulo')
      .in('id', tallerIds);

    if (tErr) throw tErr;

    const tallerMap = {};
    (talleres || []).forEach(t => { tallerMap[t.id] = t.titulo; });

    const results = resultados.map(r => ({
      id:            r.id,
      id_estudiante: r.id_estudiante,
      id_taller:     r.id_taller,
      puntuacion:    r.puntuacion,
      respuestas:    r.respuestas,
      fecha:         r.fecha,
      titulo:        tallerMap[r.id_taller] || '',
      tipo:          'taller'
    }));

    res.json(results);
  } catch (err) {
    console.error('Error GET /workshop-results/student/:documento:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workshop-results/all — todos los resultados (instructor)
router.get('/all', async (req, res) => {
  try {
    const { data: resultados, error: rErr } = await supabase
      .from('resultados_taller')
      .select('id, id_estudiante, id_taller, respuestas, puntuacion, fecha')
      .order('fecha', { ascending: false });

    if (rErr) throw rErr;
    if (!resultados || resultados.length === 0) return res.json([]);

    // Usuarios
    const documentos = [...new Set(resultados.map(r => r.id_estudiante))];
    const { data: usuarios, error: uErr } = await supabase
      .from('usuarios')
      .select('nombres, apellidos, documento, programa')
      .in('documento', documentos);

    if (uErr) throw uErr;

    const userMap = {};
    (usuarios || []).forEach(u => { userMap[String(u.documento).trim()] = u; });

    // Talleres
    const tallerIds = [...new Set(resultados.map(r => r.id_taller))];
    const { data: talleres, error: tErr } = await supabase
      .from('talleres')
      .select('id, titulo')
      .in('id', tallerIds);

    if (tErr) throw tErr;

    const tallerMap = {};
    (talleres || []).forEach(t => { tallerMap[t.id] = t.titulo; });

    const combined = resultados.map(r => {
      const u = userMap[String(r.id_estudiante).trim()] || {};
      return {
        id:         r.id,
        nombres:    u.nombres    || '',
        apellidos:  u.apellidos  || '',
        documento:  u.documento  || r.id_estudiante,
        programa:   u.programa   || '',
        titulo:     tallerMap[r.id_taller] || '',
        puntuacion: r.puntuacion,
        respuestas: r.respuestas,
        fecha:      r.fecha,
        id_taller:  r.id_taller
      };
    });

    res.json(combined);
  } catch (err) {
    console.error('Error GET /workshop-results/all:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workshop-results/check-today?documento=&idTaller= — ¿ya entregó hoy?
router.get('/check-today', async (req, res) => {
  const { documento, idTaller } = req.query;
  if (!documento || !idTaller) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const { data, error } = await supabase
      .from('resultados_taller')
      .select('id')
      .eq('id_estudiante', documento)
      .eq('id_taller', Number(idTaller))
      .gte('fecha', today.toISOString())
      .lt('fecha', tomorrow.toISOString());

    if (error) throw error;
    res.json({ hasWorkshopToday: data.length > 0 });
  } catch (err) {
    console.error('Error GET /workshop-results/check-today:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/workshop-results/:id/grade — calificar o re-calificar
router.put('/:id/grade', async (req, res) => {
  const { puntuacion } = req.body;
  if (puntuacion === undefined || puntuacion === null || isNaN(Number(puntuacion))) {
    return res.status(400).json({ error: 'Puntuación inválida' });
  }
  const score = Math.min(5, Math.max(0, Number(puntuacion)));
  try {
    const { error } = await supabase
      .from('resultados_taller')
      .update({ puntuacion: score })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, puntuacion: score });
  } catch (err) {
    console.error('Error PUT /workshop-results/:id/grade:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/workshop-results/:id — eliminar entrega
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('resultados_taller')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Error DELETE /workshop-results/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
