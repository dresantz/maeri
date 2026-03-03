/**
 * searchRouter.js - Roteador de resultados de busca
 */

import { search } from "./searchIndex.js";
import { loadRulebookChapter } from "../rulebook/loader.js";

let resultsContainer = null;

function escapeHTML(str = "") {
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[m]);
}

export function initSearchRouter(container) {
  if (!container) return;
  resultsContainer = container;
}

export function destroySearchRouter() {
  resultsContainer = null;
}

export function handleSearch(query) {
  if (!resultsContainer) return;

  const results = search(query, { limit: 20 });

  if (!results.length) {
    resultsContainer.innerHTML = `
      <div class="search-result empty">
        Nenhum resultado encontrado
      </div>
    `;
    resultsContainer.classList.remove("hidden");
    resultsContainer.setAttribute("aria-hidden", "false");
    return;
  }

  resultsContainer.innerHTML = results
    .map((r) => `
      <div
        class="search-result"
        data-chapter="${r.chapterFile}"
        data-topic="${r.topicId}"
        role="button"
        tabindex="0"
      >
        <strong>${escapeHTML(r.topicTitle)}</strong>
        <span>${escapeHTML(r.chapterTitle)}</span>
      </div>
    `)
    .join("");

  resultsContainer.classList.remove("hidden");
  resultsContainer.setAttribute("aria-hidden", "false");
}

export function bindSearchResultClicks() {
  if (!resultsContainer) return;

  resultsContainer.addEventListener("click", activateResult);
  resultsContainer.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();

    const focused = document.activeElement;
    if (focused?.classList.contains("search-result")) {
      activateResult({
        target: focused,
        preventDefault() {},
        stopPropagation() {}
      });
    }
  });
}

function activateResult(e) {
  e.preventDefault();
  e.stopPropagation();

  const item = e.target.closest(".search-result");
  if (!item) return;

  const { chapter, topic } = item.dataset;

  const safeFocusTarget =
    document.getElementById("rulebook-content") ||
    document.getElementById("toc-toggle");

  if (safeFocusTarget) {
    safeFocusTarget.setAttribute("tabindex", "-1");
    safeFocusTarget.focus({ preventScroll: true });
    safeFocusTarget.removeAttribute("tabindex");
  }

  resultsContainer.classList.add("hidden");
  resultsContainer.setAttribute("aria-hidden", "true");

  loadRulebookChapter(chapter, topic);
}