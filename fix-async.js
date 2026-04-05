const fs = require('fs');
const path = require('path');

const uiFile = path.join(__dirname, 'js', 'ui-render.js');
let code = fs.readFileSync(uiFile, 'utf8');

// Replacements

// 1. renderStudentDashboard
code = code.replace(/function renderStudentDashboard\(\)/g, "async function renderStudentDashboard()");
code = code.replace(/if \(!Auth\.requireAuth\('Estudiante'\)\)/g, "if (!(await Auth.requireAuth('Estudiante')))");
code = code.replace(/DB\.getResultsByStudent/g, "await DB.getResultsByStudent");
code = code.replace(/DB\.getActiveExam\(\)/g, "await DB.getActiveExam()");
code = code.replace(/DB\.studentHasExamToday/g, "await DB.studentHasExamToday");

// 2. renderExamEngine
code = code.replace(/function renderExamEngine\(\)/g, "async function renderExamEngine()");
code = code.replace(/if \(!Auth\.requireAuth\('Estudiante'\)\)/g, "if (!(await Auth.requireAuth('Estudiante')))"); // already changed above? Not if local
code = code.replace(/renderExamQuestion\(\)/g, "await renderExamQuestion()");

// 3. submitExam
code = code.replace(/function submitExam\(\)/g, "async function submitExam()");
code = code.replace(/DB\.saveResult/g, "await DB.saveResult");

// 4. renderInstructorDashboard
code = code.replace(/function renderInstructorDashboard\(\)/g, "async function renderInstructorDashboard()");
code = code.replace(/if \(!Auth\.requireAuth\('Instructor'\)\)/g, "if (!(await Auth.requireAuth('Instructor')))");
code = code.replace(/renderTabContent\(activeTab\)/g, "await renderTabContent(activeTab)");

// 5. renderTabContent
code = code.replace(/function renderTabContent/g, "async function renderTabContent");
code = code.replace(/renderUsersTab\(\)/g, "await renderUsersTab()");
code = code.replace(/renderExamsTab\(\)/g, "await renderExamsTab()");
code = code.replace(/renderResultsTab\(\)/g, "await renderResultsTab()");

// 6. renderUsersTab
code = code.replace(/function renderUsersTab\(\)/g, "async function renderUsersTab()");
code = code.replace(/DB\.getAllUsers\(\)/g, "await DB.getAllUsers()");
code = code.replace(/DB\.toggleUserStatus/g, "await DB.toggleUserStatus");
code = code.replace(/DB\.deleteUser/g, "await DB.deleteUser");
code = code.replace(/openUserModal\(\)/g, "await openUserModal()");
code = code.replace(/openUserModal\(([^)]+)\)/g, "await openUserModal($1)");

// 7. openUserModal
code = code.replace(/function openUserModal/g, "async function openUserModal");
code = code.replace(/DB\.updateUser/g, "await DB.updateUser");
code = code.replace(/DB\.createUser/g, "await DB.createUser");

// 8. renderExamsTab
code = code.replace(/function renderExamsTab\(\)/g, "async function renderExamsTab()");
code = code.replace(/DB\.getAllExams\(\)/g, "await DB.getAllExams()");
code = code.replace(/DB\.enableExam/g, "await DB.enableExam");
code = code.replace(/DB\.disableExam/g, "await DB.disableExam");
code = code.replace(/DB\.deleteExam/g, "await DB.deleteExam");
code = code.replace(/openExamModal\(\)/g, "await openExamModal()");
code = code.replace(/openExamModal\(([^)]+)\)/g, "await openExamModal($1)");

// 9. openExamModal
code = code.replace(/function openExamModal/g, "async function openExamModal");
code = code.replace(/DB\.createExam/g, "await DB.createExam");

// 10. renderResultsTab
code = code.replace(/function renderResultsTab\(\)/g, "async function renderResultsTab()");
code = code.replace(/DB\.getAllResults\(\)/g, "await DB.getAllResults()");
code = code.replace(/DB\.getUserByDocumento/g, "await DB.getUserByDocumento");
code = code.replace(/DB\.getExamById/g, "await DB.getExamById");

// Fix any double awaits
code = code.replace(/await await/g, "await");

fs.writeFileSync(uiFile, code);
console.log("ui-render.js patched to use async/await.");
