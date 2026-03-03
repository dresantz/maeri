/**
 * uiReset.js - Reset de estado da UI
 * 
 * Responsável por:
 * - Destravar scroll do body
 * - Fechar modais genéricos
 * - Preservar componentes específicos (Dice Roller)
 */

// ===== CONSTANTES =====
const PRESERVED_ELEMENTS = ['dice-panel', 'dice-overlay'];
const MODAL_SELECTORS = [
  '.modal.open, .drawer.open, .overlay.open',
  '.modal.active, .drawer.active, .overlay.active'
];

/**
 * Remove classes de modal de elementos não preservados
 */
function closeGenericModals() {
  MODAL_SELECTORS.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      // Preserva elementos específicos
      if (PRESERVED_ELEMENTS.includes(el.id)) return;
      
      el.classList.remove('open', 'active');
    });
  });
}

/**
 * Garante que o scroll do body está liberado
 */
export function unlockBodyScroll() {
  requestAnimationFrame(() => {
    // Remove classe de scroll travado
    document.body.classList.remove('no-scroll');

    // Limpa estilos inline que podem ter sido aplicados
    const styleProps = [
      'overflow', 'paddingRight', 'marginRight', 
      'width', 'position', 'top', 'left'
    ];
    
    styleProps.forEach(prop => {
      document.body.style[prop] = '';
    });

    // Força reflow para corrigir deslocamentos
    void document.body.offsetWidth;
  });
}

/**
 * Reset completo da UI
 */
export function resetUI() {
  unlockBodyScroll();
  closeGenericModals();
}

// Auto-inicialização quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', resetUI);
} else {
  resetUI();
}

// Também escuta eventos de carregamento de modais
document.addEventListener('modals:loaded', resetUI);