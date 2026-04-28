/**
 * ui-render.js — INARFOTEC Exam System
 * SPA Router + all view renderers.
 */

// ─── Router ───────────────────────────────────────────────────────────────────
const ROUTES = {
  '#login': renderLogin,
  '#student-dashboard': renderStudentDashboard,
  '#exam-engine': renderExamEngine,
  '#workshop-engine': renderWorkshopEngine,
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
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span class="toast__icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span> ${escapeHtml(message)}`;
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

  const [allResults, allWorkshopResults, activeExam, activeWorkshop] = await Promise.all([
    DB.getResultsByStudent(user.documento),
    DB.getWorkshopResultsByStudent(user.documento),
    DB.getActiveExam(),
    DB.getActiveWorkshop()
  ]);

  const now = new Date();
  const examHistory = allResults.filter(r => (now - new Date(r.fecha)) >= 24 * 60 * 60 * 1000);
  const workshopHistory = allWorkshopResults.filter(r => (now - new Date(r.fecha)) >= 24 * 60 * 60 * 1000);

  const combined = [
    ...examHistory.map(r => ({ ...r, tipo: 'examen' })),
    ...workshopHistory.map(r => ({ ...r, tipo: 'taller' }))
  ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  // Exam button
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

  // Workshop button
  let workshopBtnHtml = '';
  if (!activeWorkshop) {
    workshopBtnHtml = `<button class="btn btn--outline" style="border-color:#7c3aed;color:#7c3aed;" disabled>Sin taller activo</button>`;
  } else if (await DB.studentHasWorkshopToday(user.documento, activeWorkshop.id)) {
    workshopBtnHtml = `<button class="btn btn--outline" style="border-color:#7c3aed;color:#7c3aed;" disabled>Ya entregaste el taller hoy</button>`;
  } else {
    workshopBtnHtml = `<button class="btn btn--primary" id="start-workshop-btn" style="background:#7c3aed;border-color:#7c3aed;">
      📋 Realizar Taller
    </button>`;
  }

  const historyHtml = combined.length === 0
    ? `<div class="empty-state"><div class="empty-state__icon">📋</div><p>No tienes resultados anteriores aún.<br><small>Los resultados se muestran 24 horas después de presentar.</small></p></div>`
    : `<div class="table-responsive"><table class="data-table">
        <thead><tr><th>Tipo</th><th>Módulo / Actividad</th><th>Puntaje</th><th>Fecha</th><th>Estado</th></tr></thead>
        <tbody>${combined.map(r => {
          const isTaller = r.tipo === 'taller';
          const score = (r.puntuacion !== null && r.puntuacion !== undefined) ? parseFloat(r.puntuacion) : null;
          const scoreHtml = isTaller
            ? (score === null ? '<span class="badge badge--secondary">—</span>' : `<strong>${score.toFixed(1)}</strong> / 5.0`)
            : `<strong>${score !== null ? score.toFixed(1) : '0.0'}</strong> / 5.0`;
          const statusHtml = isTaller
            ? (score === null
                ? `<span class="badge badge--secondary">⏳ Calificando...</span>`
                : `<span class="badge ${score >= 3.5 ? 'badge--success' : 'badge--danger'}">${score >= 3.5 ? 'Aprobado' : 'No Aprobado'}</span>`)
            : `<span class="badge ${score !== null && score > 3.0 ? 'badge--success' : 'badge--danger'}">${score !== null && score > 3.0 ? 'Aprobado' : 'No Aprobado'}</span>`;
          return `
          <tr>
            <td><span class="badge ${isTaller ? 'badge--workshop' : 'badge--info'}">${isTaller ? '📋 Taller' : '📝 Examen'}</span></td>
            <td>${escapeHtml(r.titulo)}</td>
            <td>${scoreHtml}</td>
            <td>${formatDate(r.fecha)}</td>
            <td>${statusHtml} ${r.motivo_modificacion ? `
              <button class="btn btn--sm btn--ghost" data-action="view-modification-detail" 
                data-motivo="${escapeHtml(r.motivo_modificacion)}" 
                title="Ver motivo de modificación" style="padding:0; margin-left:4px;">
                📄
              </button>` : ''}
            </td>
          </tr>`;
        }).join('')}
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
          <span class="topbar__name">${escapeHtml(user.nombres)}</span>
          <span class="badge badge--info">${escapeHtml(user.programa)}</span>
          <button class="btn btn--ghost btn--sm" id="logout-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Cerrar Sesión
          </button>
        </div>
      </nav>
      <main class="dashboard__main">
        <div class="page-header">
          <div>
            <h1>Bienvenido, ${escapeHtml(user.nombres)}</h1>
            <p class="text-muted">Documento: ${escapeHtml(user.documento)} &bull; ${escapeHtml(user.programa)}</p>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
            ${examBtnHtml}
            ${workshopBtnHtml}
          </div>
        </div>
        <section class="card">
          <div class="card__header">
            <h2>Historial de Notas</h2>
            <small class="text-muted">Visible 24h después de presentar &bull; Talleres: nota asignada por el instructor</small>
          </div>
          <div class="card__body">${historyHtml}</div>
        </section>
      </main>
    </div>
  `;

  document.querySelectorAll('[data-action="view-modification-detail"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const motivo = btn.dataset.motivo;
      showModal(`
        <div class="modal__header">
          <h3>Detalle de Modificación</h3>
          <button class="modal__close" id="detail-modal-close">✕</button>
        </div>
        <div style="padding:16px 20px;">
          <p style="margin-bottom:8px; font-weight:600; color:#7c3aed;">Motivo / Nota adicional:</p>
          <div style="background:#f8f9fa; border:1px solid #e5e7eb; border-radius:8px; padding:16px; font-size:1rem; color:#444; white-space:pre-wrap;">${motivo}</div>
        </div>
        <div class="modal__footer">
          <button class="btn btn--outline" id="detail-modal-close-2">Cerrar</button>
        </div>`, () => {
        document.getElementById('detail-modal-close')?.addEventListener('click', closeModal);
        document.getElementById('detail-modal-close-2')?.addEventListener('click', closeModal);
      });
    });
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => Auth.logout());
  document.getElementById('start-exam-btn')?.addEventListener('click', async () => {
    window.location.hash = '#exam-engine';
  });
  document.getElementById('start-workshop-btn')?.addEventListener('click', async () => {
    window.location.hash = '#workshop-engine';
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
            <span class="exam-title">${escapeHtml(exam.titulo)}</span>
            <span class="exam-meta">${escapeHtml(_examState.user.nombres)}</span>
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
  const passed = score > 3.0;
  showModal(`
    <div class="result-modal" style="position:relative;">
      <button class="modal__close" id="exam-modal-close" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #555;">✕</button>
      <div class="result-modal__icon ${passed ? 'result-modal__icon--pass' : 'result-modal__icon--fail'}">
        ${passed ? '🏆' : '📚'}
      </div>
      <h2>${passed ? '¡Felicitaciones!' : 'Examen Finalizado'}</h2>
      <p class="result-modal__student">${escapeHtml(user.nombres)} ${escapeHtml(user.apellidos)}</p>
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
          <span class="topbar__name">${escapeHtml(user.nombres)}</span>
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
        <button class="tab-btn ${activeTab==='workshops'?'tab-btn--active':''}" data-tab="workshops">📋 Talleres</button>
        <button class="tab-btn ${activeTab==='workshop-results'?'tab-btn--active':''}" data-tab="workshop-results">🗂️ Resultados Talleres</button>
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
  else if (tab === 'workshops') await renderWorkshopsTab();
  else if (tab === 'workshop-results') await renderWorkshopResultsTab();
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
                  <td><code>${escapeHtml(u.documento)}</code></td>
                  <td>${escapeHtml(u.nombres)}</td>
                  <td>${escapeHtml(u.apellidos)}</td>
                  <td><span class="badge badge--info">${escapeHtml(u.programa)}</span></td>
                  <td><span class="badge ${u.rol === 'Instructor' ? 'badge--warning' : 'badge--secondary'}">${u.rol}</span></td>
                  <td><span class="badge ${u.estado === 'Activo' ? 'badge--success' : 'badge--danger'}">${u.estado}</span></td>
                  <td class="actions-cell">
                    <button class="btn btn--ghost btn--sm" data-action="edit" data-id="${u.id}" title="Editar">✏️</button>
                    ${u.documento !== currentUser.documento
                      ? `<button class="btn btn--ghost btn--sm" data-action="toggle" data-id="${u.id}" data-estado="${u.estado}" title="${u.estado === 'Activo' ? 'Inactivar' : 'Activar'}">
                          ${u.estado === 'Activo' ? '🔒' : '🔓'}
                         </button>
                         <button class="btn btn--ghost btn--sm" data-action="delete" data-id="${u.id}" data-nombre="${escapeHtml(u.nombres)} ${escapeHtml(u.apellidos)}" title="Eliminar">🗑️</button>`
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
                  <td><strong>${escapeHtml(ex.titulo)}</strong></td>
                  <td><span class="badge ${ex.estado==='Habilitado'?'badge--success':'badge--secondary'}">${ex.estado}</span></td>
                  <td>${formatDate(ex.fecha_creacion)}</td>
                  <td class="actions-cell">
                    ${ex.estado === 'Deshabilitado'
                      ? `<button class="btn btn--sm btn--success" data-action="enable" data-id="${ex.id}">✓ Habilitar</button>`
                      : `<button class="btn btn--sm btn--outline" data-action="disable" data-id="${ex.id}">⊘ Deshabilitar</button>`}
                    <button class="btn btn--ghost btn--sm" data-action="delete-exam" data-id="${ex.id}" data-titulo="${escapeHtml(ex.titulo)}" title="Eliminar">🗑️</button>
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
          <h1>Resultados: ${escapeHtml(examTitle)}</h1>
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
                    <td>${escapeHtml(r.nombres)} ${escapeHtml(r.apellidos)}</td>
                    <td><code>${escapeHtml(r.documento)}</code></td>
                    <td><span class="badge badge--info">${escapeHtml(r.programa)}</span></td>
                    <td>
                      <span class="score-pill ${parseFloat(r.puntuacion) > 3.0 ? 'score-pill--pass' : 'score-pill--fail'}">
                        ${parseFloat(r.puntuacion).toFixed(1)} / 5.0
                      </span>
                    </td>
                    <td>${formatDate(r.fecha)}</td>
                    <td class="actions-cell">
                      <button class="btn btn--sm btn--primary" data-action="pdf-result" data-rid="${r.id}" data-doc="${escapeHtml(r.documento)}" data-examid="${r.id_examen}">
                        📄 PDF
                      </button>
                      <button class="btn btn--sm btn--primary" data-action="modify-exam-score" 
                        data-rid="${r.id}" 
                        data-nombres="${escapeHtml(r.nombres)} ${escapeHtml(r.apellidos)}"
                        data-score="${r.puntuacion}"
                        style="background:#f59e0b; border-color:#f59e0b;">
                        ✏️ Modificar
                      </button>
                      ${r.motivo_modificacion ? `
                        <button class="btn btn--sm btn--ghost" data-action="view-modification-detail" 
                          data-motivo="${escapeHtml(r.motivo_modificacion)}" 
                          title="Ver motivo de modificación" style="color:#7c3aed;">
                          👁️
                        </button>` : ''}
                      <button class="btn btn--sm btn--outline" style="border-color:#e63946; color:#e63946;" data-action="delete-result" data-rid="${r.id}" data-estudiante="${escapeHtml(r.nombres)} ${escapeHtml(r.apellidos)}">
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

    document.querySelectorAll('[data-action="view-modification-detail"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const motivo = btn.dataset.motivo;
        showModal(`
          <div class="modal__header">
            <h3>Detalle de Modificación</h3>
            <button class="modal__close" id="detail-modal-close">✕</button>
          </div>
          <div style="padding:16px 20px;">
            <p style="margin-bottom:8px; font-weight:600; color:#7c3aed;">Motivo / Nota adicional:</p>
            <div style="background:#f8f9fa; border:1px solid #e5e7eb; border-radius:8px; padding:16px; font-size:1rem; color:#444; white-space:pre-wrap;">${motivo}</div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--outline" id="detail-modal-close-2">Cerrar</button>
          </div>
        `, () => {
          document.getElementById('detail-modal-close')?.addEventListener('click', closeModal);
          document.getElementById('detail-modal-close-2')?.addEventListener('click', closeModal);
        });
      });
    });

    document.querySelectorAll('[data-action="modify-exam-score"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const rid = btn.dataset.rid;
        const nombres = btn.dataset.nombres;
        const currentScore = btn.dataset.score;
        showModal(`
          <div class="modal__header">
            <h3>Modificar Nota de Examen</h3>
            <button class="modal__close" id="mod-modal-close">✕</button>
          </div>
          <div style="padding:8px 20px 16px;">
            <p style="margin-bottom:16px; color:#555;">Estudiante: <strong>${nombres}</strong></p>
            <div class="form-group">
              <label>Nueva Calificación (0.0 — 5.0) <span class="required">*</span></label>
              <input type="number" id="mod-score-input" min="0" max="5" step="0.1" value="${currentScore}" style="font-size:1.4rem; text-align:center; font-weight:700;">
            </div>
            <div class="form-group">
              <label>Motivo de modificación (Ej: Recuperación) <span class="required">*</span></label>
              <textarea id="mod-reason-input" rows="2" placeholder="Explique por qué se modifica la nota..."></textarea>
            </div>
          </div>
          <div id="mod-error" class="form-error"></div>
          <div class="modal__footer">
            <button class="btn btn--outline" id="mod-modal-close-2">Cancelar</button>
            <button class="btn btn--primary" id="mod-submit-btn" style="background:#f59e0b; border-color:#f59e0b;">Guardar Modificación</button>
          </div>
        `, () => {
          document.getElementById('mod-modal-close')?.addEventListener('click', closeModal);
          document.getElementById('mod-modal-close-2')?.addEventListener('click', closeModal);
          document.getElementById('mod-submit-btn')?.addEventListener('click', async () => {
            const errEl = document.getElementById('mod-error');
            const scoreVal = parseFloat(document.getElementById('mod-score-input').value);
            const reasonVal = document.getElementById('mod-reason-input').value.trim();
            
            if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 5) {
              errEl.textContent = 'Ingresa una nota válida entre 0.0 y 5.0.';
              return;
            }
            if (!reasonVal) {
              errEl.textContent = 'Debes ingresar un motivo para la modificación.';
              return;
            }
            
            try {
              await DB.updateExamResult(parseInt(rid), scoreVal, reasonVal);
              showToast('Nota modificada correctamente.');
              closeModal();
              await renderResultsTab();
            } catch (err) {
              errEl.textContent = 'Error al modificar la nota.';
            }
          });
        });
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
                    <td><strong>${escapeHtml(es.titulo)}</strong></td>
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

// ─── WORKSHOPS TAB (INSTRUCTOR) ───────────────────────────────────────────────
async function renderWorkshopsTab() {
  const workshops = await DB.getAllWorkshops();
  const content = document.getElementById('tab-content');

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Gestión de Talleres</h1>
        <p class="text-muted">${workshops.length} taller(es) creado(s) &bull; Solo puede haber 1 habilitado a la vez</p>
      </div>
      <button class="btn btn--primary" id="create-workshop-btn" style="background:#7c3aed;border-color:#7c3aed;">+ Crear Taller</button>
    </div>
    <div class="card">
      <div class="card__body">
        <div class="table-responsive">
          <table class="data-table">
            <thead><tr><th>ID</th><th>Título</th><th>Estado</th><th>Fecha Creación</th><th>Acciones</th></tr></thead>
            <tbody>
              ${workshops.length === 0 ? `<tr><td colspan="5" class="text-center text-muted">No hay talleres creados.</td></tr>` : ''}
              ${workshops.map(w => `
                <tr>
                  <td>#${w.id}</td>
                  <td><strong>${escapeHtml(w.titulo)}</strong></td>
                  <td><span class="badge ${w.estado === 'Habilitado' ? 'badge--success' : 'badge--secondary'}">${w.estado}</span></td>
                  <td>${formatDate(w.fecha_creacion)}</td>
                  <td class="actions-cell">
                    ${w.estado === 'Deshabilitado'
                      ? `<button class="btn btn--sm btn--success" data-action="enable-ws" data-id="${w.id}">✓ Habilitar</button>`
                      : `<button class="btn btn--sm btn--outline" data-action="disable-ws" data-id="${w.id}">⊘ Deshabilitar</button>`}
                    <button class="btn btn--ghost btn--sm" data-action="delete-ws" data-id="${w.id}" data-titulo="${escapeHtml(w.titulo)}" title="Eliminar">🗑️</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById('create-workshop-btn').addEventListener('click', async () => await openWorkshopModal());
  document.querySelectorAll('[data-action="enable-ws"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await DB.enableWorkshop(parseInt(btn.dataset.id));
      showToast('Taller habilitado. Los demás fueron deshabilitados.');
      await renderWorkshopsTab();
    });
  });
  document.querySelectorAll('[data-action="disable-ws"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await DB.disableWorkshop(parseInt(btn.dataset.id));
      showToast('Taller deshabilitado.', 'info');
      await renderWorkshopsTab();
    });
  });
  document.querySelectorAll('[data-action="delete-ws"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (await window.showConfirm(`¿Eliminar el taller "${btn.dataset.titulo}"?`)) {
        await DB.deleteWorkshop(parseInt(btn.dataset.id));
        showToast('Taller eliminado.', 'info');
        await renderWorkshopsTab();
      }
    });
  });
}

