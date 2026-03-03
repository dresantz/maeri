/**
 * constants.js - Constantes globais do Rulebook
 * 
 * Contém:
 * - Chaves para localStorage
 * - Lista oficial de capítulos
 */

// ===== STORAGE KEYS =====
export const LAST_CHAPTER_KEY = 'maeriLastChapter';
export const LAST_TOPIC_KEY = 'maeriLastTopic';

// ===== CHAPTERS LIST =====
export const RULEBOOK_CHAPTERS = [
  { id: '01', file: '01-fundamentos.json', title: 'Fundamentos' },
  { id: '02', file: '02-personagem.json', title: 'Personagem' },
  { id: '03', file: '03-combate.json', title: 'Combate' },
  { id: '04', file: '04-magia.json', title: 'Magia' },
  { id: '05', file: '05-circulo-social-comercio.json', title: 'Círculo Social e Comércio' },
  { id: '06', file: '06-seres.json', title: 'Seres' },
  { id: '07', file: '07-classes.json', title: 'Classes' },
  { id: '08', file: '08-maeri.json', title: 'Maeri' },
  { id: '09', file: '09-campanha.json', title: 'Campanha' }
];

// ===== UTILITÁRIOS OPCIONAIS =====
/**
 * Retorna o índice de um capítulo pelo nome do arquivo
 */
export function getChapterIndex(fileName) {
  return RULEBOOK_CHAPTERS.findIndex(ch => ch.file === fileName);
}

/**
 * Verifica se um capítulo existe
 */
export function chapterExists(fileName) {
  return RULEBOOK_CHAPTERS.some(ch => ch.file === fileName);
}

/**
 * Retorna o primeiro capítulo da lista
 */
export function getFirstChapter() {
  return RULEBOOK_CHAPTERS[0]?.file;
}