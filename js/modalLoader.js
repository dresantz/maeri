/**
 * Modal Loader - Carrega modais e seus scripts
 * Versão otimizada com carregamento paralelo e prevenção de duplicatas
 */

const MODAL_PATHS = [
  'pages/sheet-modal.html',
  'pages/spells-modal.html',
  'pages/dice-modal.html',
];

const MODAL_SCRIPTS = [
  'js/sheet.js',
  'js/spells.js',
  'js/dice.js',
  'js/spell-detail.js',
  'js/dice-pool.js'
];

// Cache de scripts carregados
const loadedScripts = new Set();

async function loadScript(src) {
  if (loadedScripts.has(src)) {
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      loadedScripts.add(src);
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.type = 'module';
    script.onload = () => {
      loadedScripts.add(src);
      resolve();
    };
    script.onerror = () => reject(new Error(`Falha ao carregar script: ${src}`));
    document.body.appendChild(script);
  });
}

export async function loadGlobalModals() {
  const root = document.getElementById('modal-root');
  if (!root) {
    return;
  }
  
  if (root.dataset.loaded === 'true') {
    return;
  }
  
  const isInPages = window.location.pathname.includes('/pages/');
  
  try {
    // Carrega HTML dos modais em paralelo
    const fetchPromises = MODAL_PATHS.map(async (path) => {
      const fullPath = isInPages ? `../${path}` : path;
      try {
        const response = await fetch(fullPath);
        if (!response.ok) {
          return '';
        }
        return await response.text();
      } catch (error) {
        return '';
      }
    });
    
    const htmlContents = await Promise.all(fetchPromises);
    const validHtml = htmlContents.filter(html => html.length > 0);
    
    if (validHtml.length === 0) {
      throw new Error('No modal content could be loaded');
    }
    
    root.innerHTML = validHtml.join('');
    root.dataset.loaded = 'true';
    
    // Carrega scripts dos modais em paralelo
    const scriptPromises = MODAL_SCRIPTS.map(async (scriptPath) => {
      const fullPath = isInPages ? `../${scriptPath}` : scriptPath;
      try {
        await loadScript(fullPath);
      } catch (error) {
      }
    });
    
    await Promise.all(scriptPromises);
    
    // Dispara evento apenas se todos os modais foram carregados
    document.dispatchEvent(new CustomEvent('modals:loaded', {
      detail: {
        modals: MODAL_PATHS.length,
        scripts: MODAL_SCRIPTS.length
      }
    }));
    
    
  } catch (error) {
    // Tenta recuperação parcial?
    root.dataset.loaded = 'error';
  }
}

// Carregamento automático apenas se não estiver sendo importado como módulo
if (import.meta.url === document.currentScript?.src) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadGlobalModals);
  } else {
    loadGlobalModals();
  }
}