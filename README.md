# INARFOTEC Exam System 🎓

Sistema web integral de gestión académica y evaluación en tiempo real diseñado para el Instituto Araucano de Formación Técnica (INARFOTEC).

## Características Implementadas
- **Roles:** Autenticación segregada para Instructor y Estudiante.
- **Motor de Exámenes:** Temporizadores, Anti-Fraude (análisis de visibilidad) y retroalimentación inmediata.
- **Resultados Matemáticos (PDF):** Generador PDF nativo y redimensionable utilizando jsPDF, estructurando reportes detallados y exámenes listos para imprimir (`En Limpio`).
- **Backend Persistente:** API REST con `Express.js` respaldada por una base de datos local SQLite (`better-sqlite3`).

## Construido con
- HTML5, CSS3, JavaScript Vanilla
- Express.js
- SQLite3
- jsPDF (CDN)

## Ejecución en Entorno Local
1. Asegúrate de tener **Node.js** instalado (v14+).
2. Clona este repositorio o descomprime los archivos.
3. Abre una terminal en la raíz del proyecto.
4. Ejecuta `npm install` para instalar las dependencias del servidor.
5. Ejecuta `npm start` para levantar el servidor y la API REST.
6. Abre tu navegador en `http://localhost:3000`.

## Despliegue (Deploy)
Revisar las instrucciones de Render.com provistas por el desarrollador para advertencias de persistencia (Discos Ephemeral en la Capa Gratuita).
