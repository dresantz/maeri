/**
 * Índice + motor de busca do Rulebook
 * Responsável por:
 * - Armazenar dados indexados
 * - Construir o índice a partir dos capítulos
 * - Executar buscas com ranking
 */

import { getCurrentChapter } from "../rulebook/navigation.js";

const index = [];

/* =====================================================
   Normalização
===================================================== */

function normalizeText(text = "") {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* =====================================================
   Construção do índice
===================================================== */

export function buildIndex(chaptersData) {
  index.length = 0;

  chaptersData.forEach((chapter) => {
    const chapterFile = chapter.__file;

    (chapter.sections || []).forEach((section) => {
      if (!section.id) return;

      index.push({
        chapterFile,
        chapterTitle: chapter.title || "",
        _chapterTitleNorm: normalizeText(chapter.title || ""),
        topicId: section.id,
        topicTitle: section.title || "",
        _topicTitleNorm: normalizeText(section.title || ""),
        text: extractText(section)
      });
    });
  });
}

/* =====================================================
   Helpers
===================================================== */

function extractText(section) {
  let text = section.title || "";

  (section.content || []).forEach((block) => {
    if (block.text) {
      text += " " + block.text;
    }

    if (Array.isArray(block.items)) {
      block.items.forEach((item) => {
        if (typeof item === "string") {
          text += " " + item;
        }
      });
    }
  });

  return normalizeText(text);
}

/* =====================================================
   Busca + Ranking
===================================================== */

export function search(query, { limit = 20 } = {}) {
  if (!query || query.length < 2) return [];

  const q = normalizeText(query);
  const terms = q.split(" ").filter(Boolean);
  const results = [];

  const currentChapter = getCurrentChapter();

  for (const entry of index) {
    let score = 0;

    const topicTitle = entry._topicTitleNorm;
    const chapterTitle = entry._chapterTitleNorm;
    const text = entry.text;
    const words = text.split(" ");
    const textLength = text.length || 1;

    let topicMatch = false;
    let chapterMatch = false;
    let phraseMatch = false;

    /* =========================
       Match exato de frase
    ========================= */
    if (topicTitle.includes(q)) {
      score += 10;
      topicMatch = true;
      phraseMatch = true;
    }

    if (text.includes(q)) {
      score += 5;
      phraseMatch = true;
    }

    /* =========================
       Match por termos
    ========================= */
    for (const term of terms) {
      if (topicTitle.includes(term)) {
        score += 5;
        topicMatch = true;
      }

      if (chapterTitle.includes(term)) {
        score += 2;
        chapterMatch = true;
      }

      if (text.includes(term)) {
        score += 1;
      }
    }

    /* =========================
       Ordem correta dos termos
    ========================= */
    if (terms.length > 1) {
      const orderedRegex = new RegExp(terms.join(".*"));
      if (orderedRegex.test(topicTitle)) score += 4;
      else if (orderedRegex.test(text)) score += 2;
    }

    /* =========================
       Proximidade semântica
    ========================= */
    const positions = terms.map((term) =>
      words.reduce((acc, w, i) => {
        if (w === term) acc.push(i);
        return acc;
      }, [])
    );

    if (positions.every((p) => p.length > 0)) {
      const all = positions.flat();
      const min = Math.min(...all);
      const max = Math.max(...all);
      const windowSize = max - min;

      if (windowSize <= 6) score += 6;
      else if (windowSize <= 12) score += 3;

      score -= windowSize * 0.15;
    }

    /* =========================
       Boost contextual
       (prioriza resultados do capítulo atual)
    ========================= */
    if (entry.chapterFile === currentChapter) {
      score += 3;
    }

    if (score <= 0) continue;

    const normalizedScore =
      score / Math.log(textLength + 10);

    results.push({
      ...entry,
      score: normalizedScore,
      _rawScore: score,
      _textLength: textLength,
      _topicMatch: topicMatch,
      _chapterMatch: chapterMatch,
      _phraseMatch: phraseMatch
    });
  }

  return results
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b._phraseMatch !== a._phraseMatch) return b._phraseMatch ? 1 : -1;
      if (b._topicMatch !== a._topicMatch) return b._topicMatch ? 1 : -1;
      if (b._chapterMatch !== a._chapterMatch) return b._chapterMatch ? 1 : -1;
      return a._textLength - b._textLength;
    })
    .slice(0, limit);
}