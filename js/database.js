/**
 * database.js — INARFOTEC Exam System
 * Frontend wrapper for Backend REST API
 */

const API_BASE = '/api';

window.DB = {
  async init() {
    // Database initialization is handled by the backend server.
    // Just a placeholder to maintain backwards compatibility with ui-render.js bootstrap.
    return true;
  },

  // Users
  async getAllUsers() {
    const res = await fetch(`${API_BASE}/users`);
    return await res.json();
  },
  
  async createUser(user) {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    if (!res.ok) throw new Error('Error creating user');
    return await res.json();
  },

  async updateUser(id, user) {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    if (!res.ok) throw new Error('Error updating user');
    return await res.json();
  },

  async toggleUserStatus(id, estado) {
    const res = await fetch(`${API_BASE}/users/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    });
    if (!res.ok) throw new Error('Error toggling status');
    return await res.json();
  },

  async deleteUser(id) {
    const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error deleting user');
    return await res.json();
  },

  async getUserByDocumento(doc) {
    const res = await fetch(`${API_BASE}/auth/me?documento=${doc}`);
    const data = await res.json();
    return data.user;
  },

  // Exams
  async getAllExams() {
    const res = await fetch(`${API_BASE}/exams`);
    return await res.json();
  },

  async getActiveExam() {
    const res = await fetch(`${API_BASE}/exams/active`);
    return await res.json();
  },

  async getExamById(id) {
    const res = await fetch(`${API_BASE}/exams/${id}`);
    return await res.json();
  },

  async createExam(titulo, preguntas) {
    const res = await fetch(`${API_BASE}/exams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, preguntas })
    });
    if (!res.ok) throw new Error('Error creating exam');
    return await res.json();
  },

  async enableExam(id) {
    const res = await fetch(`${API_BASE}/exams/${id}/enable`, { method: 'PUT' });
    if (!res.ok) throw new Error('Error enabling exam');
    return await res.json();
  },

  async disableExam(id) {
    const res = await fetch(`${API_BASE}/exams/${id}/disable`, { method: 'PUT' });
    if (!res.ok) throw new Error('Error disabling exam');
    return await res.json();
  },

  async deleteExam(id) {
    const res = await fetch(`${API_BASE}/exams/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error deleting exam');
    return await res.json();
  },

  // Results
  async saveResult(id_estudiante, id_examen, puntuacion, respuestas) {
    const res = await fetch(`${API_BASE}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_estudiante, id_examen, puntuacion, respuestas })
    });
    if (!res.ok) throw new Error('Error saving result');
    return await res.json();
  },

  async getResultsByStudent(documento) {
    const res = await fetch(`${API_BASE}/results/student/${documento}`);
    return await res.json();
  },

  async getAllResults() {
    const res = await fetch(`${API_BASE}/results/all`);
    return await res.json();
  },

  async studentHasExamToday(documento, idExamen) {
    const res = await fetch(`${API_BASE}/results/check-today?documento=${documento}&idExamen=${idExamen}`);
    const data = await res.json();
    return data.hasExamToday;
  },

  async deleteResult(id) {
    const res = await fetch(`${API_BASE}/results/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error deleting result');
    return await res.json();
  },

  async updateExamResult(id, puntuacion, motivo_modificacion) {
    const res = await fetch(`/api/results/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ puntuacion, motivo_modificacion })
    });
    return await res.json();
  },

  // ─── TALLERES (Workshops) ──────────────────────────────────────────────────────────────
  async getAllWorkshops() {
    const res = await fetch(`${API_BASE}/talleres`);
    return await res.json();
  },

  async getActiveWorkshop() {
    const res = await fetch(`${API_BASE}/talleres/active`);
    return await res.json();
  },

  async getWorkshopById(id) {
    const res = await fetch(`${API_BASE}/talleres/${id}`);
    return await res.json();
  },

  async createWorkshop(titulo, preguntas) {
    const res = await fetch(`${API_BASE}/talleres`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, preguntas })
    });
    if (!res.ok) throw new Error('Error creating workshop');
    return await res.json();
  },

  async enableWorkshop(id) {
    const res = await fetch(`${API_BASE}/talleres/${id}/enable`, { method: 'PUT' });
    if (!res.ok) throw new Error('Error enabling workshop');
    return await res.json();
  },

  async disableWorkshop(id) {
    const res = await fetch(`${API_BASE}/talleres/${id}/disable`, { method: 'PUT' });
    if (!res.ok) throw new Error('Error disabling workshop');
    return await res.json();
  },

  async deleteWorkshop(id) {
    const res = await fetch(`${API_BASE}/talleres/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error deleting workshop');
    return await res.json();
  },

  // ── Resultados de Taller ──────────────────────────────────────────────────
  async saveWorkshopResult(id_estudiante, id_taller, respuestas) {
    const res = await fetch(`${API_BASE}/workshop-results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_estudiante, id_taller, respuestas })
    });
    if (!res.ok) throw new Error('Error saving workshop result');
    return await res.json();
  },

  async getWorkshopResultsByStudent(documento) {
    const res = await fetch(`${API_BASE}/workshop-results/student/${documento}`);
    return await res.json();
  },

  async getAllWorkshopResults() {
    const res = await fetch(`${API_BASE}/workshop-results/all`);
    return await res.json();
  },

  async studentHasWorkshopToday(documento, idTaller) {
    const res = await fetch(`${API_BASE}/workshop-results/check-today?documento=${documento}&idTaller=${idTaller}`);
    const data = await res.json();
    return data.hasWorkshopToday;
  },

  async gradeWorkshopResult(id, puntuacion) {
    const res = await fetch(`${API_BASE}/workshop-results/${id}/grade`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ puntuacion })
    });
    if (!res.ok) throw new Error('Error grading workshop result');
    return await res.json();
  },

  async deleteWorkshopResult(id) {
    const res = await fetch(`${API_BASE}/workshop-results/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error deleting workshop result');
    return await res.json();
  },

  // Utilities
  shuffleExamQuestions(examToShuffle) {
    const exam = JSON.parse(JSON.stringify(examToShuffle)); // Deep copy
    // Fisher-Yates array shuffle
    const shuffle = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    // Shuffle questions array
    if (exam && exam.preguntas) {
      exam.preguntas = shuffle(exam.preguntas);
      // Shuffle options for multiple choice
      exam.preguntas.forEach(q => {
        if (q.tipo === 'multiple' && q.opciones) {
          q.opciones = shuffle(q.opciones);
        }
      });
    }
    return exam;
  }
};
