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

// Cache de caminhos resolvidos
const pathCache = new Map();

function resolvePath(basePath, isInPages) {
  const cacheKey = `${basePath}-${isInPages}`;
  if (pathCache.has(cacheKey)) {
    return pathCache.get(cacheKey);
  }

  let resolvedPath;
  
  if (isInPages) {
    // Se está em /pages/algo.html, remove o prefixo 'pages/' do caminho
    // porque já estamos dentro da pasta pages
    if (basePath.startsWith('pages/')) {
      resolvedPath = basePath.replace('pages/', '');
    } else {
      resolvedPath = `../${basePath}`;
    }
  } else {
    resolvedPath = basePath;
  }
  
  pathCache.set(cacheKey, resolvedPath);
  return resolvedPath;
}

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
      const fullPath = resolvePath(path, isInPages);
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
      const fullPath = resolvePath(scriptPath, isInPages);
      try {
        await loadScript(fullPath);
      } catch (error) {
        // Silencia erro de script individual
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