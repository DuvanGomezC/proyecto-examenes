const express = require('express');
const router = express.Router();
const { db, sha256 } = require('../db');

function sanitizeText(str) { return typeof str === 'string' ? str.trim().replace(/[<>]/g, '') : ''; }
function sanitizeNumeric(str) { return typeof str === 'string' ? str.replace(/\\D/g, '') : String(str).replace(/\\D/g, ''); }

router.get('/', (req, res) => {
  try {
    const users = db.prepare("SELECT id, nombres, apellidos, documento, programa, rol, estado FROM usuarios ORDER BY rol, apellidos").all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  const { nombres, apellidos, documento, contrasena, programa, rol, estado } = req.body;
  try {
    const hash = sha256(contrasena);
    const stmt = db.prepare(`
      INSERT INTO usuarios (nombres, apellidos, documento, contrasena, programa, rol, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      sanitizeText(nombres), sanitizeText(apellidos), sanitizeNumeric(documento),
      hash, programa, rol, estado || 'Activo'
    );
    res.json({ id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const id = req.params.id;
  const { nombres, apellidos, documento, contrasena, programa, rol, estado } = req.body;
  try {
    let stmt;
    if (contrasena) {
      const hash = sha256(contrasena);
      stmt = db.prepare(`UPDATE usuarios SET nombres=?, apellidos=?, documento=?, contrasena=?, programa=?, rol=?, estado=? WHERE id=?`);
      stmt.run(sanitizeText(nombres), sanitizeText(apellidos), sanitizeNumeric(documento), hash, programa, rol, estado, id);
    } else {
      stmt = db.prepare(`UPDATE usuarios SET nombres=?, apellidos=?, documento=?, programa=?, rol=?, estado=? WHERE id=?`);
      stmt.run(sanitizeText(nombres), sanitizeText(apellidos), sanitizeNumeric(documento), programa, rol, estado, id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', (req, res) => {
  const id = req.params.id;
  const { estado } = req.body;
  try {
    db.prepare("UPDATE usuarios SET estado=? WHERE id=?").run(estado, id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    db.prepare("DELETE FROM usuarios WHERE id=?").run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