async function openWorkshopModal() {
  let questionCount = 1;

  function buildQuestionHtml(idx) {
    return `
      <details class="question-block" open>
        <summary class="question-block__summary">
          <span class="q-number">Pregunta ${idx + 1}</span>
          <span class="q-preview" id="ws-q-preview-${idx}">Sin texto</span>
          ${idx > 0 ? `<button type="button" class="btn btn--ghost btn--sm ws-remove-q" style="margin-left:auto;color:#e63946;" title="Eliminar">✕</button>` : ''}
        </summary>
        <div class="question-block__body">
          <div class="form-group">
            <label>Texto de la pregunta <span class="required">*</span></label>
            <textarea id="ws-q-texto-${idx}" rows="2" placeholder="Escribe la pregunta aquí..." class="ws-q-texto" data-idx="${idx}"></textarea>
          </div>
          <div class="form-group">
            <label style="margin-bottom:8px;display:block;font-weight:600;">Campos que debe completar el aprendiz: <span class="required">*</span></label>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <label class="option-check-label"><input type="checkbox" class="ws-field-check" id="ws-q${idx}-bio" data-field="bio"><span style="margin-left:6px;">👤 ¿Quién es? / Biografía</span></label>
              <label class="option-check-label"><input type="checkbox" class="ws-field-check" id="ws-q${idx}-que" data-field="que"><span style="margin-left:6px;">❓ ¿Qué es?</span></label>
              <label class="option-check-label"><input type="checkbox" class="ws-field-check" id="ws-q${idx}-para_que" data-field="para_que"><span style="margin-left:6px;">🎯 ¿Para qué sirve?</span></label>
              <label class="option-check-label"><input type="checkbox" class="ws-field-check" id="ws-q${idx}-ejemplo" data-field="ejemplo"><span style="margin-left:6px;">💡 Ejemplo de uso</span></label>
            </div>
            <p class="text-muted" style="font-size:0.76rem;margin-top:6px;">Activa al menos un campo por pregunta.</p>
          </div>
        </div>
      </details>`;
  }

  showModal(`
    <div class="modal__header">
      <h3>Crear Nuevo Taller</h3>
      <button class="modal__close" id="ws-modal-close">✕</button>
    </div>
    <form id="workshop-form" novalidate>
      <div class="form-group">
        <label>Título del Taller <span class="required">*</span></label>
        <input type="text" id="ws-titulo" placeholder="Ej: Taller de Sistemas de Frenos" required>
      </div>
      <div id="ws-questions-list">${buildQuestionHtml(0)}</div>
      <button type="button" class="btn btn--outline" id="ws-add-question-btn" style="margin-top:12px;width:100%;">+ Agregar Pregunta</button>
      <div id="ws-form-error" class="form-error"></div>
      <div class="modal__footer">
        <button type="button" class="btn btn--outline" id="ws-modal-close-2">Cancelar</button>
        <button type="submit" class="btn btn--primary" style="background:#7c3aed;border-color:#7c3aed;">Guardar Taller</button>
      </div>
    </form>
  `, () => {
    document.getElementById('ws-modal-close').addEventListener('click', closeModal);
    document.getElementById('ws-modal-close-2').addEventListener('click', closeModal);

    document.getElementById('ws-q-texto-0')?.addEventListener('input', function() {
      const p = document.getElementById('ws-q-preview-0');
      if (p) p.textContent = this.value.trim() || 'Sin texto';
    });

    document.getElementById('ws-add-question-btn').addEventListener('click', () => {
      const idx = questionCount;
      const list = document.getElementById('ws-questions-list');
      const wrapper = document.createElement('div');
      wrapper.innerHTML = buildQuestionHtml(idx);
      const details = wrapper.firstElementChild;
      list.appendChild(details);
      const ta = document.getElementById(`ws-q-texto-${idx}`);
      const preview = document.getElementById(`ws-q-preview-${idx}`);
      if (ta && preview) ta.addEventListener('input', function() { preview.textContent = this.value.trim() || 'Sin texto'; });
      const removeBtn = details.querySelector('.ws-remove-q');
      if (removeBtn) removeBtn.addEventListener('click', () => details.remove());
      questionCount++;
    });

    document.getElementById('workshop-form').addEventListener('submit', async e => {
      e.preventDefault();
      const errEl = document.getElementById('ws-form-error');
      errEl.textContent = '';
      const titulo = document.getElementById('ws-titulo').value.trim();
      if (!titulo) { errEl.textContent = 'El título es obligatorio.'; return; }

      const questionBlocks = document.querySelectorAll('#ws-questions-list > details.question-block');
      if (questionBlocks.length === 0) { errEl.textContent = 'Agrega al menos una pregunta.'; return; }

      const preguntas = [];
      for (let i = 0; i < questionBlocks.length; i++) {
        const block = questionBlocks[i];
        const textoEl = block.querySelector('.ws-q-texto');
        if (!textoEl) continue;
        const texto = textoEl.value.trim();
        if (!texto) { errEl.textContent = `La pregunta ${i + 1} no tiene texto.`; return; }
        const campos = [];
        block.querySelectorAll('.ws-field-check:checked').forEach(cb => campos.push(cb.dataset.field));
        if (campos.length === 0) { errEl.textContent = `Activa al menos un campo en la pregunta ${i + 1}.`; return; }
        preguntas.push({ id: `wq${i}`, texto, campos });
      }
      try {
        await DB.createWorkshop(titulo, preguntas);
        showToast('Taller creado. Puedes habilitarlo en la tabla.');
        closeModal();
        await renderWorkshopsTab();
      } catch (err) {
        errEl.textContent = 'Error al guardar el taller.';
      }
    });
  });
}

