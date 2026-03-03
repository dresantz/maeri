/**
 * navigation.js - Navegação do Rulebook
 * Gerencia navegação entre capítulos, scroll restoration e URL
 * 
 * Dependências:
 * - ./constants.js: Constantes do rulebook
 * - ./toc.js: Navegação por índice
 */

import { RULEBOOK_CHAPTERS, LAST_TOPIC_KEY } from "./constants.js";
import { switchToChapterByIndex } from "./toc.js";

// ===== CONSTANTES =====
const SCROLL_THRESHOLD = 300;
const OBSERVER_MARGIN = "0px 0px -70% 0px";

// ===== ESTADO GLOBAL =====
let currentChapterFile = null;
let observer = null;
let lastActiveTopic = null;
let navigationInitialized = false;

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const navEntry = performance.getEntriesByType("navigation")[0];
const isReload = navEntry?.type === "reload";

// ===== GETTERS/SETTERS =====

export function setCurrentChapter(fileName) {
  currentChapterFile = fileName;
}

export function getCurrentChapter() {
  return currentChapterFile;
}

// ===== HELPERS =====

function getCurrentChapterIndex() {
  if (!currentChapterFile) return -1;
  return RULEBOOK_CHAPTERS.findIndex(ch => ch.file === currentChapterFile);
}

export function getTopicFromURL() {
  return new URLSearchParams(window.location.search).get("topic");
}

export function updateURLTopic(topicId) {
  const url = new URL(window.location);
  const current = url.searchParams.get("topic");

  if (current === topicId) return;

  if (topicId) {
    url.searchParams.set("topic", topicId);
  } else {
    url.searchParams.delete("topic");
  }

  window.history.replaceState({}, "", url);
}

export function clearSavedTopic() {
  localStorage.removeItem(LAST_TOPIC_KEY);
}

// ===== NAVEGAÇÃO ENTRE CAPÍTULOS =====

export function updateChapterNavButtons() {
  const prev = document.getElementById("chapter-prev");
  const next = document.getElementById("chapter-next");

  if (!prev || !next) return;

  const index = getCurrentChapterIndex();

  prev.disabled = index <= 0;
  next.disabled = index === -1 || index >= RULEBOOK_CHAPTERS.length - 1;
}

function navigateChapter(direction) {
  const index = getCurrentChapterIndex();
  const target = index + direction;

  if (target < 0 || target >= RULEBOOK_CHAPTERS.length) return;

  clearSavedTopic();
  updateURLTopic(null);
  switchToChapterByIndex(target, false);
}

export function initChapterNavigation() {
  if (navigationInitialized) return;

  const prev = document.getElementById("chapter-prev");
  const next = document.getElementById("chapter-next");

  if (!prev || !next) {
    console.warn('Botões de navegação não encontrados');
    return;
  }

  const prevClone = prev.cloneNode(true);
  const nextClone = next.cloneNode(true);
  
  prev.parentNode?.replaceChild(prevClone, prev);
  next.parentNode?.replaceChild(nextClone, next);

  prevClone.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigateChapter(-1);
  });
  
  nextClone.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigateChapter(1);
  });

  prevClone.id = "chapter-prev";
  nextClone.id = "chapter-next";

  navigationInitialized = true;
  
  initBackToTopButton();
}

// ===== RESTORE DE TÓPICO =====

export function restoreLastTopic(override = null) {
  if (!override && !isReload) return;

  let saved = override || getTopicFromURL() || localStorage.getItem(LAST_TOPIC_KEY);
  if (!saved) return;

  let topicId = saved;
  let chapterIndex = null;

  try {
    const parsed = JSON.parse(saved);
    topicId = parsed.topicId;
    chapterIndex = parsed.chapterIndex;
  } catch {
    // Mantém saved como string simples
  }

  if (!topicId) return;

  if (chapterIndex !== null && chapterIndex !== getCurrentChapterIndex()) {
    switchToChapterByIndex(chapterIndex, false);
    return;
  }

  const target = document.getElementById(topicId);
  if (!target) return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      target.scrollIntoView({ block: "start" });
    });
  });
}

// ===== SCROLL SPY =====

export function observeTopics() {
  const topics = document.querySelectorAll("[data-topic]");
  if (!topics.length) return;

  observer?.disconnect();
  lastActiveTopic = null;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        const id = entry.target.id;
        if (!id || id === lastActiveTopic) continue;

        lastActiveTopic = id;
        const chapterIndex = getCurrentChapterIndex();

        localStorage.setItem(
          LAST_TOPIC_KEY,
          JSON.stringify({ topicId: id, chapterIndex })
        );

        updateURLTopic(id);
      }
    },
    { rootMargin: OBSERVER_MARGIN, threshold: 0 }
  );

  requestAnimationFrame(() => {
    topics.forEach(t => observer.observe(t));
  });
}

// ===== BACK TO TOP =====

function initBackToTopButton() {
  const btn = document.getElementById("back-to-top");
  if (!btn) return;

  const btnClone = btn.cloneNode(true);
  btn.parentNode?.replaceChild(btnClone, btn);
  btnClone.id = "back-to-top";
  
  btnClone.style.display = "none";

  btnClone.addEventListener("click", () => 
    window.scrollTo({ top: 0, behavior: "smooth" })
  );

  window.addEventListener("scroll", () => {
    btnClone.style.display = window.scrollY > SCROLL_THRESHOLD ? "flex" : "none";
  });
}

export function resetNavigation() {
  navigationInitialized = false;
}