/**
 * ui-render.js — INARFOTEC Exam System
 * SPA Router + all view renderers.
 */

// ─── Router ───────────────────────────────────────────────────────────────────
const ROUTES = {
  '#login': renderLogin,
  '#student-dashboard': renderStudentDashboard,
  '#exam-engine': renderExamEngine,
  '#instructor-dashboard': renderInstructorDashboard,
};

function router() {
  const hash = window.location.hash || '#login';
  const render = ROUTES[hash];
  if (render) {
    render();
  } else {
    window.location.hash = '#login';
  }
}

window.addEventListener('hashchange', router);

function getApp() { return document.getElementById('app'); }

// ─── Shared Helpers ───────────────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span class="toast__icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span> ${message}`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast--show'));
  setTimeout(() => {
    toast.classList.remove('toast--show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

function showModal(htmlContent, onMount) {
  const existing = document.querySelector('.modal-overlay');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${htmlContent}</div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('modal-overlay--show'));
  overlay.addEventListener('click', async e => { if (e.target === overlay) closeModal(); });
  if (onMount) onMount(overlay.querySelector('.modal'));
}

function closeModal() {
  const overlay = document.querySelector('.modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('modal-overlay--show');
  setTimeout(() => overlay.remove(), 300);
}

window.showModal = showModal;
window.showConfirm = function(message) {
  return new Promise((resolve) => {
    showModal(`
      <div style="text-align:center; padding: 20px;">
        <h3 style="margin-bottom: 15px; color: #333;">Confirmar Acción</h3>
        <p style="margin-bottom: 20px; font-size: 1.1rem; color: #555;">${message}</p>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button class="btn btn--outline" id="confirm-cancel">Cancelar</button>
          <button class="btn btn--danger" id="confirm-ok">Sí, Confirmar</button>
        </div>
      </div>
    `, () => {
      document.getElementById('confirm-cancel')?.addEventListener('click', () => {
        closeModal();
        resolve(false);
      });
      document.getElementById('confirm-ok')?.addEventListener('click', () => {
        closeModal();
        resolve(true);
      });
      const overlay = document.querySelector('.modal-overlay');
      if (overlay) {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            closeModal();
            resolve(false);
          }
        });
      }
    });
  });
};

// ─── LOGIN VIEW ──────────────────────────────────────────────────────────────
function renderLogin() {
  const user = Auth.getCurrentUser();
  if (user) {
    window.location.hash = user.rol === 'Instructor' ? '#instructor-dashboard' : '#student-dashboard';
    return;
  }
  getApp().innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <div class="login-card__header">
          <img src="assets/logo.png" alt="INARFOTEC Logo" class="login-logo" onerror="this.style.display='none'">
          <div>
            <h1 class="login-title">INARFOTEC</h1>
            <p class="login-subtitle">Sistema de Gestión de Exámenes</p>
          </div>
        </div>
        <div class="login-card__body">
          <h2>Iniciar Sesión</h2>
          <p class="login-instructions">Ingresa con tu número de documento como usuario y contraseña.</p>
          <form id="login-form" novalidate>
            <div class="form-group">
              <label for="login-doc">Número de Documento</label>
              <input type="text" id="login-doc" placeholder="Ej: 1106864839"
                inputmode="numeric" pattern="[0-9]+" autocomplete="username" maxlength="15" required>
            </div>
            <div class="form-group">
              <label for="login-pwd">Contraseña</label>
              <div class="input-eye-wrap">
                <input type="password" id="login-pwd" placeholder="Contraseña" autocomplete="current-password" required>
                <button type="button" class="eye-btn" id="toggle-pwd" aria-label="Ver contraseña">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>
            <div id="login-error" class="form-error" aria-live="polite"></div>
            <button type="submit" class="btn btn--primary btn--full" id="login-btn">
              <span class="btn-text">Ingresar</span>
              <span class="btn-spinner hidden"></span>
            </button>
          </form>
        </div>
        <div class="login-card__footer">
          <p>Instituto Araucano de Formación Técnica &copy; ${new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('toggle-pwd').addEventListener('click', async () => {
    const p = document.getElementById('login-pwd');
    p.type = p.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('login-doc').addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\D/g, '');
  });

  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const doc = document.getElementById('login-doc').value.trim();
    const pwd = document.getElementById('login-pwd').value;
    const errEl = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');

    btn.disabled = true;
    btn.querySelector('.btn-text').classList.add('hidden');
    btn.querySelector('.btn-spinner').classList.remove('hidden');
    errEl.textContent = '';

    const result = await Auth.login(doc, pwd);

    btn.disabled = false;
    btn.querySelector('.btn-text').classList.remove('hidden');
    btn.querySelector('.btn-spinner').classList.add('hidden');

    if (!result.ok) {
      errEl.textContent = result.error;
    } else {
      window.location.hash = result.user.rol === 'Instructor' ? '#instructor-dashboard' : '#student-dashboard';
    }
  });
}

