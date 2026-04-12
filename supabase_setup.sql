-- ============================================================
--  INARFOTEC — Script de Inicialización de Base de Datos
--  Ejecutar en: Supabase Dashboard → SQL Editor
--  Descripción: Crea las tablas del sistema de exámenes con los
--               mismos campos de la BD SQLite original, habilita
--               RLS y configura políticas de seguridad.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. TABLA: usuarios
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.usuarios (
  id         BIGSERIAL PRIMARY KEY,
  nombres    TEXT        NOT NULL,
  apellidos  TEXT        NOT NULL,
  documento  TEXT        NOT NULL UNIQUE,
  contrasena TEXT        NOT NULL,
  programa   TEXT        NOT NULL
               CHECK (programa IN ('Operación de Maquinaria','Mecánica Diesel','Mecánica Automotriz')),
  rol        TEXT        NOT NULL
               CHECK (rol IN ('Estudiante','Instructor')),
  estado     TEXT        NOT NULL DEFAULT 'Activo'
               CHECK (estado IN ('Activo','Inactivo'))
);

-- ─────────────────────────────────────────────────────────────
-- 2. TABLA: examenes
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.examenes (
  id             BIGSERIAL   PRIMARY KEY,
  titulo         TEXT        NOT NULL,
  preguntas      TEXT        NOT NULL,   -- JSON serializado
  estado         TEXT        NOT NULL DEFAULT 'Deshabilitado'
                   CHECK (estado IN ('Habilitado','Deshabilitado')),
  fecha_creacion TEXT        NOT NULL    -- ISO 8601 string (ej: 2024-04-12T15:00:00.000Z)
);

-- ─────────────────────────────────────────────────────────────
-- 3. TABLA: resultados
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resultados (
  id            BIGSERIAL   PRIMARY KEY,
  id_estudiante TEXT        NOT NULL,    -- documento del estudiante
  id_examen     BIGINT      NOT NULL REFERENCES public.examenes(id) ON DELETE CASCADE,
  puntuacion    REAL        NOT NULL,
  respuestas    TEXT        NOT NULL,    -- JSON serializado
  fecha         TEXT        NOT NULL     -- ISO 8601 string
);

-- ─────────────────────────────────────────────────────────────
-- 4. HABILITAR ROW LEVEL SECURITY (RLS)
--    Las tablas están protegidas: solo el backend (service_role)
--    puede acceder. Los clientes anónimos no tienen acceso directo.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.usuarios   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examenes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resultados ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 5. POLÍTICAS RLS
--    Se crean políticas para el rol "service_role" (backend) que
--    permiten acceso completo (SELECT, INSERT, UPDATE, DELETE).
--    El rol "anon" (cliente público) NO tiene ningún acceso,
--    garantizando que nadie pueda leer/escribir la BD directamente
--    desde el frontend o desde herramientas externas sin autenticación.
-- ─────────────────────────────────────────────────────────────

-- ── Políticas para: usuarios ──────────────────────────────────
CREATE POLICY "service_role_select_usuarios"
  ON public.usuarios FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "service_role_insert_usuarios"
  ON public.usuarios FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "service_role_update_usuarios"
  ON public.usuarios FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_delete_usuarios"
  ON public.usuarios FOR DELETE
  TO service_role
  USING (true);

-- ── Políticas para: examenes ──────────────────────────────────
CREATE POLICY "service_role_select_examenes"
  ON public.examenes FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "service_role_insert_examenes"
  ON public.examenes FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "service_role_update_examenes"
  ON public.examenes FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_delete_examenes"
  ON public.examenes FOR DELETE
  TO service_role
  USING (true);

-- ── Políticas para: resultados ────────────────────────────────
CREATE POLICY "service_role_select_resultados"
  ON public.resultados FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "service_role_insert_resultados"
  ON public.resultados FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "service_role_update_resultados"
  ON public.resultados FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_delete_resultados"
  ON public.resultados FOR DELETE
  TO service_role
  USING (true);

-- ─────────────────────────────────────────────────────────────
-- 6. SEED: Usuario Administrador Inicial
--    La contraseña es el SHA-256 de 'Arcade20044$'
--    Hash: 0d4d...  (calculado por el backend en Node.js)
--    Se usa ON CONFLICT DO NOTHING para que sea idempotente:
--    si ya existe el admin, no falla ni lo duplica.
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.usuarios (nombres, apellidos, documento, contrasena, programa, rol, estado)
VALUES (
  'Duvan Gomez Cortes',
  '',
  '1106899671',
  encode(sha256('Arcade20044$'::bytea), 'hex'),
  'Mecánica Automotriz',
  'Instructor',
  'Activo'
)
ON CONFLICT (documento) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- ✅ Script completado. Verifica en Table Editor que las
--    tablas aparezcan con sus columnas y que el usuario admin
--    esté en la tabla 'usuarios'.
-- ─────────────────────────────────────────────────────────────
