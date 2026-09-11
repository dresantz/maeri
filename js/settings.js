/**
 * Settings Modal - Controle do modal de configurações
 * Inclui: Modal + Gerenciamento de Tema
 * 
 * Eventos ouvidos: modals:loaded
 * Eventos disparados: settings:opened, settings:closed, theme:changed
 */

const SettingsManager = (function() {
  'use strict';
  
  // ===== ESTADO PRIVADO =====
  let isOpen = false;
  
  // ===== CONSTANTES =====
  const THEMES = ['classic', 'sepia', 'dark', 'contrast', 'day', 'cozy'];
  const DEFAULT_THEME = 'classic';
  const STORAGE_KEY = 'maeri-theme';
  
  // ===== UTILITÁRIOS =====
  
  function getModal() {
    return document.getElementById('settings-modal');
  }
  
  function getOverlay() {
    return document.querySelector('#settings-modal .modal-overlay');
  }
  
  function getCloseButton() {
    return document.querySelector('#settings-modal .modal-close');
  }
  
  // ===== GERENCIAMENTO DE TEMA =====
  
  function getCurrentTheme() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
  }
  
  function setTheme(theme) {
    // Valida se o tema existe
    if (!THEMES.includes(theme)) {
      console.warn(`Tema inválido: ${theme}`);
      return;
    }
    
    // Aplica o tema no elemento raiz
    document.documentElement.setAttribute('data-theme', theme);
    
    // Salva no localStorage
    localStorage.setItem(STORAGE_KEY, theme);
    
    // Atualiza os botões de opção
    updateThemeButtons(theme);
    
    // Dispara evento
    document.dispatchEvent(new CustomEvent('theme:changed', {
      detail: { theme: theme }
    }));
  }
  
  function updateThemeButtons(activeTheme) {
    const themeOptions = document.querySelectorAll('[data-setting="theme"] .setting-option');
    
    themeOptions.forEach(option => {
      if (option.getAttribute('data-value') === activeTheme) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }
  
  function resetTheme() {
    setTheme(DEFAULT_THEME);
  }
  
  // ===== CONTROLE DO MODAL =====
  
  function openSettings() {
    const modal = getModal();
    
    if (isOpen || !modal) return;
    
    isOpen = true;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    
    // Foco no botão de fechar
    const closeBtn = getCloseButton();
    if (closeBtn) {
      closeBtn.focus();
    }
    
    document.dispatchEvent(new CustomEvent('settings:opened'));
  }
  
  function closeSettings() {
    const modal = getModal();
    
    if (!isOpen || !modal) return;
    
    // ===== ORDEM CORRETA PARA EVITAR ERRO DE ACESSIBILIDADE =====
    
    // 1. Remove o foco do elemento dentro do modal
    const closeBtn = getCloseButton();
    if (closeBtn && document.activeElement === closeBtn) {
      closeBtn.blur();
    }
    
    // 2. Move o foco para o botão de engrenagem
    const settingsBtn = document.getElementById('settings-button');
    if (settingsBtn) {
      settingsBtn.focus();
    }
    
    // 3. Agora esconde o modal
    isOpen = false;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    
    document.dispatchEvent(new CustomEvent('settings:closed'));
  }
  
  // ===== INICIALIZAÇÃO =====
  
  function initModal() {
    const settingsBtn = document.getElementById('settings-button');
    const modal = getModal();
    const overlay = getOverlay();
    const closeBtn = getCloseButton();
    
    if (!settingsBtn || !modal || !overlay || !closeBtn) {
      console.warn('Elementos do modal de configurações não encontrados');
      return;
    }
    
    if (modal.dataset.modalInitialized === 'true') {
      return;
    }
    
    modal.dataset.modalInitialized = 'true';
    
    // Abrir modal
    settingsBtn.addEventListener('click', openSettings);
    
    // Fechar modal (botão X)
    closeBtn.addEventListener('click', closeSettings);
    
    // Fechar modal (clique no overlay)
    overlay.addEventListener('click', closeSettings);
    
    // Fechar modal (tecla ESC)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeSettings();
      }
    });
  }
  
  function initTheme() {
    // Aplica o tema salvo
    const savedTheme = getCurrentTheme();
    setTheme(savedTheme);
    
    // Adiciona eventos aos botões de tema
    const themeOptions = document.querySelectorAll('[data-setting="theme"] .setting-option');
    
    themeOptions.forEach(option => {
      option.addEventListener('click', () => {
        const theme = option.getAttribute('data-value');
        setTheme(theme);
      });
    });
    
    // Botão de restaurar
    const resetButton = document.querySelector('[data-reset-settings]');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        resetTheme();
      });
    }
  }
  
  function init() {
    initModal();
    initTheme();
  }
  
  // ===== API PÚBLICA =====
  
  return {
    init: init,
    open: openSettings,
    close: closeSettings,
    setTheme: setTheme,
    getCurrentTheme: getCurrentTheme,
    resetTheme: resetTheme,
    isOpen: () => isOpen
  };
})();

// ===== INICIALIZAÇÃO AUTOMÁTICA =====

function initializeSettings() {
  if (document.getElementById('settings-modal')) {
    SettingsManager.init();
  } else {
    document.addEventListener('modals:loaded', SettingsManager.init);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSettings);
} else {
  initializeSettings();
}

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsManager;
}