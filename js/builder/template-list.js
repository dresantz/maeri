// js/builder/template-list.js
// =========================
// Maeri RPG - Template List
// Gerencia a lista de arquivos de templates disponíveis
// =========================

const TEMPLATE_FILES = [
  'char-model' // Adicione aqui os nomes dos arquivos de template (sem .json)
];

class TemplateList {
  constructor() {
    this.files = TEMPLATE_FILES;
    this.templatesCache = new Map(); // Cache dos templates já carregados
  }

  // Retorna todos os nomes de arquivo
  getAllFiles() {
    return this.files;
  }

  // Retorna o nome do arquivo pelo índice
  getFileByIndex(index) {
    return this.files[index];
  }

  // Retorna o nome do arquivo pelo ID (seguindo o padrão warrior-3, mage-3, etc)
  getFileById(id) {
    // Se o id já for o nome completo do arquivo (ex: warrior-3)
    if (this.files.includes(id)) {
      return id;
    }
    
    // Se o id for apenas o tipo (ex: warrior), procura o arquivo correspondente
    const matchingFile = this.files.find(file => file.startsWith(id + '-'));
    return matchingFile || null;
  }

  // Verifica se um arquivo existe na lista
  hasFile(fileName) {
    return this.files.includes(fileName);
  }

  // Retorna a quantidade de templates
  getCount() {
    return this.files.length;
  }

  // ===== MÉTODOS QUE TRABALHAM COM OS DADOS DO JSON =====
  
  /**
   * Cria um card a partir do template carregado
   * @param {Object} template - O template carregado do templateManager
   * @param {string} fileName - Nome do arquivo (ex: 'char-model')
   * @returns {HTMLElement|null} O card criado ou null se falhar
   */
  createCard(template, fileName) {
    // CORREÇÃO: Agora recebe o template diretamente, não templateData[fileName]
    if (!template) {
      console.error('Template não encontrado para:', fileName);
      return null;
    }

    console.log('Criando card para:', fileName, template); // Debug
    
    const card = document.createElement('div');
    card.className = 'char-card char-card--ready';
    card.dataset.templateFile = fileName;
    
    // Extrai o ID base (ex: de 'char-model' extrai 'char', de 'warrior-3' extrai 'warrior')
    const baseId = fileName.split('-')[0];
    card.dataset.char = baseId;
    
    // Determina a classe de background baseada no ID
    const bgClass = `${baseId}-bg`;
    
    card.innerHTML = `
      <div class="char-card-image ${bgClass}">
        <span class="char-class">${template.class || 'Classe'}</span>
      </div>
      <div class="char-card-info">
        <h4 class="char-name">${template.name || 'Sem nome'}</h4>
        <p class="char-desc">${template.description || ''}</p>
        <span class="char-level">Nível ${template.level || '?'}</span>
      </div>
    `;
    
    return card;
  }

  /**
   * Renderiza todos os cards no container
   * @param {HTMLElement} container - O elemento onde os cards serão inseridos
   * @param {Object} templateManager - Instância do templateManager
   */
  async renderCards(container, templateManager) {
    if (!container) {
      console.error('Container não encontrado para renderizar cards');
      return;
    }

    console.log('Renderizando cards...'); // Debug
    container.innerHTML = ''; // Limpa o container
    
    // Mostra loading
    const loadingEl = document.createElement('div');
    loadingEl.className = 'loading-state';
    loadingEl.innerHTML = '<span class="spinner"></span> <span>Carregando personagens...</span>';
    container.appendChild(loadingEl);
    
    // Carrega todos os templates e renderiza os cards
    const loadPromises = this.files.map(async (fileName) => {
      try {
        // Tenta pegar do cache primeiro
        if (this.templatesCache.has(fileName)) {
          console.log(`Template ${fileName} carregado do cache`);
          return this.templatesCache.get(fileName);
        }
        
        // Carrega o template - AGORA RECEBE O TEMPLATE DIRETO
        const template = await templateManager.loadTemplate(fileName);
        
        if (template) {
          console.log('Template carregado:', fileName, template); // Debug
          this.templatesCache.set(fileName, template);
          return template;
        }
        
        return null;
      } catch (error) {
        console.error(`Erro ao carregar template ${fileName}:`, error);
        return null;
      }
    });

    const templates = await Promise.all(loadPromises);
    console.log('Templates carregados:', templates); // Debug
    
    // Remove o loading
    container.innerHTML = '';
    
    // Renderiza os cards na ordem original
    let cardsRenderizados = 0;
    
    templates.forEach((template, index) => {
      if (template) {
        const fileName = this.files[index];
        // CORREÇÃO: Passa o template diretamente, não um objeto com a chave
        const card = this.createCard(template, fileName);
        if (card) {
          container.appendChild(card);
          cardsRenderizados++;
        }
      }
    });

    console.log(`${cardsRenderizados} cards renderizados`);

    // Se nenhum card foi renderizado, mostra mensagem de erro
    if (cardsRenderizados === 0) {
      container.innerHTML = '<p class="error-message">Nenhum personagem pronto disponível</p>';
    }
  }

  /**
   * Atualiza um card específico
   * @param {string} fileName - Nome do arquivo do template
   * @param {HTMLElement} container - Container onde o card está
   * @param {Object} templateManager - Instância do templateManager
   */
  async updateCard(fileName, container, templateManager) {
    if (!container) return;

    const oldCard = container.querySelector(`[data-template-file="${fileName}"]`);
    if (!oldCard) return;

    try {
      // Carrega o template atualizado
      const template = await templateManager.loadTemplate(fileName);
      
      if (template) {
        this.templatesCache.set(fileName, template);
        // CORREÇÃO: Passa o template diretamente
        const newCard = this.createCard(template, fileName);
        if (newCard) {
          oldCard.replaceWith(newCard);
        }
      }
    } catch (error) {
      console.error(`Erro ao atualizar card ${fileName}:`, error);
    }
  }

  // Limpa o cache
  clearCache() {
    this.templatesCache.clear();
    console.log('Cache de templates limpo');
  }

  // Retorna as estatísticas do cache
  getCacheStats() {
    return {
      totalFiles: this.files.length,
      cachedTemplates: this.templatesCache.size,
      cachedFiles: Array.from(this.templatesCache.keys())
    };
  }
}

// Exporta uma única instância
const templateList = new TemplateList();
export default templateList;