// ─── STUDENT DASHBOARD ────────────────────────────────────────────────────────
async function renderStudentDashboard() {
  if (!(await Auth.requireAuth('Estudiante'))) return;
  const user = Auth.getCurrentUser();
  const allResults = await DB.getResultsByStudent(user.documento);
  const activeExam = await DB.getActiveExam();

  // Show history only if result is older than 24h
  const now = new Date();
  const history = allResults.filter(r => {
    const diff = now - new Date(r.fecha);
    return diff >= 24 * 60 * 60 * 1000;
  });

  let examBtnHtml = '';
  if (!activeExam) {
    examBtnHtml = `<button class="btn btn--outline" disabled>Sin examen activo</button>`;
  } else if (await DB.studentHasExamToday(user.documento, activeExam.id)) {
    examBtnHtml = `<button class="btn btn--outline" disabled>Ya realizaste el examen hoy</button>`;
  } else {
    examBtnHtml = `<button class="btn btn--primary" id="start-exam-btn">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      Realizar Examen
    </button>`;
  }

  const historyHtml = history.length === 0
    ? `<div class="empty-state"><div class="empty-state__icon">📋</div><p>No tienes resultados anteriores aún.<br><small>Los resultados se muestran 24 horas después de presentar el examen.</small></p></div>`
    : `<div class="table-responsive"><table class="data-table">
        <thead><tr><th>Módulo / Examen</th><th>Puntaje</th><th>Fecha</th><th>Estado</th></tr></thead>
        <tbody>${history.map(r => `
          <tr>
            <td>${r.titulo}</td>
            <td><strong>${parseFloat(r.puntuacion).toFixed(1)}</strong> / 5.0</td>
            <td>${formatDate(r.fecha)}</td>
            <td><span class="badge ${parseFloat(r.puntuacion) >= 3.5 ? 'badge--success' : 'badge--danger'}">${parseFloat(r.puntuacion) >= 3.5 ? 'Aprobado' : 'No Aprobado'}</span></td>
          </tr>`).join('')}
        </tbody>
      </table></div>`;

  getApp().innerHTML = `
    <div class="dashboard">
      <nav class="topbar">
        <div class="topbar__brand">
          <img src="assets/logo.png" alt="Logo" class="topbar__logo" onerror="this.style.display='none'">
          <span>INARFOTEC</span>
        </div>
        <div class="topbar__user">
          <span class="topbar__name">${user.nombres}</span>
          <span class="badge badge--info">${user.programa}</span>
          <button class="btn btn--ghost btn--sm" id="logout-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Cerrar Sesión
          </button>
        </div>
      </nav>
      <main class="dashboard__main">
        <div class="page-header">
          <div>
            <h1>Bienvenido, ${user.nombres}</h1>
            <p class="text-muted">Documento: ${user.documento} &bull; ${user.programa}</p>
          </div>
          ${examBtnHtml}
        </div>
        <section class="card">
          <div class="card__header">
            <h2>Historial de Resultados</h2>
            <small class="text-muted">Visible 24h después de presentar el examen</small>
          </div>
          <div class="card__body">${historyHtml}</div>
        </section>
      </main>
    </div>
  `;

  document.getElementById('logout-btn')?.addEventListener('click', () => Auth.logout());
  document.getElementById('start-exam-btn')?.addEventListener('click', async () => {
    window.location.hash = '#exam-engine';
  });
}

// ─── EXAM ENGINE ──────────────────────────────────────────────────────────────
let _examState = null;

async function renderExamEngine() {
  if (!(await Auth.requireAuth('Estudiante'))) return;
  const user = Auth.getCurrentUser();
  const rawExam = await DB.getActiveExam();

  if (!rawExam) {
    showToast('No hay examen activo en este momento.', 'info');
    window.location.hash = '#student-dashboard';
    return;
  }

  if (await DB.studentHasExamToday(user.documento, rawExam.id)) {
    showToast('Ya realizaste el examen hoy.', 'info');
    window.location.hash = '#student-dashboard';
    return;
  }

  // Shuffle questions and options (anti-plagiarism)
  const exam = DB.shuffleExamQuestions(rawExam);

  _examState = {
    exam,
    current: 0,
    answers: {},   // { questionId: selectedOptionId }
    user,
  };

  window.AntiFraud?.start(() => submitExam());

  await renderExamQuestion();
}

