/**
 * toc.js - Índice do Livro de Regras
 * Gerencia exibição, navegação e teclado do índice lateral
 */

import { RULEBOOK_CHAPTERS } from "./constants.js";
import { loadRulebookChapter } from "./loader.js";
import { getCurrentChapter, updateURLTopic } from "./navigation.js";

// ===== CONSTANTES =====
const ICONS = {
  CLOSED: "☰",
  OPEN: "✕"
};

// ===== ESTADO =====
let isOpen = false;
let initialized = false;
let keydownHandler = null;
let activeIndex = -1;

// ===== UTILITÁRIOS =====

function getElement(id) {
  return document.getElementById(id);
}

function updateToggleIcon() {
  const toggle = getElement('toc-toggle');
  if (!toggle) return;
  
  toggle.textContent = isOpen ? ICONS.OPEN : ICONS.CLOSED;
  toggle.setAttribute('aria-label', isOpen ? 'Fechar índice' : 'Abrir índice');
  toggle.setAttribute('aria-expanded', isOpen.toString());
}

// ===== CONTROLE DO PAINEL =====

function openToc() {
  const panel = getElement('toc-panel');
  const overlay = getElement('toc-overlay');
  
  if (isOpen || !panel || !overlay) return;
  
  isOpen = true;
  panel.classList.add('active');
  overlay.classList.add('active');
  document.body.classList.add('no-scroll');
  updateToggleIcon();
  
  document.dispatchEvent(new CustomEvent('toc:opened'));
}

function closeToc() {
  const panel = getElement('toc-panel');
  const overlay = getElement('toc-overlay');
  
  if (!isOpen || !panel || !overlay) return;
  
  isOpen = false;
  panel.classList.remove('active');
  overlay.classList.remove('active');
  document.body.classList.remove('no-scroll');
  updateToggleIcon();
  
  document.dispatchEvent(new CustomEvent('toc:closed'));
}

function toggleToc() {
  isOpen ? closeToc() : openToc();
}

// ===== RENDERIZAÇÃO =====

export function renderTOC(chapterData) {
  const tocList = getElement('toc-list');
  const tocChapterTitle = getElement('toc-chapter-title');
  
  if (!tocList || !tocChapterTitle) return;
  
  tocChapterTitle.textContent = chapterData.title || 'Livro de Regras';
  tocList.innerHTML = '';
  
  const sections = chapterData.sections || [];
  
  if (!sections.length) {
    tocList.innerHTML = '<li class="toc-empty">Nenhuma seção disponível</li>';
    return;
  }
  
  sections.forEach((section) => {
    if (!section.topic_id) return;
    
    const li = document.createElement('li');
    li.className = 'toc-item';
    
    const a = document.createElement('a');
    a.href = `#${section.topic_id}`;
    a.textContent = section.title || 'Sem título';
    a.setAttribute('data-section-id', section.topic_id);
    
    li.appendChild(a);
    tocList.appendChild(li);
  });
}

export function renderChapterSelect() {
  const select = getElement('chapter-select');
  if (!select) return;
  
  select.innerHTML = '';
  
  const currentChapter = getCurrentChapter();
  
  RULEBOOK_CHAPTERS.forEach((chapter, index) => {
    const option = document.createElement('option');
    option.value = chapter.file;
    option.textContent = chapter.title;
    option.selected = chapter.file === currentChapter;
    option.dataset.index = index;
    select.appendChild(option);
  });
  
  select.onchange = () => {
    loadRulebookChapter(select.value, null);
  };
}

export function switchToChapterByIndex(index, topicOverride = null) {
  const chapter = RULEBOOK_CHAPTERS[index];
  if (!chapter) return;
  
  loadRulebookChapter(chapter.file, topicOverride);
  
  const select = getElement('chapter-select');
  if (select) select.value = chapter.file;
}

// ===== HANDLERS =====

function handleTocLinkClick(e) {
  const link = e.target.closest('a');
  if (!link) return;
  
  e.preventDefault();
  
  const targetId = link.getAttribute('href')?.substring(1);
  if (!targetId) return;
  
  const targetElement = document.getElementById(targetId);
  if (!targetElement) return;
  
  updateURLTopic(targetId);
  targetElement.scrollIntoView({ behavior: 'smooth' });
  closeToc();
}

// ===== NAVEGAÇÃO POR TECLADO =====

function getTocItems() {
  const tocList = getElement('toc-list');
  return tocList ? Array.from(tocList.querySelectorAll('a')) : [];
}

function setActiveItem(index) {
  const items = getTocItems();
  if (!items.length) return;
  
  items.forEach(item => {
    item.classList.remove('active');
    item.removeAttribute('aria-selected');
  });
  
  activeIndex = Math.max(0, Math.min(index, items.length - 1));
  
  const el = items[activeIndex];
  el.classList.add('active');
  el.setAttribute('aria-selected', 'true');
  el.focus();
}

function handleTocKeyDown(e) {
  const items = getTocItems();
  if (!items.length) return;
  
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      setActiveItem(activeIndex < 0 ? 0 : activeIndex + 1);
      break;
      
    case 'ArrowUp':
      e.preventDefault();
      setActiveItem(Math.max(0, activeIndex - 1));
      break;
      
    case 'Home':
      e.preventDefault();
      setActiveItem(0);
      break;
      
    case 'End':
      e.preventDefault();
      setActiveItem(items.length - 1);
      break;
      
    case 'Enter':
    case ' ':
      e.preventDefault();
      if (activeIndex >= 0) {
        items[activeIndex].click();
      }
      break;
  }
}

// ===== INICIALIZAÇÃO =====

export function initTOCToggle() {
  if (initialized) return;
  
  const toggle = getElement('toc-toggle');
  const panel = getElement('toc-panel');
  const overlay = getElement('toc-overlay');
  const tocList = getElement('toc-list');
  
  if (!toggle || !panel || !overlay || !tocList) {
    console.error('TOC: elementos necessários não encontrados');
    return;
  }
  
  toggle.addEventListener('click', toggleToc);
  tocList.addEventListener('click', handleTocLinkClick);
  
  // Fechar ao clicar fora (no overlay)
  overlay.addEventListener('click', closeToc);
  
  // Fechar com ESC (funciona de qualquer lugar da página)
  keydownHandler = handleGlobalKeyDown;
  document.addEventListener('keydown', keydownHandler);
  
  // Navegação por teclado dentro da lista
  tocList.setAttribute('role', 'listbox');
  tocList.tabIndex = -1;
  tocList.addEventListener('keydown', handleTocKeyDown);

    function handleGlobalKeyDown(e) {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      closeToc();
    }
  }
  
  updateToggleIcon();
  initialized = true;
}

export function destroyTOC() {
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler);
    keydownHandler = null;
  }
  
  const toggle = getElement('toc-toggle');
  if (toggle) toggle.removeEventListener('click', toggleToc);
  
  const overlay = getElement('toc-overlay');
  if (overlay) overlay.removeEventListener('click', closeToc);
  
  const tocList = getElement('toc-list');
  if (tocList) {
    tocList.removeEventListener('click', handleTocLinkClick);
    tocList.removeEventListener('keydown', handleTocKeyDown);
  }
  
  initialized = false;
  isOpen = false;
  activeIndex = -1;
  closeToc();
}