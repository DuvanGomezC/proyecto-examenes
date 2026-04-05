const express = require('express');
const router = express.Router();
const { db } = require('../db');

function sanitizeText(str) { return typeof str === 'string' ? str.trim().replace(/[<>]/g, '') : ''; }

router.get('/', (req, res) => {
  try {
    const exams = db.prepare("SELECT id, titulo, estado, fecha_creacion FROM examenes ORDER BY id DESC").all();
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/active', (req, res) => {
  try {
    const exam = db.prepare("SELECT * FROM examenes WHERE estado='Habilitado' LIMIT 1").get();
    if (exam) exam.preguntas = JSON.parse(exam.preguntas);
    res.json(exam || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const exam = db.prepare("SELECT * FROM examenes WHERE id=?").get(req.params.id);
    if (exam) exam.preguntas = JSON.parse(exam.preguntas);
    res.json(exam || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  const { titulo, preguntas } = req.body;
  const fecha = new Date().toISOString();
  try {
    const stmt = db.prepare("INSERT INTO examenes (titulo, preguntas, estado, fecha_creacion) VALUES (?, ?, 'Deshabilitado', ?)");
    const info = stmt.run(sanitizeText(titulo), JSON.stringify(preguntas), fecha);
    res.json({ id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/enable', (req, res) => {
  const id = req.params.id;
  try {
    db.exec("UPDATE examenes SET estado='Deshabilitado'");
    db.prepare("UPDATE examenes SET estado='Habilitado' WHERE id=?").run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/disable', (req, res) => {
  const id = req.params.id;
  try {
    db.prepare("UPDATE examenes SET estado='Deshabilitado' WHERE id=?").run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    db.prepare("DELETE FROM examenes WHERE id=?").run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
