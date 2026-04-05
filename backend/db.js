const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'database', 'inarfotec.db');
const db = new Database(dbPath, { verbose: null });

// Setup schema
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    nombres   TEXT    NOT NULL,
    apellidos TEXT    NOT NULL,
    documento TEXT    NOT NULL UNIQUE,
    contrasena TEXT   NOT NULL,
    programa  TEXT    NOT NULL CHECK(programa IN ('Operación de Maquinaria','Mecánica Diesel','Mecánica Automotriz')),
    rol       TEXT    NOT NULL CHECK(rol IN ('Estudiante','Instructor')),
    estado    TEXT    NOT NULL DEFAULT 'Activo' CHECK(estado IN ('Activo','Inactivo'))
  );
  CREATE TABLE IF NOT EXISTS examenes (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo         TEXT    NOT NULL,
    preguntas      TEXT    NOT NULL,
    estado         TEXT    NOT NULL DEFAULT 'Deshabilitado' CHECK(estado IN ('Habilitado','Deshabilitado')),
    fecha_creacion TEXT    NOT NULL
  );
  CREATE TABLE IF NOT EXISTS resultados (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    id_estudiante TEXT   NOT NULL,
    id_examen    INTEGER NOT NULL,
    puntuacion   REAL    NOT NULL,
    respuestas   TEXT    NOT NULL,
    fecha        TEXT    NOT NULL
  );
`);

// Helper: SHA-256 for passwords
function sha256(message) {
  return crypto.createHash('sha256').update(message).digest('hex');
}

// Seed admin user
try {
  const existing = db.prepare("SELECT id FROM usuarios WHERE documento='1106899671'").get();
  if (!existing) {
    const hash = sha256('Arcade20044$');
    db.prepare(`
      INSERT INTO usuarios (nombres, apellidos, documento, contrasena, programa, rol, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('Duvan Gomez Cortes', '', '1106899671', hash, 'Mecánica Automotriz', 'Instructor', 'Activo');
  }
} catch (e) {
  console.error("Error seeding admin:", e);
}

module.exports = { db, sha256 };