async function renderExamQuestion() {
  const { exam, current, answers } = _examState;
  const q = exam.preguntas[current];
  const total = exam.preguntas.length;
  const progress = Math.round(((current) / total) * 100);
  const isLast = current === total - 1;
  const selectedAnswer = answers[q.id];

  let optionsHtml = '';
  if (q.tipo === 'vf') {
    optionsHtml = ['Verdadero', 'Falso'].map(opt => `
      <label class="option-label ${selectedAnswer === opt ? 'option-label--selected' : ''}">
        <input type="radio" name="q_answer" value="${opt}" ${selectedAnswer === opt ? 'checked' : ''}>
        <span class="option-marker">${opt === 'Verdadero' ? 'V' : 'F'}</span>
        <span>${opt}</span>
      </label>`).join('');
  } else {
    const labels = ['A', 'B', 'C', 'D'];
    optionsHtml = q.opciones.map((opt, i) => `
      <label class="option-label ${selectedAnswer === opt.id ? 'option-label--selected' : ''}">
        <input type="radio" name="q_answer" value="${opt.id}" ${selectedAnswer === opt.id ? 'checked' : ''}>
        <span class="option-marker">${labels[i]}</span>
        <span>${opt.texto}</span>
      </label>`).join('');
  }

  getApp().innerHTML = `
    <div class="exam-page">
      <header class="exam-header">
        <div class="exam-header__left">
          <img src="assets/logo.png" alt="Logo" class="topbar__logo" onerror="this.style.display='none'">
          <div>
            <span class="exam-title">${exam.titulo}</span>
            <span class="exam-meta">${_examState.user.nombres}</span>
          </div>
        </div>
        <div class="exam-header__counter">
          <span class="counter-badge">Pregunta ${current + 1} <em>de</em> ${total}</span>
        </div>
      </header>
      <div class="exam-progress-bar"><div class="exam-progress-bar__fill" style="width:${progress}%"></div></div>
      <main class="exam-main">
        <div class="question-card">
          <p class="question-number">Pregunta ${current + 1}</p>
          <h2 class="question-text">${q.texto}</h2>
          <div class="options-list" id="options-list">
            ${optionsHtml}
          </div>
        </div>
        <div class="exam-nav">
          <button class="btn btn--outline" id="prev-btn" ${current === 0 ? 'disabled' : ''}>
            ← Atrás
          </button>
          <button class="btn btn--primary" id="next-btn" ${!selectedAnswer ? 'disabled' : ''}>
            ${isLast ? 'Finalizar ✓' : 'Siguiente →'}
          </button>
        </div>
      </main>
    </div>
  `;

  // Option selection
  document.getElementById('options-list').addEventListener('change', e => {
    if (e.target.name === 'q_answer') {
      _examState.answers[q.id] = e.target.value;
      document.getElementById('next-btn').disabled = false;
      document.querySelectorAll('.option-label').forEach(l => l.classList.remove('option-label--selected'));
      e.target.closest('.option-label').classList.add('option-label--selected');
    }
  });

  document.getElementById('prev-btn')?.addEventListener('click', async () => {
    if (_examState.current > 0) { _examState.current--; await renderExamQuestion(); }
  });

  document.getElementById('next-btn')?.addEventListener('click', async () => {
    if (isLast) {
      submitExam();
    } else {
      _examState.current++;
      await renderExamQuestion();
    }
  });
}

async function submitExam() {
  const { exam, answers, user } = _examState;
  let correct = 0;
  exam.preguntas.forEach(q => {
    if (answers[q.id] === q.respuesta_correcta) correct++;
  });
  const score = correct * 0.5;

  window.AntiFraud?.stop();

  await DB.saveResult(user.documento, exam.id, score, answers);

  // Show result modal then logout
  const passed = score >= 3.5;
  showModal(`
    <div class="result-modal" style="position:relative;">
      <button class="modal__close" id="exam-modal-close" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #555;">✕</button>
      <div class="result-modal__icon ${passed ? 'result-modal__icon--pass' : 'result-modal__icon--fail'}">
        ${passed ? '🏆' : '📚'}
      </div>
      <h2>${passed ? '¡Felicitaciones!' : 'Examen Finalizado'}</h2>
      <p class="result-modal__student">${user.nombres} ${user.apellidos}</p>
      <div class="score-display">
        <span class="score-display__number ${passed ? 'score-display__number--pass' : 'score-display__number--fail'}">${score.toFixed(1)}</span>
        <span class="score-display__denom">/ 5.0</span>
      </div>
      <p>${correct} de ${exam.preguntas.length} respuestas correctas</p>
      <p class="result-modal__status ${passed ? 'text-success' : 'text-danger'}">
        ${passed ? '✓ APROBADO' : '✗ NO APROBADO'}
      </p>
      <p class="text-muted" style="font-size:0.8rem;margin-top:12px;">Tu sesión se cerrará automáticamente en <span id="countdown">5</span> segundos.</p>
    </div>
  `, () => {
    let secs = 5;
    const timer = setInterval(() => {
      secs--;
      const cd = document.getElementById('countdown');
      if (cd) cd.textContent = secs;
      if (secs <= 0) {
        clearInterval(timer);
        Auth.logout();
      }
    }, 1000);

    const closeHandler = () => {
      clearInterval(timer);
      closeModal();
      window.location.hash = '#student-dashboard';
    };

    const closeBtn = document.getElementById('exam-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeHandler);

    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeHandler();
      });
    }
  });
}

