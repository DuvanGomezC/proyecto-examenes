/**
 * auth.js — INARFOTEC Exam System
 * Session management, login, logout, route guards.
 */

const SESSION_KEY = 'inarfotec_session';

// ─── Session ──────────────────────────────────────────────────────────────────
function setSession(user) {
  const safeUser = {
    id: user.id,
    nombres: user.nombres,
    apellidos: user.apellidos,
    documento: user.documento,
    programa: user.programa,
    rol: user.rol,
    estado: user.estado
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
}

function getCurrentUser() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ─── Login ────────────────────────────────────────────────────────────────────
async function login(documento, contrasena) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documento, contrasena })
    });
    const data = await res.json();
    if (data.ok) {
      setSession(data.user);
    }
    return data;
  } catch (err) {
    return { ok: false, error: 'Error de conexión con el servidor.' };
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
function logout() {
  clearSession();
  window.location.hash = '#login';
}

// ─── Route Guards ─────────────────────────────────────────────────────────────
/**
 * Call at the top of any protected view.
 * @param {string|null} requiredRole - 'Instructor' | 'Estudiante' | null (any authenticated)
 * @returns {boolean} true if allowed
 */
async function requireAuth(requiredRole = null) {
  const user = getCurrentUser();
  if (!user) {
    window.location.hash = '#login';
    return false;
  }
  // Revalidate against DB (status might have changed)
  try {
    const res = await fetch(`/api/auth/me?documento=${user.documento}`);
    const data = await res.json();
    const dbUser = data.user;
    if (!dbUser || dbUser.estado === 'Inactivo') {
      clearSession();
      window.location.hash = '#login';
      return false;
    }
    if (requiredRole && user.rol !== requiredRole) {
      // Redirect to correct dashboard
      window.location.hash = user.rol === 'Instructor' ? '#instructor-dashboard' : '#student-dashboard';
      return false;
    }
    return true;
  } catch {
    // If offline, trust session temporarily
     return true;
  }
}

function isLoggedIn() {
  return getCurrentUser() !== null;
}

// Export
window.Auth = { login, logout, getCurrentUser, requireAuth, isLoggedIn, clearSession };
