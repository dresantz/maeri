/**
 * dice.js - Controle do painel de dados
 * Versão refatorada com encapsulamento
 * 
 * Eventos ouvidos: modals:loaded
 * Eventos disparados: dice:opened, dice:closed
 */

const DiceManager = (function() {
  'use strict';
  
  // ===== ESTADO PRIVADO =====
  let isOpen = false;
  
  // ===== UTILITÁRIOS =====
  
  function getPanel() {
    return document.getElementById('dice-panel');
  }
  
  function getOverlay() {
    return document.getElementById('dice-overlay');
  }
  
  // ===== CONTROLE DO MODAL =====
  
  function openDice() {
    const panel = getPanel();
    const overlay = getOverlay();
    
    if (isOpen || !panel || !overlay) return;
    
    isOpen = true;
    panel.classList.add('active');
    overlay.classList.add('active');
    document.body.classList.add('no-scroll');
    
    // Disparar evento
    document.dispatchEvent(new CustomEvent('dice:opened'));
  }
  
  function closeDice() {
    const panel = getPanel();
    const overlay = getOverlay();
    
    if (!isOpen || !panel || !overlay) return;
    
    isOpen = false;
    panel.classList.remove('active');
    overlay.classList.remove('active');
    document.body.classList.remove('no-scroll');
    
    // Disparar evento
    document.dispatchEvent(new CustomEvent('dice:closed'));
  }
  
  // ===== INICIALIZAÇÃO =====
  
  function init() {
    const diceBtn = document.getElementById('dice-toggle');
    const diceClose = document.getElementById('dice-close');
    const dicePanel = getPanel();
    const diceOverlay = getOverlay();
    
    if (!diceBtn || !diceClose || !dicePanel || !diceOverlay) {
      console.warn('Elementos do painel de dados não encontrados');
      return;
    }
    
    if (dicePanel.dataset.modalInitialized === 'true') {
      return;
    }
    
    dicePanel.dataset.modalInitialized = 'true';
    
    // Abrir modal
    diceBtn.addEventListener('click', openDice);
    
    // Fechar modal (botão X)
    diceClose.addEventListener('click', closeDice);
    
    // Fechar modal (clique no overlay)
    diceOverlay.addEventListener('click', closeDice);
    
    // Fechar modal (tecla ESC)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeDice();
      }
    });
    
  }
  
  // ===== API PÚBLICA =====
  return {
    init: init,
    open: openDice,
    close: closeDice,
    isOpen: () => isOpen
  };
})();

// ===== INICIALIZAÇÃO AUTOMÁTICA =====

function initializeDice() {
  if (document.getElementById('dice-panel')) {
    DiceManager.init();
  } else {
    document.addEventListener('modals:loaded', DiceManager.init);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDice);
} else {
  initializeDice();
}

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DiceManager;
}