// ─── INSTRUCTOR DASHBOARD ─────────────────────────────────────────────────────
async function renderInstructorDashboard() {
  if (!(await Auth.requireAuth('Instructor'))) return;
  const user = Auth.getCurrentUser();
  const activeTab = window._activeTab || 'users';

  getApp().innerHTML = `
    <div class="dashboard">
      <nav class="topbar">
        <div class="topbar__brand">
          <img src="assets/logo.png" alt="Logo" class="topbar__logo" onerror="this.style.display='none'">
          <span>INARFOTEC <em>Admin</em></span>
        </div>
        <div class="topbar__user">
          <span class="topbar__name">${user.nombres}</span>
          <span class="badge badge--warning">Instructor</span>
          <button class="btn btn--ghost btn--sm" id="logout-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Cerrar Sesión
          </button>
        </div>
      </nav>
      <div class="tabs-bar">
        <button class="tab-btn ${activeTab==='users'?'tab-btn--active':''}" data-tab="users">👥 Usuarios</button>
        <button class="tab-btn ${activeTab==='exams'?'tab-btn--active':''}" data-tab="exams">📝 Exámenes</button>
        <button class="tab-btn ${activeTab==='results'?'tab-btn--active':''}" data-tab="results">📊 Resultados</button>
      </div>
      <main class="dashboard__main" id="tab-content"></main>
    </div>
  `;

  document.getElementById('logout-btn')?.addEventListener('click', () => Auth.logout());
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      window._activeTab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-btn--active'));
      btn.classList.add('tab-btn--active');
      renderTabContent(btn.dataset.tab);
    });
  });

  await renderTabContent(activeTab);
}

async function renderTabContent(tab) {
  if (tab === 'users') await renderUsersTab();
  else if (tab === 'exams') await renderExamsTab();
  else if (tab === 'results') await renderResultsTab();
}

