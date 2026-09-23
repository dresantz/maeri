// js/pwa-update.js
// Sistema de notificação de atualização do PWA para Maeri RPG

(function() {
  console.log('📜 PWA Update: Inicializando...');

  // ------------------------------------------------------------
  // BASE_PATH — deriva do próprio <script src>
  // ------------------------------------------------------------
  const getBasePath = () => {
    if (window.MAERI_BASE_PATH) return window.MAERI_BASE_PATH;

    const script = document.currentScript;
    if (script && script.src) {
      const pathname = new URL(script.src, window.location.origin).pathname;
      return pathname.replace(/\/js\/[^/]+$/, '/');
    }

    const path = window.location.pathname;
    const dir = path.endsWith('.html')
      ? path.slice(0, path.lastIndexOf('/') + 1)
      : path;
    if (dir.includes('/pages/')) return dir.split('/pages/')[0] + '/';
    return dir;
  };

  const BASE_PATH = getBasePath();
  console.log('📜 PWA Update: BASE_PATH =', BASE_PATH);

  if (!('serviceWorker' in navigator)) {
    console.log('📜 PWA Update: Service Worker NÃO é suportado');
    return;
  }
  console.log('📜 PWA Update: Service Worker é SUPORTADO!');

  // ------------------------------------------------------------
  // Notificação de atualização
  // ------------------------------------------------------------
  function showUpdateNotification(onConfirm) {
    if (document.getElementById('maeri-update-notification')) return;

    const notification = document.createElement('div');
    notification.id = 'maeri-update-notification';
    notification.style.cssText = `
      position: fixed;
      bottom: 90px;
      left: 16px;
      right: 16px;
      background: var(--surface, #1a1a2e);
      border: 2px solid var(--accent, #d4af37);
      border-radius: var(--radius, 12px);
      padding: 16px;
      font-family: 'Cinzel', serif;
      color: var(--text, #f0f0f0);
      box-shadow: var(--shadow, 0 8px 24px rgba(0,0,0,0.4));
      z-index: 10000;
      backdrop-filter: blur(8px);
      animation: maeriSlideUp 0.3s ease;
      text-align: center;
    `;

    notification.innerHTML = `
      <div style="margin-bottom: 12px;">
        <span style="color: var(--accent, #d4af37); font-size: 1.2rem;">NOVA VERSÃO!</span>
      </div>
      <p style="font-family: 'Crimson Text', serif; margin: 0 0 16px 0; color: var(--text-muted, #b0b0c0);">
        Uma atualização está disponível!
      </p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="maeri-update-now" class="maeri-update-btn maeri-update-btn-primary">Atualizar agora</button>
        <button id="maeri-update-later" class="maeri-update-btn maeri-update-btn-secondary">Depois</button>
      </div>
    `;

    document.body.appendChild(notification);

    if (!document.getElementById('maeri-update-styles')) {
      const style = document.createElement('style');
      style.id = 'maeri-update-styles';
      style.textContent = `
        @keyframes maeriSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .maeri-update-btn {
          padding: 10px 20px;
          border-radius: calc(var(--radius, 12px) / 2);
          font-family: 'Cinzel', serif;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid transparent;
          min-width: 120px;
        }
        .maeri-update-btn-primary {
          background: var(--accent, #d4af37);
          color: var(--bg-base, #0a0a12);
          border-color: var(--accent, #d4af37);
        }
        .maeri-update-btn-primary:hover {
          background: transparent;
          color: var(--accent, #d4af37);
        }
        .maeri-update-btn-secondary {
          background: transparent;
          color: var(--accent, #d4af37);
          border-color: var(--accent, #d4af37);
        }
        .maeri-update-btn-secondary:hover {
          background: var(--accent, #d4af37);
          color: var(--bg-base, #0a0a12);
        }
        @media (max-width: 480px) {
          .maeri-update-btn { min-width: 100px; padding: 8px 16px; font-size: 0.8rem; }
          #maeri-update-notification { bottom: 80px; padding: 12px; }
        }
      `;
      document.head.appendChild(style);
    }

    document.getElementById('maeri-update-now').addEventListener('click', () => {
      notification.remove();
      onConfirm();
    });

    document.getElementById('maeri-update-later').addEventListener('click', () => {
      notification.remove();
    });
  }

  // ------------------------------------------------------------
  // Guarda contra reload desnecessário na PRIMEIRA instalação.
  // Se não havia controller no carregamento da página, qualquer
  // controllerchange subsequente é a primeira instalação — não
  // deve recarregar.
  // ------------------------------------------------------------
  const hadControllerAtLoad = !!navigator.serviceWorker.controller;
  let refreshing = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadControllerAtLoad) {
      console.log('📜 Maeri RPG: controllerchange (primeira instalação) — sem reload');
      return;
    }
    if (refreshing) return;
    refreshing = true;
    console.log('📜 Maeri RPG: Nova versão ativada, recarregando...');
    window.location.reload();
  });

  // ------------------------------------------------------------
  // Registro do SW
  // ------------------------------------------------------------
  window.addEventListener('load', () => {
    console.log('📜 PWA Update: Página carregada, registrando...');

    navigator.serviceWorker.register(BASE_PATH + 'service-worker.js')
      .then(registration => {
        console.log('📜 Maeri RPG: ServiceWorker registrado', registration.scope);

        if (registration.waiting && navigator.serviceWorker.controller) {
          showUpdateNotification(() => {
            registration.waiting.postMessage('SKIP_WAITING');
          });
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('📜 Maeri RPG: Nova versão disponível!');
              showUpdateNotification(() => {
                newWorker.postMessage('SKIP_WAITING');
              });
            }
          });
        });

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update();
          }
        });

        setInterval(() => registration.update(), 60 * 60 * 1000);
      })
      .catch(error => {
        console.log('📜 Maeri RPG: Erro no ServiceWorker', error);
      });
  });
})();