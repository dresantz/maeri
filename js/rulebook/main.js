/**
 * main.js - Livro de Regras
 * Ponto de entrada principal para o módulo rulebook
 * 
 * Dependências:
 * - ./toc.js: Controle do índice
 * - ./loader.js: Carregamento de capítulos
 * - ./constants.js: Constantes do rulebook
 * - ./navigation.js: Navegação e estado global
 * - ../search/searchIndex.js: Índice de busca
 * - ../search/searchUI.js: Interface de busca
 */

import { initTOCToggle, renderChapterSelect } from "./toc.js";
import { loadRulebookChapter } from "./loader.js";
import { RULEBOOK_CHAPTERS } from "./constants.js";
import { 
  initChapterNavigation, 
  restoreLastTopic,
  getCurrentChapter  // 👈 NOVO: importar o getter
} from "./navigation.js";
import { buildIndex } from "../search/searchIndex.js";
import { initSearchUI } from "../search/searchUI.js";

// ===== CONSTANTES =====
const DATA_PATH = '../data/rulebook/';
const REQUIRED_ELEMENTS = [
  'toc-panel',
  'chapter-select',
  'rulebook-content'
];

// ===== UTILITÁRIOS =====

/**
 * Verifica se todos os elementos necessários existem no DOM
 */
function checkRequiredElements() {
  const missing = REQUIRED_ELEMENTS.filter(id => !document.getElementById(id));
  
  if (missing.length > 0) {
    console.warn(`Elementos não encontrados: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}

/**
 * Retorna o caminho completo para um arquivo de capítulo
 */
function getChapterPath(filename) {
  return `${DATA_PATH}${filename}`;
}

// ===== ÍNDICE DE BUSCA =====

/**
 * Carrega todos os capítulos em paralelo para construir o índice de busca
 */
async function preloadSearchIndex() {
  
  // Carrega todos os capítulos em paralelo
  const fetchPromises = RULEBOOK_CHAPTERS.map(async (chapter) => {
    try {
      const path = getChapterPath(chapter.file);
      const response = await fetch(path);
      
      if (!response.ok) {
        console.warn(`Falha ao carregar ${chapter.file}: ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      data.__file = chapter.file;
      data.__title = chapter.title;
      return data;
      
    } catch (error) {
      console.error(`Erro ao buscar ${chapter.file}:`, error.message);
      return null;
    }
  });

  // Aguarda todos os fetches terminarem
  const results = await Promise.all(fetchPromises);
  
  // Filtra resultados bem-sucedidos
  const chaptersData = results.filter(data => data !== null);
    
  // Constrói o índice apenas se houver dados
  if (chaptersData.length > 0) {
    buildIndex(chaptersData);
  } else {
    console.error('Nenhum capítulo carregado para o índice de busca');
  }
}

// ===== INICIALIZAÇÃO =====

/**
 * Inicializa todos os componentes do rulebook
 */
async function initRulebook() {
  // Verifica elementos necessários
  if (!checkRequiredElements()) {
    console.error('Rulebook: elementos essenciais não encontrados');
    return;
  }

  try {
    // Pré-carrega índice de busca
    await preloadSearchIndex();
    
    // Inicializa componentes da UI
    initTOCToggle();
    renderChapterSelect();
    initChapterNavigation();
    initSearchUI();
    
    // Carrega o capítulo atual ou o primeiro
    const currentChapter = getCurrentChapter();
    const chapterToLoad = currentChapter || RULEBOOK_CHAPTERS[0]?.file;
    
    if (!chapterToLoad) {
      throw new Error('Nenhum capítulo disponível para carregar');
    }
    
    await loadRulebookChapter(chapterToLoad);
    restoreLastTopic();
    
  } catch (error) {
    console.error('Erro ao inicializar rulebook:', error);
    
    // Mostra mensagem amigável para o usuário
    const content = document.getElementById('rulebook-content');
    if (content) {
      content.innerHTML = `
        <div class="error-message">
          <h2>Erro ao carregar livro de regras</h2>
          <p>Não foi possível carregar o conteúdo. Tente recarregar a página.</p>
          <button onclick="location.reload()" class="reload-button">Recarregar</button>
        </div>
      `;
    }
  }
}

// ===== INICIALIZAÇÃO AUTOMÁTICA =====

// Aguarda o carregamento dos modais antes de inicializar
document.addEventListener('modals:loaded', () => {
  initRulebook();
});

// Fallback para quando os modais já estiverem carregados
if (document.readyState === 'complete' || 
    (document.readyState === 'interactive' && document.getElementById('modal-root')?.dataset.loaded === 'true')) {
  initRulebook();
}

// Exporta para uso em outros módulos (opcional)
export { initRulebook };