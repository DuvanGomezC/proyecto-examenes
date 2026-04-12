/**
 * pdf-gen.js — INARFOTEC Exam System
 * PDF generation using jsPDF (loaded from CDN).
 */

const { jsPDF } = window.jspdf;

const INST_NAME = 'INSTITUTO ARAUCANO DE FORMACIÓN TÉCNICA';
const EXAM_TITLE = 'EXAMEN ACADÉMICO';
const WATERMARK_TEXT = 'INARFOTEC';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function colombianDate(isoString) {
  const date = new Date(isoString || Date.now());
  const months = [
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre'
  ];
  const d = date.getDate();
  const m = months[date.getMonth()];
  const y = date.getFullYear();
  return `${d} de ${m} de ${y}`;
}

function addWatermark(doc) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: 0.07 }));
  doc.setFontSize(72);
  doc.setTextColor(30, 60, 110);
  doc.setFont('helvetica', 'bold');
  doc.text(WATERMARK_TEXT, pageW / 2, pageH / 2, {
    align: 'center',
    baseline: 'middle',
    angle: 45
  });
  doc.restoreGraphicsState();
  doc.setTextColor(0, 0, 0);
}

function addHeader(doc, logoDataUrl) {
  const pageW = doc.internal.pageSize.getWidth();

  // Background header bar
  doc.setFillColor(26, 60, 110);
  doc.rect(0, 0, pageW, 30, 'F');

  // Logo
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', 8, 3, 24, 24);
    } catch(e) { /* logo not available */ }
  }

  // Institution name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(INST_NAME, pageW / 2, 13, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('LICENCIA DE FUNCIONAMIENTO:N° 3273 DE 2016 | Arauca, Colombia', pageW / 2, 22, { align: 'center' });
  doc.setTextColor(0, 0, 0);
}

function getLogoDataUrl() {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = 'assets/logo.png';
  });
}