// ─── USERS TAB ────────────────────────────────────────────────────────────────
async function renderUsersTab() {
  const users = await DB.getAllUsers();
  const currentUser = Auth.getCurrentUser();
  const content = document.getElementById('tab-content');

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Gestión de Usuarios</h1>
        <p class="text-muted">${users.length} usuario(s) registrado(s)</p>
      </div>
      <button class="btn btn--primary" id="create-user-btn">+ Nuevo Usuario</button>
    </div>
    <div class="card">
      <div class="card__body">
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr>
              <th>Documento</th><th>Nombres</th><th>Apellidos</th>
              <th>Programa</th><th>Rol</th><th>Estado</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              ${users.length === 0 ? `<tr><td colspan="7" class="text-center text-muted">No hay usuarios registrados.</td></tr>` : ''}
              ${users.map(u => `
                <tr>
                  <td><code>${u.documento}</code></td>
                  <td>${u.nombres}</td>
                  <td>${u.apellidos}</td>
                  <td><span class="badge badge--info">${u.programa}</span></td>
                  <td><span class="badge ${u.rol === 'Instructor' ? 'badge--warning' : 'badge--secondary'}">${u.rol}</span></td>
                  <td><span class="badge ${u.estado === 'Activo' ? 'badge--success' : 'badge--danger'}">${u.estado}</span></td>
                  <td class="actions-cell">
                    <button class="btn btn--ghost btn--sm" data-action="edit" data-id="${u.id}" title="Editar">✏️</button>
                    ${u.documento !== currentUser.documento
                      ? `<button class="btn btn--ghost btn--sm" data-action="toggle" data-id="${u.id}" data-estado="${u.estado}" title="${u.estado === 'Activo' ? 'Inactivar' : 'Activar'}">
                          ${u.estado === 'Activo' ? '🔒' : '🔓'}
                         </button>
                         <button class="btn btn--ghost btn--sm" data-action="delete" data-id="${u.id}" data-nombre="${u.nombres} ${u.apellidos}" title="Eliminar">🗑️</button>`
                      : `<span class="text-muted" title="Mi cuenta">—</span>`}
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById('create-user-btn').addEventListener('click', async () => await openUserModal());
  document.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', async () => await openUserModal(parseInt(btn.dataset.id)));
  });
  document.querySelectorAll('[data-action="toggle"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const newStatus = btn.dataset.estado === 'Activo' ? 'Inactivo' : 'Activo';
      await DB.toggleUserStatus(parseInt(btn.dataset.id), newStatus);
      showToast(`Usuario ${newStatus === 'Activo' ? 'activado' : 'inactivado'} correctamente.`);
      await renderUsersTab();
    });
  });
  document.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (await window.showConfirm(`¿Eliminar a ${btn.dataset.nombre}? Esta acción no se puede deshacer.`)) {
        await DB.deleteUser(parseInt(btn.dataset.id));
        showToast('Usuario eliminado.', 'info');
        await renderUsersTab();
      }
    });
  });
}

async function openUserModal(userId = null) {
  let existing = null;
  if (userId) existing = (await DB.getAllUsers()).find(u => u.id === userId);

  const programas = ['Operación de Maquinaria', 'Mecánica Diesel', 'Mecánica Automotriz'];
  const title = userId ? 'Editar Usuario' : 'Nuevo Usuario';

  showModal(`
    <div class="modal__header">
      <h3>${title}</h3>
      <button class="modal__close" id="modal-close">✕</button>
    </div>
    <form id="user-form" novalidate>
      <div class="form-grid">
        <div class="form-group">
          <label>Nombres <span class="required">*</span></label>
          <input type="text" id="u-nombres" value="${existing?.nombres||''}" placeholder="Nombres completos" required>
        </div>
        <div class="form-group">
          <label>Apellidos <span class="required">*</span></label>
          <input type="text" id="u-apellidos" value="${existing?.apellidos||''}" placeholder="Apellidos completos" required>
        </div>
        <div class="form-group">
          <label>Documento (CC) <span class="required">*</span></label>
          <input type="text" id="u-documento" value="${existing?.documento||''}" placeholder="Solo números" inputmode="numeric" pattern="[0-9]+" required>
        </div>
        <div class="form-group">
          <label>${userId ? 'Nueva Contraseña (dejar vacío = sin cambio)' : 'Contraseña'} <span class="required">${userId?'':'*'}</span></label>
          <input type="password" id="u-contrasena" placeholder="${userId ? 'Dejar vacío para no cambiar' : 'Contraseña'}">
        </div>
        <div class="form-group">
          <label>Programa Técnico <span class="required">*</span></label>
          <select id="u-programa">
            ${programas.map(p => `<option value="${p}" ${existing?.programa===p?'selected':''}>${p}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Rol <span class="required">*</span></label>
          <select id="u-rol">
            <option value="Estudiante" ${existing?.rol==='Estudiante'?'selected':''}>Estudiante</option>
            <option value="Instructor" ${existing?.rol==='Instructor'?'selected':''}>Instructor</option>
          </select>
        </div>
        <div class="form-group">
          <label>Estado</label>
          <select id="u-estado">
            <option value="Activo" ${(!existing||existing.estado==='Activo')?'selected':''}>Activo</option>
            <option value="Inactivo" ${existing?.estado==='Inactivo'?'selected':''}>Inactivo</option>
          </select>
        </div>
      </div>
      <div id="user-form-error" class="form-error"></div>
      <div class="modal__footer">
        <button type="button" class="btn btn--outline" id="modal-close-2">Cancelar</button>
        <button type="submit" class="btn btn--primary">Guardar</button>
      </div>
    </form>
  `, () => {
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-close-2').addEventListener('click', closeModal);
    document.getElementById('u-documento').addEventListener('input', e => {
      e.target.value = e.target.value.replace(/\D/g, '');
    });

    document.getElementById('user-form').addEventListener('submit', async e => {
      e.preventDefault();
      const errEl = document.getElementById('user-form-error');
      errEl.textContent = '';

      const data = {
        nombres: document.getElementById('u-nombres').value.trim(),
        apellidos: document.getElementById('u-apellidos').value.trim(),
        documento: document.getElementById('u-documento').value.trim(),
        contrasena: document.getElementById('u-contrasena').value,
        programa: document.getElementById('u-programa').value,
        rol: document.getElementById('u-rol').value,
        estado: document.getElementById('u-estado').value,
      };

      if (!data.nombres || !data.apellidos || !data.documento) {
        errEl.textContent = 'Nombres, apellidos y documento son obligatorios.'; return;
      }
      if (!/^\d+$/.test(data.documento)) {
        errEl.textContent = 'El documento debe contener solo números.'; return;
      }
      if (!userId && !data.contrasena) {
        errEl.textContent = 'La contraseña es obligatoria para nuevos usuarios.'; return;
      }

      try {
        if (userId) {
          await DB.updateUser(userId, data);
          showToast('Usuario actualizado correctamente.');
        } else {
          await DB.createUser(data);
          showToast('Usuario creado correctamente.');
        }
        closeModal();
        window._activeTab = 'users';
        await renderUsersTab();
      } catch(err) {
        errEl.textContent = 'Error: El documento ya existe.';
      }
    });
  });
}

// ─── EXAMS TAB ────────────────────────────────────────────────────────────────
async function renderExamsTab() {
  const exams = await DB.getAllExams();
  const content = document.getElementById('tab-content');

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Gestión de Exámenes</h1>
        <p class="text-muted">${exams.length} examen(es) creado(s) &bull; Solo puede haber 1 habilitado a la vez</p>
      </div>
      <button class="btn btn--primary" id="create-exam-btn">+ Crear Examen</button>
    </div>
    <div class="card">
      <div class="card__body">
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>ID</th><th>Título / Módulo</th><th>Estado</th><th>Fecha Creación</th><th>Acciones</th></tr></thead>
            <tbody>
              ${exams.length === 0 ? `<tr><td colspan="5" class="text-center text-muted">No hay exámenes creados.</td></tr>` : ''}
              ${exams.map(ex => `
                <tr>
                  <td>#${ex.id}</td>
                  <td><strong>${ex.titulo}</strong></td>
                  <td><span class="badge ${ex.estado==='Habilitado'?'badge--success':'badge--secondary'}">${ex.estado}</span></td>
                  <td>${formatDate(ex.fecha_creacion)}</td>
                  <td class="actions-cell">
                    ${ex.estado === 'Deshabilitado'
                      ? `<button class="btn btn--sm btn--success" data-action="enable" data-id="${ex.id}">✓ Habilitar</button>`
                      : `<button class="btn btn--sm btn--outline" data-action="disable" data-id="${ex.id}">⊘ Deshabilitar</button>`}
                    <button class="btn btn--ghost btn--sm" data-action="delete-exam" data-id="${ex.id}" data-titulo="${ex.titulo}" title="Eliminar">🗑️</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById('create-exam-btn').addEventListener('click', async () => await openExamModal());
  document.querySelectorAll('[data-action="enable"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await DB.enableExam(parseInt(btn.dataset.id));
      showToast('Examen habilitado. Todos los demás fueron deshabilitados.');
      await renderExamsTab();
    });
  });
  document.querySelectorAll('[data-action="disable"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await DB.disableExam(parseInt(btn.dataset.id));
      showToast('Examen deshabilitado.', 'info');
      await renderExamsTab();
    });
  });
  document.querySelectorAll('[data-action="delete-exam"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (await window.showConfirm(`¿Eliminar el examen "${btn.dataset.titulo}"?`)) {
        await DB.deleteExam(parseInt(btn.dataset.id));
        showToast('Examen eliminado.', 'info');
        await renderExamsTab();
      }
    });
  });
}

async function openExamModal() {
  const questionsHtml = Array.from({ length: 10 }, (_, i) => `
    <details class="question-block" open="${i === 0 ? 'open' : ''}">
      <summary class="question-block__summary">
        <span class="q-number">Pregunta ${i + 1}</span>
        <span class="q-preview" id="q-preview-${i}">Sin texto</span>
      </summary>
      <div class="question-block__body">
        <div class="form-group">
          <label>Texto de la pregunta <span class="required">*</span></label>
          <textarea id="q-texto-${i}" rows="2" placeholder="Escribe la pregunta aquí..." class="q-texto"></textarea>
        </div>
        <div class="form-group">
          <label>Tipo de pregunta</label>
          <select id="q-tipo-${i}" class="q-tipo" data-idx="${i}">
            <option value="vf">Verdadero / Falso</option>
            <option value="multiple">Opción Múltiple (A,B,C,D)</option>
          </select>
        </div>
        <div id="q-options-${i}" class="q-options-container">
          ${renderVFOptions(i, null)}
        </div>
        <p class="text-muted" style="font-size:0.76rem;margin-top:4px;">Puntaje: 0.5 pts por respuesta correcta</p>
      </div>
    </details>
  `).join('');

  showModal(`
    <div class="modal__header">
      <h3>Crear Nuevo Examen</h3>
      <button class="modal__close" id="modal-close">✕</button>
    </div>
    <form id="exam-form" novalidate>
      <div class="form-group">
        <label>Título del módulo / Examen <span class="required">*</span></label>
        <input type="text" id="exam-titulo" placeholder="Ej: Módulo 1 - Motores Diesel" required>
      </div>
      <div class="questions-list">${questionsHtml}</div>
      <div id="exam-form-error" class="form-error"></div>
      <div class="modal__footer">
        <button type="button" class="btn btn--outline" id="modal-close-2">Cancelar</button>
        <button type="submit" class="btn btn--primary">Guardar Examen</button>
      </div>
    </form>
  `, () => {
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-close-2').addEventListener('click', closeModal);

    // Update preview text on textarea change
    document.querySelectorAll('.q-texto').forEach((ta, i) => {
      ta.addEventListener('input', () => {
        const preview = document.getElementById(`q-preview-${i}`);
        if (preview) preview.textContent = ta.value.trim() || 'Sin texto';
      });
    });

    // Tipo change handler
    document.querySelectorAll('.q-tipo').forEach(sel => {
      sel.addEventListener('change', () => {
        const idx = parseInt(sel.dataset.idx);
        const container = document.getElementById(`q-options-${idx}`);
        container.innerHTML = sel.value === 'vf'
          ? renderVFOptions(idx, null)
          : renderMultipleOptions(idx, null);
      });
    });

    document.getElementById('exam-form').addEventListener('submit', async e => {
      e.preventDefault();
      const errEl = document.getElementById('exam-form-error');
      errEl.textContent = '';
      const titulo = document.getElementById('exam-titulo').value.trim();
      if (!titulo) { errEl.textContent = 'El título es obligatorio.'; return; }

      const preguntas = [];
      for (let i = 0; i < 10; i++) {
        const texto = document.getElementById(`q-texto-${i}`).value.trim();
        const tipo = document.getElementById(`q-tipo-${i}`).value;
        if (!texto) { errEl.textContent = `La pregunta ${i + 1} no tiene texto.`; return; }

        const pregunta = {
          id: `q${i}`,
          texto,
          tipo,
        };

        if (tipo === 'vf') {
          const checked = document.querySelector(`input[name="vf-correct-${i}"]:checked`);
          if (!checked) { errEl.textContent = `Selecciona la respuesta correcta en la pregunta ${i+1}.`; return; }
          pregunta.respuesta_correcta = checked.value;
        } else {
          const opciones = [];
          let correcta = null;
          const labels = ['A','B','C','D'];
          for (let j = 0; j < 4; j++) {
            const textoOpt = document.getElementById(`q${i}-opt-${j}`)?.value.trim();
            if (!textoOpt) { errEl.textContent = `Completa todas las opciones de la pregunta ${i+1}.`; return; }
            opciones.push({ id: `q${i}-opt-${j}`, texto: textoOpt, label: labels[j] });
            if (document.getElementById(`q${i}-correct-${j}`)?.checked) correcta = `q${i}-opt-${j}`;
          }
          if (!correcta) { errEl.textContent = `Selecciona la respuesta correcta en la pregunta ${i+1}.`; return; }
          pregunta.opciones = opciones;
          pregunta.respuesta_correcta = correcta;
        }
        preguntas.push(pregunta);
      }

      await DB.createExam(titulo, preguntas);
      showToast('Examen creado correctamente. Puedes habilitarlo en la tabla.');
      closeModal();
      await renderExamsTab();
    });
  });
}

function renderVFOptions(idx, correcta) {
  return `
    <div class="vf-options">
      <label class="option-check-label">
        <input type="radio" name="vf-correct-${idx}" value="Verdadero" ${correcta==='Verdadero'?'checked':''}>
        <span class="option-marker">V</span> Verdadero &mdash; es la respuesta correcta
      </label>
      <label class="option-check-label">
        <input type="radio" name="vf-correct-${idx}" value="Falso" ${correcta==='Falso'?'checked':''}>
        <span class="option-marker">F</span> Falso &mdash; es la respuesta correcta
      </label>
    </div>
  `;
}

function renderMultipleOptions(idx, q) {
  const labels = ['A','B','C','D'];
  return `
    <div class="multiple-options">
      ${labels.map((l, j) => `
        <div class="multiple-option-row">
          <span class="option-marker">${l}</span>
          <input type="text" id="q${idx}-opt-${j}" placeholder="Opción ${l}" value="${q?.opciones?.[j]?.texto||''}">
          <label class="correct-check" title="Respuesta correcta">
            <input type="checkbox" id="q${idx}-correct-${j}" name="correct-${idx}" value="${j}"
              ${q?.respuesta_correcta===`q${idx}-opt-${j}`?'checked':''}
              onchange="(function(el,idx){document.querySelectorAll('[name=\\'correct-'+idx+'\\']').forEach(c=>c!==el&&(c.checked=false))})(this,${idx})">
            ✓ Correcta
          </label>
        </div>`).join('')}
    </div>
  `;
}

// ─── RESULTS TAB ──────────────────────────────────────────────────────────────
async function renderResultsTab() {
  const results = await DB.getAllResults();
  const exams = await DB.getAllExams();
  
  // Group results by exam ID
  const grouped = {};
  results.forEach(r => {
    if (!grouped[r.id_examen]) grouped[r.id_examen] = [];
    grouped[r.id_examen].push(r);
  });

  const content = document.getElementById('tab-content');

  if (window._activeExamResult) {
    const examId = window._activeExamResult;
    const examResults = grouped[examId] || [];
    const examTitle = exams.find(e => e.id == examId)?.titulo || 'Examen Desconocido';
    
    content.innerHTML = `
      <div class="page-header">
        <div>
          <button class="btn btn--outline btn--sm" id="back-to-exams-btn" style="margin-bottom:8px;">← Volver</button>
          <h1>Resultados: ${examTitle}</h1>
          <p class="text-muted">${examResults.length} estudiante(s) evaluados</p>
        </div>
        <button class="btn btn--outline" id="refresh-results-btn">↻ Actualizar</button>
      </div>
      <div class="card">
        <div class="card__body">
          <div class="table-responsive">
            <table class="data-table">
              <thead><tr>
                <th>Estudiante</th><th>Documento</th><th>Programa</th>
                <th>Puntaje</th><th>Fecha</th><th>Acciones</th>
              </tr></thead>
              <tbody>
                ${examResults.length === 0 ? `<tr><td colspan="6" class="text-center text-muted">No hay resultados.</td></tr>` : ''}
                ${examResults.map(r => `
                  <tr>
                    <td>${r.nombres} ${r.apellidos}</td>
                    <td><code>${r.documento}</code></td>
                    <td><span class="badge badge--info">${r.programa}</span></td>
                    <td>
                      <span class="score-pill ${parseFloat(r.puntuacion)>=3.0?'score-pill--pass':'score-pill--fail'}">
                        ${parseFloat(r.puntuacion).toFixed(1)} / 5.0
                      </span>
                    </td>
                    <td>${formatDate(r.fecha)}</td>
                    <td class="actions-cell">
                      <button class="btn btn--sm btn--primary" data-action="pdf-result" data-rid="${r.id}" data-doc="${r.documento}" data-examid="${r.id_examen}">
                        📄 PDF
                      </button>
                      <button class="btn btn--sm btn--outline" style="border-color:#e63946; color:#e63946;" data-action="delete-result" data-rid="${r.id}" data-estudiante="${r.nombres} ${r.apellidos}">
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById('back-to-exams-btn')?.addEventListener('click', async () => {
      window._activeExamResult = null;
      await renderResultsTab();
    });

    document.getElementById('refresh-results-btn')?.addEventListener('click', async () => await renderResultsTab());

    document.querySelectorAll('[data-action="pdf-result"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const resultado = (await DB.getAllResults()).find(r => String(r.id) === btn.dataset.rid);
        const student = await DB.getUserByDocumento(btn.dataset.doc);
        const exam = await DB.getExamById(parseInt(btn.dataset.examid));
        if (resultado && student && exam) {
          if (typeof resultado.respuestas === 'string') resultado.respuestas = JSON.parse(resultado.respuestas);
          await PDFGen.generateResultPDF(resultado, student, exam);
        } else {
          showToast('No se pudo generar el PDF.', 'error');
        }
      });
    });

    document.querySelectorAll('[data-action="delete-result"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (await window.showConfirm(`¿Eliminar el resultado de ${btn.dataset.estudiante}? Esto le permitirá presentar el examen nuevamente.`)) {
          await DB.deleteResult(parseInt(btn.dataset.rid));
          showToast('Resultado eliminado correctamente.', 'info');
          await renderResultsTab();
        }
      });
    });

  } else {
    const examsSummary = Object.keys(grouped).map(idExamen => {
      const g = grouped[idExamen];
      const examObj = exams.find(e => String(e.id) === idExamen);
      return {
        id: idExamen,
        titulo: examObj?.titulo || 'Examen ' + idExamen,
        total: g.length
      };
    });

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1>Exámenes Evaluados</h1>
          <p class="text-muted">Selecciona un examen para ver a los estudiantes y sus resultados.</p>
        </div>
        <button class="btn btn--outline" id="refresh-results-btn">↻ Actualizar</button>
      </div>
      <div class="card">
        <div class="card__body">
          <div class="table-responsive">
            <table class="data-table">
              <thead><tr>
                <th>Módulo / Examen</th><th>Estudiantes Evaluados</th><th>Acciones</th>
              </tr></thead>
              <tbody>
                ${examsSummary.length === 0 ? `<tr><td colspan="3" class="text-center text-muted">Aún no hay exámenes evaluados.</td></tr>` : ''}
                ${examsSummary.map(es => `
                  <tr>
                    <td><strong>${es.titulo}</strong></td>
                    <td>${es.total} estudiante(s)</td>
                    <td class="actions-cell">
                      <button class="btn btn--sm btn--primary" data-action="view-exam" data-examid="${es.id}">
                        📂 Ver Resultados
                      </button>
                      <button class="btn btn--sm btn--outline" data-action="pdf-clean" data-examid="${es.id}">
                        🖨️ En Limpio
                      </button>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById('refresh-results-btn')?.addEventListener('click', async () => await renderResultsTab());
    
    document.querySelectorAll('[data-action="view-exam"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        window._activeExamResult = parseInt(btn.dataset.examid);
        await renderResultsTab();
      });
    });

    document.querySelectorAll('[data-action="pdf-clean"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const exam = await DB.getExamById(parseInt(btn.dataset.examid));
        if (exam) await PDFGen.generateCleanExamPDF(exam);
        else showToast('Examen no encontrado.', 'error');
      });
    });
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const day = String(d.getDate()).padStart(2,'0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const h = String(d.getHours()).padStart(2,'0');
  const m = String(d.getMinutes()).padStart(2,'0');
  return `${day} ${month} ${year}, ${h}:${m}`;
}
