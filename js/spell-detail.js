/**
 * spell-detail.js - Modal de detalhes da magia
 * Versão refatorada com eventos e encapsulamento
 * 
 * Dependências: Nenhuma
 * Eventos ouvidos: spell:selected
 * Eventos disparados: spell-detail:opened, spell-detail:closed
 */

const SpellDetailManager = (function() {
  'use strict';
  
  // ===== CONSTANTES =====
  const SCHOOL_NAMES = {
    'neofita': 'Neófita',
    'bruxaria': 'Bruxaria',
    'divinacao': 'Divinação',
    'feiticaria': 'Feitiçaria'
  };
  
  // ===== ESTADO PRIVADO =====
  let isOpen = false;
  let currentSpell = null;
  
  // ===== UTILITÁRIOS =====
  
  /**
   * Retorna o modal de detalhes
   */
  function getModal() {
    return document.getElementById('spell-detail-modal');
  }
  
  /**
   * Retorna o overlay
   */
  function getOverlay() {
    return document.getElementById('spell-detail-overlay');
  }
  
  /**
   * Escapa HTML para prevenir XSS
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * Define o conteúdo de um elemento com segurança
   */
  function setElementContent(elementId, content, isHtml = false) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (isHtml) {
      element.innerHTML = content;
    } else {
      element.textContent = content;
    }
  }
  
  // ===== RENDERIZAÇÃO =====
  
  /**
   * Preenche o modal com os dados da magia
   */
  function populateSpellDetails(spell) {
    if (!spell) return;
    
    // Título
    setElementContent('spell-detail-title', spell.name || 'Magia sem nome');
    
    // Custo
    setElementContent('spell-detail-cost', spell.cost || '—');
    
    // Escola (formatada)
    const schoolName = SCHOOL_NAMES[spell.school] || 
                      (spell.school ? spell.school.charAt(0).toUpperCase() + spell.school.slice(1) : 'Desconhecida');
    setElementContent('spell-detail-school', schoolName);
    
    // Nível
    setElementContent('spell-detail-level', spell.level ? `Nível ${spell.level}` : 'Nível —');
    
    // Descrição
    setElementContent('spell-detail-description', spell.description || 'Descrição não disponível.');
    
    // Tags
    renderTags(spell);
  }
  
  /**
   * Renderiza as tags da magia
   */
  function renderTags(spell) {
    const tagsContainer = document.getElementById('spell-detail-tags');
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = '';
    
    const tags = [];
    
    // Adiciona tags do array
    if (spell.tags && Array.isArray(spell.tags)) {
      tags.push(...spell.tags);
    }
    
    // Adiciona tag de combate se existir
    if (spell.combat) {
      tags.push('combate');
    }
    
    // Adiciona tag de escola como fallback
    if (tags.length === 0 && spell.school) {
      tags.push(schoolName.toLowerCase());
    }
    
    // Renderiza cada tag
    tags.forEach(tag => {
      const tagSpan = document.createElement('span');
      tagSpan.className = 'spell-detail-tag';
      
      // Adiciona classe especial para tag de combate
      if (tag.toLowerCase() === 'combate') {
        tagSpan.classList.add('combat');
      }
      
      tagSpan.textContent = tag;
      tagsContainer.appendChild(tagSpan);
    });
    
    // Se ainda não houver tags, mostra uma mensagem
    if (tagsContainer.children.length === 0) {
      const emptyTag = document.createElement('span');
      emptyTag.className = 'spell-detail-tag empty';
      emptyTag.textContent = 'sem tags';
      tagsContainer.appendChild(emptyTag);
    }
  }
  
  // ===== CONTROLE DO MODAL =====
  
  /**
   * Abre o modal de detalhes com uma magia específica
   */
  function openSpellDetail(spell) {
    const modal = getModal();
    const overlay = getOverlay();
    
    if (!modal || !overlay) {
      console.warn('Elementos do modal de detalhes não encontrados');
      return;
    }
    
    if (!spell) {
      console.warn('Tentativa de abrir detalhes sem magia');
      return;
    }
    
    currentSpell = spell;
    populateSpellDetails(spell);
    
    isOpen = true;
    modal.classList.add('active');
    overlay.classList.add('active');
    document.body.classList.add('no-scroll');
    
    // Focar no modal para acessibilidade
    setTimeout(() => {
      modal.focus();
    }, 100);
    
    // Disparar evento
    document.dispatchEvent(new CustomEvent('spell-detail:opened', {
      detail: { spell }
    }));
  }
  
  /**
   * Fecha o modal de detalhes
   */
  function closeSpellDetail() {
    const modal = getModal();
    const overlay = getOverlay();
    
    if (!isOpen || !modal || !overlay) return;
    
    isOpen = false;
    modal.classList.remove('active');
    overlay.classList.remove('active');
    document.body.classList.remove('no-scroll');
    
    // Disparar evento
    document.dispatchEvent(new CustomEvent('spell-detail:closed', {
      detail: { spell: currentSpell }
    }));
    
    currentSpell = null;
  }
  
  /**
   * Handler para tecla ESC
   */
  function handleKeyDown(e) {
    if (e.key === 'Escape' && isOpen) {
      closeSpellDetail();
    }
  }
  
  /**
   * Handler para evento de seleção de magia
   */
  function handleSpellSelected(event) {
    const { spell } = event.detail || {};
    if (spell) {
      openSpellDetail(spell);
    }
  }
  
  // ===== INICIALIZAÇÃO =====
  
  /**
   * Inicializa o gerenciador de detalhes
   */
function init() {
  const modal = getModal();
  const closeBtn = document.getElementById('spell-detail-close');
  const overlay = getOverlay();
  
  if (!modal || !closeBtn || !overlay) {
    console.warn('Elementos do modal de detalhes não encontrados');
    return;
  }
  
  if (modal.dataset.initialized === 'true') {
    return;
  }
  
  modal.dataset.initialized = 'true';
  
  // Botões de fechar
  closeBtn.addEventListener('click', closeSpellDetail);
  overlay.addEventListener('click', closeSpellDetail);
  
  // Fechar com ESC
  document.addEventListener('keydown', handleKeyDown);
  
  // Ouvir evento de seleção de magia (DESACOPLADO)
  document.addEventListener('spell:selected', handleSpellSelected);
  
}
  
  // ===== API PÚBLICA =====
  return {
    init: init,
    open: openSpellDetail,
    close: closeSpellDetail,
    getCurrentSpell: () => currentSpell,
    isOpen: () => isOpen
  };
})();

// ===== INICIALIZAÇÃO AUTOMÁTICA =====

/**
 * Inicializa o SpellDetailManager quando os modais estiverem carregados
 */
function initializeSpellDetail() {
  if (document.getElementById('spell-detail-modal')) {
    SpellDetailManager.init();
  } else {
    document.addEventListener('modals:loaded', SpellDetailManager.init);
  }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSpellDetail);
} else {
  initializeSpellDetail();
}

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpellDetailManager;
}