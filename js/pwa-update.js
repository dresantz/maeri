// js/pwa-update.js
// Sistema de notificação de atualização do PWA para Maeri RPG

(function() {
  console.log('📜 PWA Update: Inicializando...');
  
  // Detecta o BASE_PATH automaticamente (mesma lógica do service worker)
  const getBasePath = () => {
    const isGitHubPages = window.location.hostname.includes('github.io');
    const pathname = window.location.pathname;
    
    if (isGitHubPages && pathname.includes('/maeri/')) {
      return '/maeri/';
    }
    
    return '/';
  };
  
  const BASE_PATH = getBasePath();
  console.log('📜 PWA Update: BASE_PATH =', BASE_PATH);
  
  // Primeiro vamos LOGAR se suporta ou não, DEPOIS decidir
  if ('serviceWorker' in navigator) {
    console.log('📜 PWA Update: Service Worker é SUPORTADO!');
  } else {
    console.log('📜 PWA Update: Service Worker NÃO é suportado');
    return; // Agora sim, retorna após o log
  }

  // Função para criar a notificação de atualização (estilizada com seu CSS)
  function showUpdateNotification() {
    console.log('📜 PWA Update: Mostrando notificação');
    // Verifica se já existe uma notificação
    if (document.getElementById('maeri-update-notification')) return;

    // Cria o elemento
    const notification = document.createElement('div');
    notification.id = 'maeri-update-notification';
    
    // Aplica estilos baseados no tema do Maeri RPG
    notification.style.cssText = `
      position: fixed;
      bottom: 90px;  /* Fica acima do floating menu */
      left: 16px;
      right: 16px;
      background: var(--surface, #1a1a2e);
      border: 2px solid var(--gold, #d4af37);
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

    // Conteúdo da notificação
    notification.innerHTML = `
      <div style="margin-bottom: 12px;">
        <span style="color: var(--gold, #d4af37); font-size: 1.2rem;">NOVA VERSÃO!</span>
      </div>
      <p style="font-family: 'Crimson Text', serif; margin: 0 0 16px 0; color: var(--text-muted, #b0b0c0);">
        Uma atualização está disponível!
      </p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="maeri-update-now" class="maeri-update-btn maeri-update-btn-primary">
          Atualizar agora
        </button>
        <button id="maeri-update-later" class="maeri-update-btn maeri-update-btn-secondary">
          Depois
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Adiciona estilos globais para os botões (usa as variáveis do CSS)
    const style = document.createElement('style');
    style.textContent = `
      @keyframes maeriSlideUp {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
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
        background: var(--gold, #d4af37);
        color: var(--bg-dark, #0a0a12);
        border-color: var(--gold, #d4af37);
      }

      .maeri-update-btn-primary:hover {
        background: transparent;
        color: var(--gold, #d4af37);
      }

      .maeri-update-btn-secondary {
        background: transparent;
        color: var(--gold, #d4af37);
        border-color: var(--gold, #d4af37);
      }

      .maeri-update-btn-secondary:hover {
        background: var(--gold, #d4af37);
        color: var(--bg-dark, #0a0a12);
      }

      @media (max-width: 480px) {
        .maeri-update-btn {
          min-width: 100px;
          padding: 8px 16px;
          font-size: 0.8rem;
        }
        
        #maeri-update-notification {
          bottom: 80px;
          padding: 12px;
        }
      }
    `;
    document.head.appendChild(style);

    // Botão "Atualizar agora"
    document.getElementById('maeri-update-now').addEventListener('click', () => {
      notification.remove();
      // Envia mensagem para o service worker ativar a nova versão
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage('SKIP_WAITING');
      }

      // IMPORTANTE: Aguarda a ativação e FORÇA recarregar com cache novo
      navigator.serviceWorker.ready.then(registration => {
        if (registration.waiting) {
          // Força o waiting a se tornar ativo
          registration.waiting.postMessage('SKIP_WAITING');
        }
      });
      
      // Recarrega a página MAS garantindo que pega do servidor
      window.location.reload();
    });

    // Botão "Depois"
    document.getElementById('maeri-update-later').addEventListener('click', () => {
      notification.remove();
    });
  }

  // Registra o service worker com sistema de atualização
  window.addEventListener('load', () => {
    console.log('📜 PWA Update: Página carregada, registrando...');
    
    navigator.serviceWorker.register(BASE_PATH + 'service-worker.js')
      .then(registration => {
        console.log('📜 Maeri RPG: ServiceWorker registrado', registration.scope);

        // Verifica se há atualização esperando
        registration.addEventListener('updatefound', () => {
          console.log('📜 PWA Update: Atualização encontrada!');
          const newWorker = registration.installing;
          
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            console.log('📜 PWA Update: Novo worker estado:', newWorker.state);
            
            // Se a nova versão já instalou MAS ainda não ativou
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('📜 Maeri RPG: Nova versão disponível!');
              showUpdateNotification();
            }
          });
        });

        // Verificação periódica por atualizações (a cada 30 minutos)
        setInterval(() => {
          console.log('📜 PWA Update: Verificando atualizações...');
          registration.update();
        }, 30 * 60 * 1000);

      })
      .catch(error => {
        console.log('📜 Maeri RPG: Erro no ServiceWorker', error);
      });

    // Quando uma nova versão assume o controle, recarrega a página
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('📜 Maeri RPG: Nova versão ativada, recarregando...');
      window.location.reload();
    });
  });

  // Adiciona mensagem para o service worker pular a espera
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
      console.log('📜 PWA Update: Mensagem SKIP_WAITING recebida');
    }
  });

})();