// ─── Result PDF ───────────────────────────────────────────────────────────────
async function generateResultPDF(result, student, exam) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const logo = await getLogoDataUrl();

  addHeader(doc, logo);
  addWatermark(doc);

  let y = 38;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(26, 60, 110);
  doc.text(EXAM_TITLE, pageW / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(11);
  doc.text(exam.titulo.toUpperCase(), pageW / 2, y, { align: 'center' });
  y += 10;

  // Divider
  doc.setDrawColor(26, 60, 110);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageW - 14, y);
  y += 7;

  // Student data box
  doc.setFillColor(240, 245, 255);
  doc.roundedRect(14, y, pageW - 28, 32, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL ESTUDIANTE', 20, y + 7);
  doc.setFont('helvetica', 'normal');
  const fullName = `${student.nombres} ${student.apellidos}`;
  doc.text(`Nombre completo:`, 20, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.text(fullName, 60, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(`Documento (CC):`, 20, y + 20);
  doc.setFont('helvetica', 'bold');
  doc.text(student.documento, 60, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(`Programa Técnico:`, 20, y + 26);
  doc.setFont('helvetica', 'bold');
  doc.text(student.programa, 60, y + 26);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha de presentación:`, 115, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.text(colombianDate(result.fecha), 157, y + 14);
  y += 40;

  // Score badge
  const score = parseFloat(result.puntuacion).toFixed(1);
  const passed = parseFloat(score) >= 3.5;
  doc.setFillColor(passed ? 22 : 180, passed ? 160 : 40, passed ? 80 : 40);
  doc.roundedRect(pageW / 2 - 25, y, 50, 14, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(`PUNTAJE: ${score} / 5.0`, pageW / 2, y + 9, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 22;

  // Answers table header
  doc.setFillColor(26, 60, 110);
  doc.rect(14, y, pageW - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('#', 17, y + 5.5);
  doc.text('Pregunta', 24, y + 5.5);
  doc.text('R. Estudiante', 120, y + 5.5);
  doc.text('R. Correcta', 155, y + 5.5);
  doc.text('Resultado', 185, y + 5.5);
  doc.setTextColor(0, 0, 0);
  y += 8;

  const respuestas = typeof result.respuestas === 'string'
    ? JSON.parse(result.respuestas)
    : result.respuestas;

  const preguntas = exam.preguntas;

  preguntas.forEach((q, idx) => {
    const studentAnswerKey = respuestas[q.id];
    let studentAnswerLabel = '-';
    let correctLabel = '';

    if (q.tipo === 'vf') {
      studentAnswerLabel = studentAnswerKey || '-';
      correctLabel = q.respuesta_correcta;
    } else {
      const studentOpt = q.opciones.find(o => o.id === studentAnswerKey);
      const correctOpt = q.opciones.find(o => o.id === q.respuesta_correcta);
      studentAnswerLabel = studentOpt ? studentOpt.texto : '-';
      correctLabel = correctOpt ? correctOpt.texto : '-';
    }
    const isCorrect = studentAnswerKey === q.respuesta_correcta;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const qLines = doc.splitTextToSize(q.texto, 88);
    const stLines = doc.splitTextToSize(studentAnswerLabel, 30);
    const coLines = doc.splitTextToSize(correctLabel, 26);

    const maxLines = Math.max(qLines.length, stLines.length, coLines.length);
    const rowHeight = maxLines * 4 + 6;

    if (y + rowHeight > 250) {
      doc.addPage();
      addWatermark(doc);
      addHeader(doc, logo);
      y = 38;
      doc.setFillColor(26, 60, 110);
      doc.rect(14, y, pageW - 28, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('#', 17, y + 5.5);
      doc.text('Pregunta', 24, y + 5.5);
      doc.text('R. Estudiante', 120, y + 5.5);
      doc.text('R. Correcta', 155, y + 5.5);
      doc.text('Resultado', 185, y + 5.5);
      doc.setTextColor(0, 0, 0);
      y += 8;
    }

    const fill = idx % 2 === 0 ? [248, 250, 255] : [255, 255, 255];
    doc.setFillColor(...fill);
    doc.rect(14, y, pageW - 28, rowHeight, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(40, 40, 40);

    doc.text(String(idx + 1), 17, y + 6);
    doc.text(qLines, 24, y + 6);
    doc.text(stLines, 120, y + 6);
    doc.text(coLines, 155, y + 6);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isCorrect ? 22 : 200, isCorrect ? 130 : 30, isCorrect ? 60 : 30);
    doc.text(isCorrect ? 'Correcto' : 'Incorrecto', 185, y + 6);
    doc.setTextColor(0, 0, 0);

    y += rowHeight;
  });

  // Footer
  y += 5;
  doc.setDrawColor(26, 60, 110);
  doc.line(14, y, pageW - 14, y);
  y += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('Documento generado automáticamente por el Sistema de Gestión de Exámenes — INARFOTEC', pageW / 2, y, { align: 'center' });

  const fileName = `Resultado_${student.documento}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
}

// ─── Clean Exam PDF (for manual printing) ────────────────────────────────────
async function generateCleanExamPDF(exam) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const logo = await getLogoDataUrl();

  addHeader(doc, logo);

  let y = 38;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(26, 60, 110);
  doc.text('EXAMEN EN LIMPIO', pageW / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(10);
  doc.text(exam.titulo, pageW / 2, y, { align: 'center' });
  y += 10;

  // Student fields
  doc.setFillColor(240, 245, 255);
  doc.roundedRect(14, y, pageW - 28, 22, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text('Nombre: _______________________________________________', 20, y + 8);
  doc.text('Documento: _______________________', 20, y + 16);
  doc.text('Fecha: ___________________', 115, y + 16);
  y += 30;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('Puntaje por pregunta: 0.5 pts  |  Total: 5.0 pts  |  Aprobación: >= 3.5 pts', pageW / 2, y, { align: 'center' });
  y += 8;

  doc.setDrawColor(26, 60, 110);
  doc.line(14, y, pageW - 14, y);
  y += 6;

  exam.preguntas.forEach((q, idx) => {
    doc.setFontSize(9);
    const qLines = doc.splitTextToSize(q.texto, pageW - 32);
    const qHeight = qLines.length * 5 + 4;
    
    let totalNeeded = qHeight;
    const optionLinesArr = [];
    if (q.tipo === 'vf') {
        totalNeeded += 14; 
    } else {
        const labels = ['A', 'B', 'C', 'D'];
        q.opciones.forEach((opt, oi) => {
           const optLine = doc.splitTextToSize(`${labels[oi]}) ${opt.texto}`, pageW - 44);
           optionLinesArr.push(optLine);
           totalNeeded += optLine.length * 5 + 2;
        });
        totalNeeded += 3;
    }

    if (y + totalNeeded > 255) {
      doc.addPage();
      addHeader(doc, logo);
      y = 38;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(26, 60, 110);
    doc.text(`${idx + 1}.`, 14, y);
    doc.setTextColor(20, 20, 20);
    doc.text(qLines, 22, y);
    y += qHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);

    if (q.tipo === 'vf') {
      doc.text('( )  Verdadero', 26, y); y += 6;
      doc.text('( )  Falso', 26, y); y += 8;
    } else {
      q.opciones.forEach((opt, oi) => {
        const optLine = optionLinesArr[oi];
        doc.text('( )', 26, y);
        doc.text(optLine, 32, y);
        y += optLine.length * 5 + 2;
      });
      y += 3;
    }

    // Answer boundary line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, y, pageW - 14, y);
    y += 5;
  });

  // Footer
  y += 4;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(`${INST_NAME}  |  Examen en Limpio para Impresión`, pageW / 2, y, { align: 'center' });

  doc.save(`Examen_Limpio_${exam.titulo.replace(/\s+/g,'_')}.pdf`);
}

window.PDFGen = { generateResultPDF, generateCleanExamPDF };
