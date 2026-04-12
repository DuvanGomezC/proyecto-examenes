/**
 * backend/db.js — INARFOTEC Exam System
 * Cliente Supabase para el backend (usa service_role → ignora RLS).
 * Exporta: { supabase, sha256 }
 */

'use strict';

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// ── Validar variables de entorno ────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  Faltan variables de entorno: SUPABASE_URL y/o SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// ── Cliente Supabase con service_role (acceso total, seguro desde server) ───
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// ── Utilidad: hash SHA-256 para contraseñas ─────────────────────────────────
function sha256(message) {
  return crypto.createHash('sha256').update(message).digest('hex');
}

// ── Seed: asegurar que el usuario admin exista al iniciar ───────────────────
async function seedAdmin() {
  try {
    const { data: existing } = await supabase
      .from('usuarios')
      .select('id')
      .eq('documento', '1106899671')
      .maybeSingle();

    if (!existing) {
      const hash = sha256('Arcade20044$');
      const { error } = await supabase.from('usuarios').insert({
        nombres:    'Duvan Gomez Cortes',
        apellidos:  '',
        documento:  '1106899671',
        contrasena: hash,
        programa:   'Mecánica Automotriz',
        rol:        'Instructor',
        estado:     'Activo'
      });
      if (error) {
        console.error('⚠️  Error al crear usuario admin:', error.message);
      } else {
        console.log('✅  Usuario admin creado correctamente.');
      }
    }
  } catch (e) {
    console.error('⚠️  Error en seedAdmin:', e.message);
  }
}

seedAdmin();

module.exports = { supabase, sha256 };
