/**
 * toc.js - Índice do Livro de Regras
 * Gerencia a exibição e navegação do índice lateral
 * 
 * Dependências:
 * - ./constants.js: Lista de capítulos
 * - ./loader.js: Carregamento de capítulos
 * - ./navigation.js: Navegação e URL (estado centralizado)
 */

import { RULEBOOK_CHAPTERS } from "./constants.js";
import { loadRulebookChapter } from "./loader.js";
import { getCurrentChapter, updateURLTopic } from "./navigation.js";

// ===== CONSTANTES =====
const ICONS = {
  CLOSED: "☰",
  OPEN: "✕"
};

const SELECTORS = {
  TOGGLE: 'toc-toggle',
  PANEL: 'toc-panel',
  OVERLAY: 'toc-overlay',
  LIST: 'toc-list',
  CHAPTER_TITLE: 'toc-chapter-title',
  CHAPTER_SELECT: 'chapter-select'
};

// ===== ESTADO PRIVADO =====
let isOpen = false;
let initialized = false;
let keydownHandler = null;

// ===== UTILITÁRIOS =====

/**
 * Obtém um elemento do DOM com verificação
 */
function getElement(id, required = false) {
  const el = document.getElementById(id);
  if (required && !el) {
    console.warn(`Elemento necessário não encontrado: #${id}`);
  }
  return el;
}

/**
 * Atualiza o ícone do botão toggle baseado no estado
 */
function updateToggleIcon() {
  const toggle = getElement(SELECTORS.TOGGLE);
  if (!toggle) return;
  
  toggle.textContent = isOpen ? ICONS.OPEN : ICONS.CLOSED;
  toggle.setAttribute('aria-label', isOpen ? 'Fechar índice' : 'Abrir índice');
  toggle.setAttribute('aria-expanded', isOpen.toString());
}

// ===== CONTROLE DO PAINEL =====

/**
 * Abre o painel do índice
 */
function openToc() {
  const panel = getElement(SELECTORS.PANEL);
  const overlay = getElement(SELECTORS.OVERLAY);
  
  if (isOpen || !panel || !overlay) return;
  
  isOpen = true;
  panel.classList.add('active');
  overlay.classList.add('active');
  document.body.classList.add('no-scroll');
  updateToggleIcon();
  
  // Disparar evento para outros componentes
  document.dispatchEvent(new CustomEvent('toc:opened'));
}

/**
 * Fecha o painel do índice
 */
function closeToc() {
  const panel = getElement(SELECTORS.PANEL);
  const overlay = getElement(SELECTORS.OVERLAY);
  
  if (!isOpen || !panel || !overlay) return;
  
  isOpen = false;
  panel.classList.remove('active');
  overlay.classList.remove('active');
  document.body.classList.remove('no-scroll');
  updateToggleIcon();
  
  // Disparar evento
  document.dispatchEvent(new CustomEvent('toc:closed'));
}

/**
 * Alterna o estado do painel
 */
function toggleToc() {
  isOpen ? closeToc() : openToc();
}

// ===== RENDERIZAÇÃO DO ÍNDICE =====

/**
 * Renderiza o índice para um capítulo específico
 */
export function renderTOC(chapterData) {
  const tocList = getElement(SELECTORS.LIST);
  const tocChapterTitle = getElement(SELECTORS.CHAPTER_TITLE);

  if (!tocList || !tocChapterTitle) return;

  tocChapterTitle.textContent = chapterData.title || 'Livro de Regras';
  tocList.innerHTML = '';

  const sections = chapterData.sections || [];
  
  if (sections.length === 0) {
    const li = document.createElement('li');
    li.className = 'toc-empty';
    li.textContent = 'Nenhuma seção disponível';
    tocList.appendChild(li);
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

// ===== SELEÇÃO DE CAPÍTULOS =====

/**
 * Renderiza o select de capítulos
 */
export function renderChapterSelect() {
  const select = getElement(SELECTORS.CHAPTER_SELECT);
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

  // Remove listener antigo antes de adicionar novo
  select.onchange = null;
  
  // 👇 MUDA AQUI: passa null como topicOverride para não restaurar tópico
  select.addEventListener('change', () => {
    loadRulebookChapter(select.value, null);
  });
}

/**
 * Navega para um capítulo pelo índice
 * Agora aceita um parâmetro topicOverride opcional
 */
export function switchToChapterByIndex(index, topicOverride = null) {
  const chapter = RULEBOOK_CHAPTERS[index];
  if (!chapter) {
    console.warn(`Índice de capítulo inválido: ${index}`);
    return;
  }

  // 👇 PASSA topicOverride para o loader
  loadRulebookChapter(chapter.file, topicOverride);

  const select = getElement(SELECTORS.CHAPTER_SELECT);
  if (select) select.value = chapter.file;
}

// ===== HANDLERS DE EVENTOS =====

/**
 * Handler para clique nos links do índice
 */
function handleTocLinkClick(e) {
  const link = e.target.closest('a');
  if (!link) return;

  e.preventDefault();
  
  const href = link.getAttribute('href');
  if (!href || !href.startsWith('#')) return;
  
  const targetId = href.substring(1); // Remove o '#'
  if (!targetId) return;

  const targetElement = document.getElementById(targetId);
  if (!targetElement) {
    console.warn(`Elemento não encontrado: #${targetId}`);
    return;
  }

  updateURLTopic(targetId);
  targetElement.scrollIntoView({ behavior: 'smooth' });
  closeToc();
}

/**
 * Handler para tecla ESC
 */
function handleKeyDown(e) {
  if (e.key === 'Escape' && isOpen) {
    closeToc();
  }
}

// ===== INICIALIZAÇÃO =====

/**
 * Inicializa o sistema de índice
 */
export function initTOCToggle() {
  if (initialized) {
    return;
  }

  const toggle = getElement(SELECTORS.TOGGLE, true);
  const panel = getElement(SELECTORS.PANEL, true);
  const overlay = getElement(SELECTORS.OVERLAY, true);
  const tocList = getElement(SELECTORS.LIST, true);

  if (!toggle || !panel || !overlay || !tocList) {
    console.error('TOC: elementos necessários não encontrados');
    return;
  }

  // Remove listeners antigos se existirem
  toggle.removeEventListener('click', toggleToc);
  tocList.removeEventListener('click', handleTocLinkClick);
  
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler);
  }

  // Adiciona novos listeners
  toggle.addEventListener('click', toggleToc);
  tocList.addEventListener('click', handleTocLinkClick);
  
  keydownHandler = handleKeyDown;
  document.addEventListener('keydown', keydownHandler);

  // Estado inicial
  updateToggleIcon();
  
  initialized = true;
}

/* Limpa os listeners (útil para hot-reload ou destruição) */
export function destroyTOC() {
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler);
    keydownHandler = null;
  }
  
  const toggle = getElement(SELECTORS.TOGGLE);
  if (toggle) {
    toggle.removeEventListener('click', toggleToc);
  }
  
  const tocList = getElement(SELECTORS.LIST);
  if (tocList) {
    tocList.removeEventListener('click', handleTocLinkClick);
  }
  
  initialized = false;
  isOpen = false;
  
  // Garantir que o painel está fechado
  closeToc();
}