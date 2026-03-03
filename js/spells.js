/**
 * spells.js - Controle de magias com filtros combinados
 * Versão refatorada com encapsulamento e eliminação de duplicações
 * 
 * Dependências: spell-detail.js (via eventos)
 * Eventos ouvidos: modals:loaded
 * Eventos disparados: spell:selected
 */

const SpellsManager = (function() {
  'use strict';
  
  // ===== CONSTANTES =====
  const STORAGE_KEYS = {
    FILTERS: 'maeri-spells-filters'
  };
  
  const FILTER_STRUCTURE = {
    schools: {
      neofita: false,
      bruxaria: false,
      divinacao: false,
      feiticaria: false
    },
    levels: {
      1: false,
      3: false,
      5: false
    }
  };
  
  const SEARCH_DELAY = 200; // ms
  const SCHOOL_MAP = {
    'neófita': 'neofita',
    'neofita': 'neofita',
    'bruxaria': 'bruxaria',
    'divinação': 'divinacao',
    'divinacao': 'divinacao',
    'feitiçaria': 'feiticaria',
    'feiticaria': 'feiticaria'
  };
  
  // ===== ESTADO PRIVADO =====
  let isOpen = false;
  let spells = [];
  let filteredSpells = [];
  let filters = JSON.parse(JSON.stringify(FILTER_STRUCTURE));
  let searchTimeout = null;
  
  // ===== UTILITÁRIOS =====
  
  function getBasePath() {
    const isInPages = window.location.pathname.includes('/pages/');
    return isInPages ? '../' : './';
  }
  
  function getModal() {
    return document.getElementById('spells-modal');
  }
  
  function getOverlay() {
    return document.getElementById('spells-overlay');
  }
  
  function normalizeSchool(school) {
    if (!school) return '';
    return SCHOOL_MAP[school.toLowerCase()] || school.toLowerCase();
  }
  
  // ===== CARREGAMENTO DE DADOS =====
  
  function extractSpellsFromChapter(chapter) {
    const result = [];
    if (!chapter.sections) return result;
    
    chapter.sections.forEach(section => {
      if (!section.content) return;
      section.content.forEach(block => {
        if (block.type === 'spellList' && Array.isArray(block.spells)) {
          block.spells.forEach(spell => {
            result.push({ ...spell });
          });
        }
      });
    });
    
    return result;
  }
  
  async function loadSpells() {
    try {
      const basePath = getBasePath();
      const response = await fetch(`${basePath}data/rulebook/04-magia.json`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      spells = extractSpellsFromChapter(data);
      
      loadFiltersFromStorage();
      applyFilters();
    } catch (e) {
      spells = getFallbackSpells();
      applyFilters();
    }
  }
  
  function getFallbackSpells() {
    return [
      { name: 'Bola de Fogo', school: 'bruxaria', level: 3 },
      { name: 'Cura Leve', school: 'divinacao', level: 1 },
      { name: 'Invisibilidade', school: 'feiticaria', level: 3 }
    ];
  }
  
  // ===== PERSISTÊNCIA DE FILTROS =====
  
  function saveFiltersToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(filters));
    } catch (e) {
      console.warn('Não foi possível salvar filtros:', e);
    }
  }
  
  function loadFiltersFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FILTERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        filters = {
          schools: { ...FILTER_STRUCTURE.schools, ...parsed.schools },
          levels: { ...FILTER_STRUCTURE.levels, ...parsed.levels }
        };
      }
    } catch (e) {
      console.warn('Não foi possível carregar filtros:', e);
    }
  }
  
  // ===== FILTRAGEM =====
  
  function hasActiveFilters() {
    return Object.values(filters.schools).some(v => v) ||
           Object.values(filters.levels).some(v => v);
  }
  
  function applyFilters() {
    const searchInput = document.getElementById('spells-search');
    const searchTerm = searchInput?.value.toLowerCase() || '';
    const hasActiveFilter = hasActiveFilters();
    
    filteredSpells = spells.filter(spell => {
      if (searchTerm && !spell.name.toLowerCase().includes(searchTerm)) {
        return false;
      }
      
      if (hasActiveFilter) {
        const spellSchool = normalizeSchool(spell.school);
        
        const matchesSchool = !Object.values(filters.schools).some(v => v) || 
                             filters.schools[spellSchool];
        
        const matchesLevel = !Object.values(filters.levels).some(v => v) || 
                            filters.levels[spell.level];
        
        return matchesSchool && matchesLevel;
      }
      
      return true;
    });
    
    renderSpells();
    saveFiltersToStorage();
  }
  
  // ===== RENDERIZAÇÃO =====
  
  function renderSpells() {
    const list = document.getElementById('spells-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (filteredSpells.length === 0) {
      renderEmptyState(list);
      return;
    }
    
    filteredSpells.forEach(spell => {
      const li = createSpellElement(spell);
      list.appendChild(li);
    });
  }
  
  function createSpellElement(spell) {
    const li = document.createElement('li');
    li.className = 'spell-item';
    li.setAttribute('data-spell-id', spell.id || spell.name);
    
    li.innerHTML = `
      <div class="spell-name">${escapeHtml(spell.name)}</div>
      <div class="spell-meta">
        <span>${escapeHtml(spell.school)}</span>
        <span>Nível ${spell.level}</span>
      </div>
    `;
    
    li.addEventListener('click', (e) => {
      e.stopPropagation();
      selectSpell(spell);
    });
    
    return li;
  }
  
  function renderEmptyState(list) {
    const li = document.createElement('li');
    li.className = 'spell-item empty-state';
    
    const hasActiveFilter = hasActiveFilters();
    const searchInput = document.getElementById('spells-search');
    const hasSearch = searchInput?.value?.length > 0;
    
    let message = 'Nenhuma magia encontrada';
    if (hasSearch && hasActiveFilter) {
      message = 'Nenhuma magia com esses filtros e busca';
    } else if (hasSearch) {
      message = 'Nenhuma magia com esse nome';
    } else if (hasActiveFilter) {
      message = 'Nenhuma magia com esses filtros';
    }
    
    li.innerHTML = `<div class="spell-name">${message}</div>`;
    list.appendChild(li);
  }
  
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // ===== SELEÇÃO DE MAGIA =====
  
  function selectSpell(spell) {
    const event = new CustomEvent('spell:selected', {
      detail: { spell }
    });
    document.dispatchEvent(event);
  }
  
  // ===== CONTROLE DO MODAL =====
  
  function openSpells() {
    const modal = getModal();
    const overlay = getOverlay();
    
    if (isOpen || !modal || !overlay) return;
    
    isOpen = true;
    modal.classList.add('active');
    overlay.classList.add('active');
    document.body.classList.add('no-scroll');
    
    setTimeout(() => {
      document.getElementById('spells-search')?.focus();
    }, 100);
    
    document.dispatchEvent(new CustomEvent('spells:opened'));
  }
  
  function closeSpells() {
    const modal = getModal();
    const overlay = getOverlay();
    
    if (!isOpen || !modal || !overlay) return;
    
    isOpen = false;
    modal.classList.remove('active');
    overlay.classList.remove('active');
    document.body.classList.remove('no-scroll');
    
    document.dispatchEvent(new CustomEvent('spells:closed'));
  }
  
  // ===== FILTROS UI =====
  
  function setupFilterListeners() {
    setupDropdownToggles();
    
    setupCheckboxListeners('[data-school]', (checkbox, value) => {
      const school = checkbox.dataset.school;
      filters.schools[school] = value;
      applyFilters();
    });
    
    setupCheckboxListeners('[data-level]', (checkbox, value) => {
      const level = parseInt(checkbox.dataset.level);
      filters.levels[level] = value;
      applyFilters();
    });
    
    const clearBtn = document.getElementById('clear-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearFilters);
    }
  }
  
  function setupDropdownToggles() {
    document.querySelectorAll('.filter-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const options = e.target.nextElementSibling;
        const isVisible = options.style.display === 'block';
        
        document.querySelectorAll('.filter-options').forEach(opt => {
          opt.style.display = 'none';
        });
        
        options.style.display = isVisible ? 'none' : 'block';
        
        const arrow = isVisible ? '▼' : '▲';
        e.target.innerHTML = e.target.innerHTML.replace(/[▼▲]/g, arrow);
      });
    });
    
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.filter-group')) {
        document.querySelectorAll('.filter-options').forEach(opt => {
          opt.style.display = 'none';
        });
        document.querySelectorAll('.filter-toggle').forEach(btn => {
          btn.innerHTML = btn.innerHTML.replace('▲', '▼');
        });
      }
    });
  }
  
  function setupCheckboxListeners(selector, handler) {
    document.querySelectorAll(selector).forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        handler(e.target, e.target.checked);
      });
    });
  }
  
  function syncFilterUI() {
    Object.keys(filters.schools).forEach(school => {
      const checkbox = document.querySelector(`[data-school="${school}"]`);
      if (checkbox) checkbox.checked = filters.schools[school];
    });
    
    Object.keys(filters.levels).forEach(level => {
      const checkbox = document.querySelector(`[data-level="${level}"]`);
      if (checkbox) checkbox.checked = filters.levels[level];
    });
  }
  
  function clearFilters() {
    filters = JSON.parse(JSON.stringify(FILTER_STRUCTURE));
    syncFilterUI();
    applyFilters();
    showFilterFeedback('Filtros limpos');
  }
  
  function showFilterFeedback(message) {
    const feedback = document.getElementById('filter-feedback');
    if (!feedback) return;
    
    feedback.textContent = message;
    feedback.classList.add('visible');
    
    setTimeout(() => {
      feedback.classList.remove('visible');
    }, 1500);
  }
  
  // ===== INICIALIZAÇÃO =====
  
  function init() {
    const modal = getModal();
    const spellsBtn = document.getElementById('spells-button');
    const spellsClose = document.getElementById('spells-close');
    const spellsOverlay = getOverlay();
    
    if (!modal || !spellsBtn || !spellsClose || !spellsOverlay) {
      console.warn('Elementos do modal de magias não encontrados');
      return;
    }
    
    if (modal.dataset.initialized === 'true') {
      return;
    }
    
    modal.dataset.initialized = 'true';
    
    spellsBtn.addEventListener('click', openSpells);
    spellsClose.addEventListener('click', closeSpells);
    spellsOverlay.addEventListener('click', closeSpells);
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeSpells();
      }
    });
    
    const searchInput = document.getElementById('spells-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(applyFilters, SEARCH_DELAY);
      });
    }
    
    setupFilterListeners();
    syncFilterUI();
    loadSpells();
  }
  
  // ===== API PÚBLICA =====
  return {
    init: init,
    open: openSpells,
    close: closeSpells,
    refresh: loadSpells,
    clearFilters: clearFilters,
    getCurrentSpells: () => [...filteredSpells],
    getFilters: () => JSON.parse(JSON.stringify(filters))
  };
})();

// ===== INICIALIZAÇÃO AUTOMÁTICA =====

function initializeSpells() {
  if (document.getElementById('spells-modal')) {
    SpellsManager.init();
  } else {
    document.addEventListener('modals:loaded', SpellsManager.init);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSpells);
} else {
  initializeSpells();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpellsManager;
}