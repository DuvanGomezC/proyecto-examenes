const express = require('express');
const router = express.Router();
const { db } = require('../db');

router.post('/', (req, res) => {
  const { id_estudiante, id_examen, puntuacion, respuestas } = req.body;
  const fecha = new Date().toISOString();
  try {
    const stmt = db.prepare("INSERT INTO resultados (id_estudiante, id_examen, puntuacion, respuestas, fecha) VALUES (?,?,?,?,?)");
    stmt.run(id_estudiante, id_examen, puntuacion, JSON.stringify(respuestas), fecha);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/student/:documento', (req, res) => {
  try {
    const results = db.prepare(`
      SELECT r.*, e.titulo FROM resultados r
      JOIN examenes e ON e.id = r.id_examen
      WHERE r.id_estudiante=? ORDER BY r.fecha DESC
    `).all(req.params.documento);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/all', (req, res) => {
  try {
    const results = db.prepare(`
      SELECT r.id, u.nombres, u.apellidos, u.documento, u.programa,
             e.titulo, r.puntuacion, r.respuestas, r.fecha, r.id_examen
      FROM resultados r
      JOIN usuarios u ON u.documento = r.id_estudiante
      JOIN examenes e ON e.id = r.id_examen
      ORDER BY r.fecha DESC
    `).all();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/check-today', (req, res) => {
  const { documento, idExamen } = req.query;
  if (!documento || !idExamen) return res.status(400).json({ error: 'Missing parameters' });
  try {
    const result = db.prepare("SELECT id FROM resultados WHERE id_estudiante=? AND id_examen=? AND date(fecha)=date('now')").all(documento, idExamen);
    res.json({ hasExamToday: result.length > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const stmt = db.prepare("DELETE FROM resultados WHERE id = ?");
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
