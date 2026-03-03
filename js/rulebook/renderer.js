/**
 * renderer.js - Renderização do conteúdo do rulebook
 * Converte dados JSON em elementos DOM
 * 
 * Dependências:
 * - ./navigation.js: Scroll spy e restauração de tópico
 */

import { observeTopics, restoreLastTopic } from "./navigation.js";

// ===== CONSTANTES =====
const MARK_PATTERN = /\[(.*?)\]/g;
const MARK_CLASS = 'mark';

// ===== UTILITÁRIOS =====

/**
 * Cria um elemento DOM com atributos básicos
 */
function createElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

/**
 * Aplica marcações [texto] em um elemento
 */
function applyMarkings(element, text) {
  if (!text) return;
  element.innerHTML = text.replace(MARK_PATTERN, `<span class="${MARK_CLASS}">$1</span>`);
}

/**
 * Processa um bloco de conteúdo recursivamente
 */
function processBlock(block) {
  if (!block?.type) return null;
  
  const handlers = {
    paragraph: renderParagraph,
    list: renderList,
    table: renderTable,
    subsections: renderSubsections,
    spellList: renderSpellList,
    spell: renderSpellAsParagraph,
    nestedList: renderNestedList
  };
  
  const handler = handlers[block.type];
  return handler ? handler(block) : null;
}

// ===== RENDERIZADORES ESPECÍFICOS =====

function renderParagraph(block) {
  const p = document.createElement('p');
  if (block.id) {
    p.id = block.id;
    p.dataset.topic = 'true';
  }
  applyMarkings(p, block.text);
  return p;
}

function renderList(block) {
  const listEl = document.createElement(block.style === 'ordered' ? 'ol' : 'ul');
  
  (block.items || []).forEach(item => {
    const li = document.createElement('li');
    
    if (typeof item === 'string') {
      applyMarkings(li, item);
    } else if (item?.text) {
      applyMarkings(li, item.text);
      if (Array.isArray(item.subitems)) {
        const subUl = document.createElement('ul');
        item.subitems.forEach(sub => {
          const subLi = createElement('li', null, sub);
          subUl.appendChild(subLi);
        });
        li.appendChild(subUl);
      }
    }
    
    listEl.appendChild(li);
  });
  
  return listEl;
}

function renderNestedList(block) {
  const ul = createElement('ul', 'nested-list');
  
  (block.items || []).forEach(item => {
    const li = document.createElement('li');
    
    if (item.title) {
      li.appendChild(createElement('strong', null, item.title));
    }
    
    if (Array.isArray(item.items)) {
      const subUl = document.createElement('ul');
      item.items.forEach(sub => {
        subUl.appendChild(createElement('li', null, sub));
      });
      li.appendChild(subUl);
    }
    
    ul.appendChild(li);
  });
  
  return ul;
}

function renderTable(block) {
  const fragment = document.createDocumentFragment();
  
  if (block.caption) {
    fragment.appendChild(createElement('p', 'table-caption', block.caption));
  }
  
  const wrapper = createElement('div', 'table-wrapper');
  const table = document.createElement('table');

  // Cabeçalho
  if (block.columns?.length) {
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    block.columns.forEach(col => {
      tr.appendChild(createElement('th', null, col));
    });
    thead.appendChild(tr);
    table.appendChild(thead);
  }

  // Corpo
  const tbody = document.createElement('tbody');
  (block.rows || []).forEach(row => {
    const tr = document.createElement('tr');
    row.forEach(cell => {
      const td = createElement('td', null, cell);
      applyMarkings(td, cell);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  
  table.appendChild(tbody);
  wrapper.appendChild(table);
  fragment.appendChild(wrapper);
  
  return fragment;
}

function renderSubsections(block) {
  const fragment = document.createDocumentFragment();
  
  (block.items || []).forEach(sub => {
    const wrap = createElement('div', 'subsection');
    if (sub.id) wrap.id = sub.id;
    
    wrap.appendChild(createElement('h3', null, sub.title || 'Untitled'));
    
    (sub.content || []).forEach(subBlock => {
      const element = processBlock(subBlock);
      if (element) wrap.appendChild(element);
    });
    
    fragment.appendChild(wrap);
  });
  
  return fragment;
}

function renderSpellList(block) {
  const fragment = document.createDocumentFragment();
  
  (block.spells || []).forEach(spell => {
    const element = renderSpellAsParagraph({ ...spell, type: 'spell' });
    if (element) fragment.appendChild(element);
  });
  
  return fragment;
}

function renderSpellAsParagraph(block) {
  const parts = [];
  
  if (block.name) {
    parts.push(block.name.endsWith('.') ? block.name : `${block.name}.`);
  }
  
  if (block.description) {
    const desc = block.description.trim();
    parts.push(desc.endsWith('.') ? desc : `${desc}.`);
  }
  
  if (block.cost) {
    parts.push(block.cost.endsWith('.') ? block.cost : `${block.cost}.`);
  }
  
  if (parts.length === 0) return null;
  
  const p = document.createElement('p');
  p.className = 'spell-entry';
  if (block.id) p.id = block.id;
  
  applyMarkings(p, parts.join(' '));
  
  return p;
}

// ===== RENDERIZADOR PRINCIPAL =====

/**
 * Renderiza um capítulo completo do rulebook
 */
export function renderRulebookChapter(chapterData) {
  const container = document.getElementById('rulebook-content');
  if (!container) {
    console.error('Container rulebook-content não encontrado');
    return;
  }

  // Limpa o conteúdo anterior
  container.innerHTML = '';
  
  // Força reflow (necessário para animações/transições)
  container.offsetHeight;

  // Usa DocumentFragment para melhor performance
  const fragment = document.createDocumentFragment();

  // Cabeçalho do capítulo
  const header = document.createElement('header');
  header.className = 'chapter-header';
  header.appendChild(createElement('h1', null, chapterData.id || 'Rulebook'));
  
  if (chapterData.description) {
    header.appendChild(createElement('p', 'chapter-description', chapterData.description));
  }
  
    fragment.appendChild(header);

    // Seções do capítulo
    (chapterData.sections || []).forEach(section => {
      const sectionEl = document.createElement('section');
      sectionEl.className = 'chapter-section';
      
      if (section.id) {
        sectionEl.id = section.id;
        sectionEl.dataset.topic = 'true';
        sectionEl.setAttribute('aria-labelledby', `${section.id}-title`);
      }

      const h2 = createElement('h2', 'section-title', section.title || 'Untitled Section');
      if (section.id) h2.id = `${section.id}-title`;
      sectionEl.appendChild(h2);

      (section.content || []).forEach(block => {
        const element = processBlock(block);
        if (element) sectionEl.appendChild(element);
      });

      fragment.appendChild(sectionEl);
    });

    // Adiciona todo o conteúdo de uma vez
    container.appendChild(fragment);

    // Usa requestAnimationFrame para garantir que o DOM está pronto
    requestAnimationFrame(() => {
    // Ativa observadores de navegação
    observeTopics();
    
    // Restaura último tópico visitado
    restoreLastTopic();

  });
}

// ===== EXPORTAÇÕES ADICIONAIS (opcional) =====
export { processBlock }; // Útil para testes ou uso em outros contextos