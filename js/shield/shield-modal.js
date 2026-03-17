// js/shield/shield-modal.js
import { RULEBOOK_CHAPTERS } from '../rulebook/constants.js';

const modal = document.getElementById('shield-modal');
const modalTitle = document.getElementById('shield-modal-title');
const modalBody = document.getElementById('shield-modal-body');
const closeBtn = document.getElementById('shield-modal-close');

let allData = null;

const BUTTON_CONFIG = {
  'Testes':        { id: 'teste_item',     prop: 'teste_item',     title: 'Testes' },
  'Combate':       { id: 'combate_item',   prop: 'combate_item',   title: 'Combate' },
  'Iniciativa':    { id: 'init_item',      prop: 'init_item',      title: 'Iniciativa' },
  'Magia':         { id: 'magia_item',     prop: 'magia_item',     title: 'Magia' },
  'Condições':     { id: 'condic_item',    prop: 'condic_item',    title: 'Condições' },
  'Seres':         { id: 'seres_item',     prop: 'seres_item',     title: 'Seres' },
  'Classes':       { id: 'classes_item',   prop: 'classes_item',   title: 'Classes' },
  'Técnicas':      { id: 'tec_item',       prop: 'tec_item',       title: 'Técnicas' },
  'Estudos':       { id: 'estudos_item',   prop: 'estudos_item',   title: 'Estudos' },
  'Segredos':      { id: 'segredos_item',  prop: 'segredos_item',  title: 'Segredos' },
  'Aventura':      { id: 'aventura_item',  prop: 'aventura_item',  title: 'Aventura' },
  'Armas':         { id: 'armas_item',     prop: 'armas_item',     title: 'Armas' },
  'Montarias':     { id: 'montarias_item', prop: 'montarias_item', title: 'Montarias' },
  'Loja Combate':  { id: 'lojacomb_item',  prop: 'lojacomb_item',  title: 'Loja Combate' },
  'Loja Arcana':   { id: 'lojarc_item',    prop: 'lojarc_item',    title: 'Loja Arcana' }
};

async function loadAllChapters() {
  if (allData) return allData;
  
  allData = { sections: [] };
  
  const fetchPromises = RULEBOOK_CHAPTERS.map(async (chapter) => {
    try {
      const response = await fetch(`../../data/rulebook/${chapter.file}`)
      const data = await response.json();
      allData.sections.push(...(data.sections || []));
    } catch (e) {
      console.warn(`Erro ao carregar ${chapter.file}:`, e);
    }
  });
  
  await Promise.all(fetchPromises);
  return allData;
}

function findItemsByType(data, config) {
  const items = [];

  function search(obj) {
    if (!obj) return;
    
    if (obj[config.prop]) {
      items.push({ type: 'paragraph', text: obj[config.prop] });
    }
    
    if (obj.id === config.id) {
      if (obj.items) items.push({ type: 'list', items: obj.items });
      if (obj.text) items.push({ type: 'paragraph', text: obj.text });
    }
    
    if (obj.content) obj.content.forEach(search);
    if (obj.sections) obj.sections.forEach(search);
    if (Array.isArray(obj)) obj.forEach(search);
  }

  search(data);
  return items;
}

function renderShieldContent(items) {
  if (!modalBody) return;
  
  modalBody.innerHTML = items.map(item => {
    if (item.type === 'paragraph') {
      return `<p>${item.text}</p>`;
    }
    if (item.type === 'list') {
      const listItems = item.items.map(text => `<li>${text}</li>`).join('');
      return `<ul>${listItems}</ul>`;
    }
    return '';
  }).join('');
}

async function openShieldModal(buttonText) {
  const config = BUTTON_CONFIG[buttonText];
  if (!config) return;
  
  const data = await loadAllChapters();
  const items = findItemsByType(data, config);
  
  modalTitle.textContent = config.title;
  renderShieldContent(items);
  modal.classList.add('active');
}

function closeShieldModal() {
  modal.classList.remove('active');
  if (modalBody) modalBody.innerHTML = '';
}

function setupEventListeners() {
  if (closeBtn) {
    closeBtn.addEventListener('click', closeShieldModal);
  }
  
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeShieldModal();
    });
  }
  
  document.querySelectorAll('.shield-button').forEach(btn => {
    const text = btn.textContent.trim();
    if (BUTTON_CONFIG[text]) {
      btn.addEventListener('click', () => openShieldModal(text));
    }
  });
}

// Inicialização
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupEventListeners);
} else {
  setupEventListeners();
}