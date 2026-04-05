/**
 * anti-fraud.js — INARFOTEC Exam System
 */
window.AntiFraud = (() => {
  let warnings = 0;
  let active = false;
  let onMaxViolations = null;
  let blurTimer = null;

  const handleVisibilityChange = () => {
    if (!active) return;
    
    if (document.hidden) {
      blurTimer = setTimeout(() => {
        warnings++;
        if (warnings >= 3) {
          stop();
          if (onMaxViolations) onMaxViolations();
          if (typeof window.showModal === 'function') {
            window.showModal(`
              <div style="text-align:center; padding: 30px 20px;">
                <div style="font-size: 3rem; margin-bottom: 10px;">🛑</div>
                <h2 style="color: #e63946; margin-bottom: 15px;">Fraude Detectado</h2>
                <p style="font-size: 1.1rem; color: #444;">Has superado el límite de salidas de la ventana del examen.</p>
                <p style="font-size: 1rem; color: #666; margin-top: 10px; font-weight: bold;">El examen ha finalizado de forma forzosa.</p>
              </div>
            `);
          } else {
            alert("Has superado el límite de salidas de la ventana o navegador y demorado más de 5 segundos. El examen ha finalizado forzosamente.");
          }
        } else {
          const remaining = 3 - warnings;
          const msg = `Has salido del examen temporalmente (más de 5 segundos).<br><br><b>Advertencia ${warnings} de 3</b>.<br>Si abandonas la ventana ${remaining === 1 ? '1 vez más' : remaining + ' veces más'}, tu prueba será anulada y cerrada.`;
          if (typeof window.showModal === 'function') {
            window.showModal(`
              <div style="text-align:center; padding: 30px 20px;">
                <div style="font-size: 3rem; margin-bottom: 10px;">⚠️</div>
                <h2 style="color: #ff9800; margin-bottom: 15px;">Advertencia de Fraude</h2>
                <p style="font-size: 1.1rem; color: #444;">${msg}</p>
                <button class="btn btn--primary" style="margin-top: 20px; width: 100%; font-size: 1rem;" id="fraud-ok-btn">Entendido, lo siento</button>
              </div>
            `, () => {
              const okBtn = document.getElementById('fraud-ok-btn');
              if(okBtn) okBtn.addEventListener('click', () => {
                 const overlay = document.querySelector('.modal-overlay');
                 if(overlay) overlay.classList.remove('modal-overlay--show');
                 setTimeout(() => overlay?.remove(), 300);
              });
            });
          } else {
            alert(`¡ADVERTENCIA DE FRAUDE! Has salido del examen por más de 5 segundos (${warnings}/3). Si sumas ${remaining === 1 ? '1 vez más' : remaining + ' veces más'}, se finalizará tu examen.`);
          }
        }
      }, 1000);
    } else {
      if (blurTimer) {
        clearTimeout(blurTimer);
        blurTimer = null;
      }
    }
  };

  const start = (callback) => {
    warnings = 0;
    active = true;
    blurTimer = null;
    onMaxViolations = callback;
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
  };

  const stop = () => {
    active = false;
    if (blurTimer) {
      clearTimeout(blurTimer);
      blurTimer = null;
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };

  return { start, stop };
})();