// ─── WORKSHOP RESULTS TAB (INSTRUCTOR) ───────────────────────────────────────
async function renderWorkshopResultsTab() {
  const [results, workshops] = await Promise.all([
    DB.getAllWorkshopResults(),
    DB.getAllWorkshops()
  ]);

  const grouped = {};
  results.forEach(r => {
    const key = String(r.id_taller);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });

  const content = document.getElementById('tab-content');
  const tallerId = window._activeWorkshopResult;

  if (tallerId) {
    const tallerResults = grouped[String(tallerId)] || [];
    const tallerTitle = workshops.find(w => w.id == tallerId)?.titulo || 'Taller Desconocido';

    content.innerHTML = `
      <div class="page-header">
        <div>
          <button class="btn btn--outline btn--sm" id="back-to-ws-list-btn" style="margin-bottom:8px;">← Volver</button>
          <h1>Entregas: ${escapeHtml(tallerTitle)}</h1>
          <p class="text-muted">${tallerResults.length} entrega(s) recibida(s)</p>
        </div>
        <button class="btn btn--outline" id="refresh-ws-results-btn">↻ Actualizar</button>
      </div>
      <div class="card">
        <div class="card__body">
          <div class="table-responsive">
            <table class="data-table">
              <thead><tr>
                <th>Estudiante</th><th>Documento</th><th>Programa</th>
                <th>Calificación</th><th>Fecha Entrega</th><th>Acciones</th>
              </tr></thead>
              <tbody>
                ${tallerResults.length === 0 ? `<tr><td colspan="6" class="text-center text-muted">No hay entregas para este taller.</td></tr>` : ''}
                ${tallerResults.map(r => {
                  const score = (r.puntuacion !== null && r.puntuacion !== undefined) ? parseFloat(r.puntuacion) : null;
                  const scorePill = score === null
                    ? `<span class="badge badge--secondary">⏳ Pendiente</span>`
                    : `<span class="score-pill ${score >= 3.5 ? 'score-pill--pass' : 'score-pill--fail'}">${score.toFixed(1)} / 5.0</span>`;
                  return `
                  <tr>
                    <td>${escapeHtml(r.nombres)} ${escapeHtml(r.apellidos)}</td>
                    <td><code>${escapeHtml(r.documento)}</code></td>
                    <td><span class="badge badge--info">${escapeHtml(r.programa)}</span></td>
                    <td>${scorePill}</td>
                    <td>${formatDate(r.fecha)}</td>
                    <td class="actions-cell">
                      <button class="btn btn--sm btn--outline" data-action="view-ws-resp" data-rid="${r.id}" title="Ver respuestas">👁 Ver</button>
                      <button class="btn btn--sm btn--primary" data-action="grade-ws"
                        data-rid="${r.id}"
                        data-nombres="${escapeHtml(r.nombres)} ${escapeHtml(r.apellidos)}"
                        data-score="${score !== null ? score : ''}"
                        style="${score !== null ? 'background:#f59e0b;border-color:#f59e0b;' : 'background:#7c3aed;border-color:#7c3aed;'}">
                        ${score !== null ? '✏️ Modificar' : '✏️ Calificar'}
                      </button>
                      <button class="btn btn--sm btn--ghost" data-action="delete-ws-result"
                        data-rid="${r.id}"
                        data-nombres="${escapeHtml(r.nombres)} ${escapeHtml(r.apellidos)}"
                        title="Eliminar entrega (dar otra oportunidad)"
                        style="color:#e63946;">
                        🗑️
                      </button>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById('back-to-ws-list-btn')?.addEventListener('click', async () => {
      window._activeWorkshopResult = null;
      await renderWorkshopResultsTab();
    });
    document.getElementById('refresh-ws-results-btn')?.addEventListener('click', async () => await renderWorkshopResultsTab());

    // View responses modal
    document.querySelectorAll('[data-action="view-ws-resp"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const rid = btn.dataset.rid;
        const result = results.find(r => String(r.id) === rid);
        if (!result) { showToast('No se encontró la entrega.', 'error'); return; }
        let respuestas = result.respuestas;
        if (typeof respuestas === 'string') { try { respuestas = JSON.parse(respuestas); } catch(e) { respuestas = {}; } }
        const taller = await DB.getWorkshopById(tallerId);
        if (!taller) { showToast('No se encontró el taller.', 'error'); return; }
        const FL = { bio: '👤 ¿Quién es? / Biografía', que: '❓ ¿Qué es?', para_que: '🎯 ¿Para qué sirve?', ejemplo: '💡 Ejemplo de uso' };
        let respHtml = `<div class="modal__header"><h3>Respuestas — ${escapeHtml(result.nombres)} ${escapeHtml(result.apellidos)}</h3><button class="modal__close" id="ws-resp-close">✕</button></div><div style="max-height:60vh;overflow-y:auto;padding:0 4px;">`;
        (taller.preguntas || []).forEach((q, qi) => {
          const qResp = (respuestas && respuestas[q.id]) ? respuestas[q.id] : {};
          respHtml += `<div style="margin-bottom:18px;padding:14px 16px;background:#f8f9fa;border-radius:10px;border-left:4px solid #7c3aed;"><p style="font-weight:700;margin-bottom:10px;">P${qi+1}: ${escapeHtml(q.texto)}</p>`;
          (q.campos || []).forEach(campo => {
            const val = qResp[campo] || {};
            const texto = typeof val === 'object' ? (val.texto || '') : String(val);
            const foto  = typeof val === 'object' ? (val.foto  || null) : null;
            respHtml += `<div style="margin-bottom:10px;"><p style="font-size:0.8rem;font-weight:600;color:#7c3aed;margin-bottom:4px;">${FL[campo] || campo}</p><div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:10px;white-space:pre-wrap;word-break:break-word;overflow-wrap:break-word;font-size:0.88rem;color:#555;min-height:36px;max-height:260px;overflow-y:auto;">${escapeHtml(texto) || '<em style="opacity:0.5">Sin respuesta</em>'}</div>${foto ? `<img src="${foto}" alt="Foto" style="max-width:100%;margin-top:6px;border-radius:8px;border:1px solid #e5e7eb;display:block;">` : ''}</div>`;
          });
          respHtml += `</div>`;
        });
        respHtml += `</div><div class="modal__footer"><button class="btn btn--outline" id="ws-resp-close-2">Cerrar</button></div>`;
        showModal(respHtml, () => {
          document.getElementById('ws-resp-close')?.addEventListener('click', closeModal);
          document.getElementById('ws-resp-close-2')?.addEventListener('click', closeModal);
        });
      });
    });

    // Grade modal
    document.querySelectorAll('[data-action="grade-ws"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const rid = btn.dataset.rid;
        const nombres = btn.dataset.nombres;
        const currentScore = btn.dataset.score;
        showModal(`
          <div class="modal__header">
            <h3>${currentScore ? 'Modificar Calificación' : 'Calificar Taller'}</h3>
            <button class="modal__close" id="grade-modal-close">✕</button>
          </div>
          <div style="padding:8px 20px 16px;">
            <p style="margin-bottom:16px;color:#555;">Estudiante: <strong>${escapeHtml(nombres)}</strong></p>
            <div class="form-group">
              <label>Calificación (0.0 — 5.0) <span class="required">*</span></label>
              <input type="number" id="grade-input" min="0" max="5" step="0.1" value="${currentScore || ''}" placeholder="Ej: 4.5" style="font-size:1.4rem;text-align:center;font-weight:700;">
            </div>
            <p class="text-muted" style="font-size:0.82rem;">Aprobado: nota mayor o igual a 3.5</p>
          </div>
          <div id="grade-error" class="form-error"></div>
          <div class="modal__footer">
            <button class="btn btn--outline" id="grade-modal-close-2">Cancelar</button>
            <button class="btn btn--primary" id="grade-submit-btn" style="background:#7c3aed;border-color:#7c3aed;">Guardar Calificación</button>
          </div>
        `, () => {
          document.getElementById('grade-modal-close')?.addEventListener('click', closeModal);
          document.getElementById('grade-modal-close-2')?.addEventListener('click', closeModal);
          document.getElementById('grade-submit-btn')?.addEventListener('click', async () => {
            const errEl = document.getElementById('grade-error');
            const val = parseFloat(document.getElementById('grade-input').value);
            if (isNaN(val) || val < 0 || val > 5) { errEl.textContent = 'Ingresa una calificación válida entre 0.0 y 5.0.'; return; }
            try {
              await DB.gradeWorkshopResult(parseInt(rid), val);
              showToast('Calificación guardada correctamente.');
              closeModal();
              await renderWorkshopResultsTab();
            } catch(err) {
              errEl.textContent = 'Error al guardar la calificación.';
            }
          });
        });
      });
    });

    // Delete workshop result (give student another attempt)
    document.querySelectorAll('[data-action="delete-ws-result"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const rid     = btn.dataset.rid;
        const nombres = btn.dataset.nombres;
        const ok = await window.showConfirm(
          `¿Eliminar la entrega de "${nombres}"?\nEl estudiante podrá volver a realizar el taller.`
        );
        if (!ok) return;
        try {
          await DB.deleteWorkshopResult(parseInt(rid));
          showToast(`Entrega de ${nombres} eliminada. El estudiante puede volver a entregar.`, 'info');
          await renderWorkshopResultsTab();
        } catch (err) {
          showToast('Error al eliminar la entrega.', 'error');
        }
      });
    });

  } else {
    // Overview
    const summary = Object.keys(grouped).map(key => {
      const g = grouped[key];
      const wsObj = workshops.find(w => String(w.id) === key);
      const pending = g.filter(r => r.puntuacion === null || r.puntuacion === undefined).length;
      return { id: key, titulo: wsObj?.titulo || 'Taller ' + key, total: g.length, pending };
    });

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1>Resultados de Talleres</h1>
          <p class="text-muted">Selecciona un taller para ver las entregas y calificar.</p>
        </div>
        <button class="btn btn--outline" id="refresh-ws-results-btn">↻ Actualizar</button>
      </div>
      <div class="card">
        <div class="card__body">
          <div class="table-responsive">
            <table class="data-table">
              <thead><tr><th>Taller</th><th>Entregas</th><th>Pendientes</th><th>Acciones</th></tr></thead>
              <tbody>
                ${summary.length === 0 ? `<tr><td colspan="4" class="text-center text-muted">Aún no hay entregas de talleres.</td></tr>` : ''}
                ${summary.map(s => `
                  <tr>
                    <td><strong>${escapeHtml(s.titulo)}</strong></td>
                    <td>${s.total} entrega(s)</td>
                    <td>${s.pending > 0 ? `<span class="badge badge--warning">⏳ ${s.pending} pendiente(s)</span>` : `<span class="badge badge--success">✓ Al día</span>`}</td>
                    <td class="actions-cell">
                      <button class="btn btn--sm btn--primary" data-action="view-ws-results" data-wsid="${s.id}" style="background:#7c3aed;border-color:#7c3aed;">📂 Ver Entregas</button>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById('refresh-ws-results-btn')?.addEventListener('click', async () => await renderWorkshopResultsTab());
    document.querySelectorAll('[data-action="view-ws-results"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        window._activeWorkshopResult = parseInt(btn.dataset.wsid);
        await renderWorkshopResultsTab();
      });
    });
  }
}

// ─── WORKSHOP ENGINE (STUDENT) ────────────────────────────────────────────────
/**
 * Manejo de borradores de taller en localStorage
 */
function getWorkshopDraftKey(documento, workshopId) {
  return `inarfotec_ws_draft_${documento}_${workshopId}`;
}

function saveWorkshopDraft() {
  if (!_workshopState) return;
  try {
    const key = getWorkshopDraftKey(_workshopState.user.documento, _workshopState.workshop.id);
    const data = {
      answers: _workshopState.answers,
      current: _workshopState.current
    };
    localStorage.setItem(key, JSON.stringify(data));
    
    // Feedback visual sutil
    const statusEl = document.getElementById('ws-autosave-status');
    if (statusEl) {
      statusEl.innerHTML = '<span style="color:#10b981;">✓ Autoguardado</span>';
      statusEl.classList.remove('ws-status--saving');
      void statusEl.offsetWidth; // Trigger reflow
      statusEl.classList.add('ws-status--saving');
    }
  } catch (e) {
    console.error('Error al guardar borrador:', e);
  }
}

function clearWorkshopDraft(documento, workshopId) {
  localStorage.removeItem(getWorkshopDraftKey(documento, workshopId));
}

async function renderWorkshopEngine() {
  if (!(await Auth.requireAuth('Estudiante'))) return;
  const user = Auth.getCurrentUser();
  const workshop = await DB.getActiveWorkshop();

  if (!workshop) {
    showToast('No hay taller activo en este momento.', 'info');
    window.location.hash = '#student-dashboard';
    return;
  }
  if (await DB.studentHasWorkshopToday(user.documento, workshop.id)) {
    showToast('Ya entregaste el taller hoy.', 'info');
    window.location.hash = '#student-dashboard';
    return;
  }

  // Intentar cargar borrador
  let savedAnswers = {};
  let savedCurrent = 0;
  try {
    const draft = localStorage.getItem(getWorkshopDraftKey(user.documento, workshop.id));
    if (draft) {
      const parsed = JSON.parse(draft);
      savedAnswers = parsed.answers || {};
      savedCurrent = parsed.current || 0;
      showToast('Borrador cargado automáticamente', 'success');
    }
  } catch (e) {
    console.error('Error al cargar borrador:', e);
  }

  _workshopState = { 
    workshop, 
    current: savedCurrent, 
    answers: savedAnswers, 
    user 
  };
  await renderWorkshopQuestion();
}

async function renderWorkshopQuestion() {
  const { workshop, current, answers } = _workshopState;
  const q       = workshop.preguntas[current];
  const total   = workshop.preguntas.length;
  const progress = Math.round((current / total) * 100);
  const isLast  = current === total - 1;

  if (!answers[q.id]) answers[q.id] = {};

  const FL = {
    bio:      { icon: '👤', label: '¿Quién es? / Biografía' },
    que:      { icon: '❓', label: '¿Qué es?' },
    para_que: { icon: '🎯', label: '¿Para qué sirve?' },
    ejemplo:  { icon: '💡', label: 'Ejemplo de uso' }
  };

  const fieldsHtml = (q.campos || []).map(campo => {
    const fl        = FL[campo] || { icon: '📝', label: campo };
    const savedText = answers[q.id][campo]?.texto || '';
    const savedFoto = answers[q.id][campo]?.foto  || null;
    const isEjemplo = campo === 'ejemplo';
    const charCount = savedText.length;
    const hasPhoto  = !!savedFoto;
    const ok        = charCount >= 200 || (isEjemplo && hasPhoto);
    const counterTxt = isEjemplo
      ? `${charCount} caracteres${hasPhoto ? ' · 📷 Foto adjunta' : ''}`
      : `${charCount} / 200 caracteres mínimos`;
    return `
      <div class="workshop-field" data-campo="${campo}">
        <div class="workshop-field__header">
          <span class="workshop-field__label">${fl.icon} ${fl.label}</span>
          <span class="ws-char-counter ${ok ? 'ws-char-ok' : 'ws-char-warn'}" id="wc-${campo}">${counterTxt}</span>
        </div>
        <textarea class="workshop-textarea" id="ws-ta-${campo}" data-campo="${campo}" data-qid="${q.id}" rows="6"
          placeholder="Escribe tu respuesta aquí...">${escapeHtml(savedText)}</textarea>
        ${isEjemplo ? `
          <div style="margin-top:10px;">
            <label class="btn btn--outline btn--sm" for="ws-photo-${current}" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
              📷 ${savedFoto ? 'Cambiar Foto' : 'Adjuntar Foto (opcional)'}
            </label>
            <input type="file" id="ws-photo-${current}" accept="image/*" style="display:none;" data-campo="${campo}" data-qid="${q.id}">
            <div id="ws-photo-preview-${current}">${savedFoto ? `
              <div style="position:relative;display:inline-block;margin-top:8px;">
                <img src="${savedFoto}" alt="Vista previa" style="max-width:100%;max-height:200px;border-radius:8px;border:1px solid #e5e7eb;display:block;">
                <button type="button" id="ws-remove-photo-${current}" title="Eliminar foto"
                  style="position:absolute;top:6px;right:6px;background:#e63946;color:#fff;border:none;border-radius:50%;width:26px;height:26px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">✕</button>
              </div>` : ''}</div>
          </div>` : ''}
        <p class="text-muted" style="font-size:0.75rem;margin-top:5px;">
          ${isEjemplo
            ? '💡 Si adjuntas una foto no es obligatorio el mínimo de 200 caracteres. No se permite copiar/pegar.'
            : '⚠️ Mínimo 200 caracteres. No se permite copiar o pegar texto.'}
        </p>
      </div>`;
  }).join('');

  getApp().innerHTML = `
    <div class="exam-page">
      <header class="exam-header">
        <div class="exam-header__left">
          <img src="assets/logo.png" alt="Logo" class="topbar__logo" onerror="this.style.display='none'">
          <div>
            <span class="exam-title">📋 ${escapeHtml(workshop.titulo)}</span>
            <span class="exam-meta">${escapeHtml(_workshopState.user.nombres)}</span>
          </div>
        </div>
        <div class="exam-header__counter" style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
          <span class="counter-badge" style="background:#7c3aed;">Pregunta ${current + 1} <em>de</em> ${total}</span>
          <span id="ws-autosave-status" style="font-size:0.7rem; color:#6b7280; transition: opacity 0.3s ease; opacity:0.7;">✓ Autoguardado</span>
        </div>
      </header>
      <div class="exam-progress-bar">
        <div class="exam-progress-bar__fill" style="width:${progress}%;background:#7c3aed;"></div>
      </div>
      <main class="exam-main">
        <div class="question-card">
          <p class="question-number">Pregunta ${current + 1}</p>
          <h2 class="question-text">${escapeHtml(q.texto)}</h2>
          <div class="workshop-fields-container" id="workshop-fields">${fieldsHtml}</div>
        </div>
        <div class="exam-nav">
          <button class="btn btn--outline" id="ws-prev-btn" ${current === 0 ? 'disabled' : ''}>← Atrás</button>
          <button class="btn btn--primary" id="ws-next-btn" style="background:#7c3aed;border-color:#7c3aed;">
            ${isLast ? 'Entregar Taller ✓' : 'Siguiente →'}
          </button>
        </div>
      </main>
    </div>
  `;

  // Block copy / paste / cut
  document.querySelectorAll('.workshop-textarea').forEach(ta => {
    ['paste', 'copy', 'cut'].forEach(evtName => {
      ta.addEventListener(evtName, e => {
        e.preventDefault();
        showToast('No se permite copiar o pegar en el taller.', 'info');
      });
    });
    ta.addEventListener('input', () => {
      const campo = ta.dataset.campo;
      const qid   = ta.dataset.qid;
      const val   = ta.value;
      if (!_workshopState.answers[qid]) _workshopState.answers[qid] = {};
      if (!_workshopState.answers[qid][campo]) _workshopState.answers[qid][campo] = {};
      _workshopState.answers[qid][campo].texto = val;
      saveWorkshopDraft();
      const counter   = document.getElementById(`wc-${campo}`);
      if (!counter) return;
      const isEjemplo = campo === 'ejemplo';
      const hasPhoto  = !!(_workshopState.answers[qid][campo]?.foto);
      const cnt       = val.length;
      const ok        = cnt >= 200 || (isEjemplo && hasPhoto);
      counter.className = `ws-char-counter ${ok ? 'ws-char-ok' : 'ws-char-warn'}`;
      counter.textContent = isEjemplo
        ? `${cnt} caracteres${hasPhoto ? ' · 📷 Foto adjunta' : ''}`
        : `${cnt} / 200 caracteres mínimos`;
    });
  });

  // Photo upload + remove
  (q.campos || []).forEach(campo => {
    if (campo !== 'ejemplo') return;
    const photoInput = document.getElementById(`ws-photo-${current}`);
    if (!photoInput) return;

    // Helper: renders preview with remove button and wires the ✕ click
    function applyPhoto(base64, qid) {
      if (!_workshopState.answers[qid]) _workshopState.answers[qid] = {};
      if (!_workshopState.answers[qid][campo]) _workshopState.answers[qid][campo] = {};
      _workshopState.answers[qid][campo].foto = base64;
      const previewDiv = document.getElementById(`ws-photo-preview-${current}`);
      if (previewDiv) {
        previewDiv.innerHTML = `
          <div style="position:relative;display:inline-block;margin-top:8px;">
            <img src="${base64}" alt="Vista previa" style="max-width:100%;max-height:200px;border-radius:8px;border:1px solid #e5e7eb;display:block;">
            <button type="button" id="ws-remove-photo-${current}" title="Eliminar foto"
              style="position:absolute;top:6px;right:6px;background:#e63946;color:#fff;border:none;border-radius:50%;width:26px;height:26px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">✕</button>
          </div>`;
        wireRemoveBtn(qid);
      }
      const lbl = document.querySelector(`label[for="ws-photo-${current}"]`);
      if (lbl) lbl.innerHTML = '📷 Cambiar Foto';
      const counter = document.getElementById(`wc-${campo}`);
      if (counter) {
        const cnt = (_workshopState.answers[qid][campo]?.texto || '').length;
        counter.className = 'ws-char-counter ws-char-ok';
        counter.textContent = `${cnt} caracteres · 📷 Foto adjunta`;
      }
      saveWorkshopDraft();
    }

    function removePhoto(qid) {
      if (_workshopState.answers[qid] && _workshopState.answers[qid][campo]) {
        _workshopState.answers[qid][campo].foto = null;
      }
      const previewDiv = document.getElementById(`ws-photo-preview-${current}`);
      if (previewDiv) previewDiv.innerHTML = '';
      const lbl = document.querySelector(`label[for="ws-photo-${current}"]`);
      if (lbl) lbl.innerHTML = '📷 Adjuntar Foto (opcional)';
      // reset file input so the same file can be re-selected
      if (photoInput) photoInput.value = '';
      const counter = document.getElementById(`wc-${campo}`);
      if (counter) {
        const cnt = (_workshopState.answers[qid] && _workshopState.answers[qid][campo]?.texto || '').length;
        const ok  = cnt >= 200;
        counter.className = `ws-char-counter ${ok ? 'ws-char-ok' : 'ws-char-warn'}`;
        counter.textContent = `${cnt} caracteres`;
      }
      saveWorkshopDraft();
    }

    function wireRemoveBtn(qid) {
      const removeBtn = document.getElementById(`ws-remove-photo-${current}`);
      if (removeBtn) removeBtn.addEventListener('click', () => removePhoto(qid));
    }

    photoInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) { showToast('Selecciona una imagen válida.', 'error'); return; }
      const reader = new FileReader();
      reader.onload = ev => applyPhoto(ev.target.result, q.id);
      reader.readAsDataURL(file);
    });

    // Wire remove button for photos already saved (when navigating back)
    wireRemoveBtn(q.id);
  });

  document.getElementById('ws-prev-btn')?.addEventListener('click', async () => {
    if (_workshopState.current > 0) { 
      _workshopState.current--; 
      saveWorkshopDraft();
      await renderWorkshopQuestion(); 
    }
  });

  document.getElementById('ws-next-btn')?.addEventListener('click', async () => {
    const currentQ  = workshop.preguntas[current];
    const qAnswers  = _workshopState.answers[currentQ.id] || {};
    for (const campo of (currentQ.campos || [])) {
      const isEjemplo = campo === 'ejemplo';
      const fieldVal  = qAnswers[campo];
      const text      = (typeof fieldVal === 'object' ? fieldVal?.texto : '') || '';
      const foto      = typeof fieldVal === 'object' ? (fieldVal?.foto || null) : null;
      const fl        = FL[campo] || { label: campo };
      if (!isEjemplo && text.trim().length < 200) {
        showToast(`"${fl.label}" necesita al menos 200 caracteres.`, 'error');
        document.getElementById(`ws-ta-${campo}`)?.focus();
        return;
      }
      if (isEjemplo && !foto && text.trim().length < 200) {
        showToast(`"Ejemplo de uso" necesita 200 caracteres o una foto adjunta.`, 'error');
        document.getElementById(`ws-ta-${campo}`)?.focus();
        return;
      }
    }
    if (isLast) {
      await submitWorkshop();
    } else {
      _workshopState.current++;
      saveWorkshopDraft();
      await renderWorkshopQuestion();
    }
  });
}

async function submitWorkshop() {
  const { workshop, answers, user } = _workshopState;
  try {
    await DB.saveWorkshopResult(user.documento, workshop.id, answers);
    clearWorkshopDraft(user.documento, workshop.id);
  } catch(err) {
    showToast('Error al entregar el taller. Intenta de nuevo.', 'error');
    return;
  }
  showModal(`
    <div class="result-modal" style="position:relative;">
      <div class="result-modal__icon result-modal__icon--pass" style="filter:none;">📋</div>
      <h2>¡Taller Entregado!</h2>
      <p class="result-modal__student">${escapeHtml(user.nombres)} ${escapeHtml(user.apellidos)}</p>
      <p style="color:#7c3aed;font-weight:600;font-size:1.05rem;margin-top:8px;">Tus respuestas han sido enviadas correctamente</p>
      <p style="color:#555;font-size:0.9rem;margin-top:8px;line-height:1.5;">
        El instructor revisará tu trabajo y asignará una calificación.<br>
        Podrás consultarla en tu historial de notas.
      </p>
      <p class="text-muted" style="font-size:0.8rem;margin-top:16px;">
        Tu sesión se cerrará en <span id="ws-countdown">5</span> segundos.
      </p>
    </div>
  `, () => {
    let secs = 5;
    const timer = setInterval(() => {
      secs--;
      const cd = document.getElementById('ws-countdown');
      if (cd) cd.textContent = secs;
      if (secs <= 0) { clearInterval(timer); Auth.logout(); }
    }, 1000);
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) { clearInterval(timer); closeModal(); window.location.hash = '#student-dashboard'; }
      });
    }
  });
}
