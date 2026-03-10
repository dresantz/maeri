// =========================
// Maeri RPG - Etapa 3: Narrativa
// Gerencia a escolha de Arquétipos, Motivações, Disposição e Contatos
// =========================

class NarrativaManager {
  constructor(previewElement) {
    this.previewElement = previewElement;
    this.arquetiposData = null;
    this.motivacoesData = null;
    this.disposicaoData = null;
    this.contatosData = null;
    this.selectedArquetipo = null;
    this.selectedMotivacao = null;
    this.selectedContato = null;
    
    // Caminhos dos dados padronizados
    this.DATA_PATHS = {
      PERSONAGEM: '../data/rulebook/02-personagem.json',
      SOCIAL: '../data/rulebook/05-circulo-social-comercio.json'
    };
  }

  render() {
    if (!this.previewElement) return;
    
    this.previewElement.innerHTML = `
      <div class="narrativa-container">
        <!-- Seção de Arquétipos -->
        <p class="narrativa-intro">Escolha o arquétipo do seu personagem:</p>
        
        <div class="arquetipos-buttons" id="arquetipos-buttons-container">
          <div class="loading-state">
            <span class="spinner"></span>
            <span>Carregando arquétipos...</span>
          </div>
        </div>
        
        <div class="arquetipo-details" id="arquetipo-details-container" style="display: none;">
          <h3 class="arquetipo-title"></h3>
          <div class="arquetipo-descricao"></div>
        </div>

        <!-- Seção de Motivações -->
        <div class="motivacoes-section">
          <p class="motivacoes-intro">Escolha a motivação do seu personagem:</p>
          
          <div class="motivacoes-buttons" id="motivacoes-buttons-container">
            <div class="loading-state">
              <span class="spinner"></span>
              <span>Carregando motivações...</span>
            </div>
          </div>
          
          <div class="motivacao-details" id="motivacao-details-container" style="display: none;">
            <h3 class="motivacao-title"></h3>
            <div class="motivacao-descricao"></div>
          </div>
        </div>

        <!-- Seção de Disposição -->
        <div class="disposicao-section">
          <p class="disposicao-intro">A Disposição é:</p>
          <div class="disposicao-text" id="disposicao-text-container">
            <div class="loading-state">
              <span class="spinner"></span>
              <span>Carregando...</span>
            </div>
          </div>
        </div>

        <!-- Seção de Contatos -->
        <div class="contatos-section">
          <p class="contatos-intro">Escolha os Contatos</p>
          <p class="contatos-descricao">O jogador pode escolher qualquer tipo de contato que quiser, não precisa estar na lista, porém, para adquirir itens em uma loja, é necessário ter o Contato específico.</p>
          
          <div class="contatos-buttons" id="contatos-buttons-container">
            <div class="loading-state">
              <span class="spinner"></span>
              <span>Carregando contatos...</span>
            </div>
          </div>
          
          <div class="contato-details" id="contato-details-container" style="display: none;">
            <h3 class="contato-title"></h3>
            <div class="contato-descricao"></div>
            <div class="contato-itens">
              <h4>Itens Disponíveis</h4>
              <div class="itens-list"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Configura delegação de eventos
    this.setupEventDelegation();
    
    // Carrega os dados
    this.loadArquetiposData();
    this.loadMotivacoesData();
    this.loadDisposicaoData();
    this.loadContatosData();
  }

  // ===== UTILITÁRIOS =====
  showSectionLoading(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="loading-state">
          <span class="spinner"></span>
          <span>${message}</span>
        </div>
      `;
    }
  }

  showSectionError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `<button class="error-button" disabled>${message}</button>`;
    }
  }

  closeWithAnimation(container, callback) {
    if (!container) return;
    
    container.classList.add('closing');
    
    setTimeout(() => {
      container.style.display = 'none';
      container.classList.remove('closing');
      if (callback) callback();
    }, 300);
  }

  validateSelections() {
    const selections = {
      arquetipo: this.selectedArquetipo,
      motivacao: this.selectedMotivacao,
      contato: this.selectedContato
    };
    
    const event = new CustomEvent('narrativa:updated', {
      detail: selections,
      bubbles: true
    });
    
    this.previewElement?.dispatchEvent(event);
    
    return selections;
  }

  setupEventDelegation() {
    if (!this.previewElement) return;
    
    this.previewElement.addEventListener('click', (event) => {
      const button = event.target.closest('.arquetipo-button, .motivacao-button, .contato-button');
      if (!button) return;
      
      if (button.classList.contains('arquetipo-button')) {
        this.selectArquetipo(button.dataset.arquetipoIndex);
      } else if (button.classList.contains('motivacao-button')) {
        this.selectMotivacao(button.dataset.motivacaoIndex);
      } else if (button.classList.contains('contato-button')) {
        this.selectContato(button.dataset.contatoIndex);
      }
    });
  }

  // ===== ARQUÉTIPOS =====
  async loadArquetiposData() {
    try {
      const response = await fetch(this.DATA_PATHS.PERSONAGEM);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.sections || !Array.isArray(data.sections)) {
        throw new Error('Formato de dados inválido: sections não encontrada');
      }
      
      const arquetipoSection = data.sections.find(s => s.topic_id === 'arquetipo');
      
      if (!arquetipoSection) {
        throw new Error('Seção de arquétipos não encontrada');
      }
      
      const listaArquetipos = arquetipoSection.content.find(c => c.type === 'list');
      
      if (!listaArquetipos || !listaArquetipos.items) {
        throw new Error('Lista de arquétipos não encontrada');
      }
      
      this.processarArquetipos(listaArquetipos.items);
      
      if (!this.arquetiposData || this.arquetiposData.length === 0) {
        throw new Error('Nenhum arquétipo encontrado');
      }
      
      this.renderArquetiposButtons();
    } catch (error) {
      console.error('Erro ao carregar dados dos arquétipos:', error);
      this.showSectionError('arquetipos-buttons-container', 'Erro ao carregar arquétipos');
    }
  }

  processarArquetipos(items) {
    this.arquetiposData = items.map(item => {
      const firstColonIndex = item.indexOf('.');
      const titulo = item.substring(0, firstColonIndex).trim();
      const descricao = item.substring(firstColonIndex + 1).trim();
      
      return {
        titulo: titulo,
        descricao: descricao
      };
    });
  }

  renderArquetiposButtons() {
    const container = document.getElementById('arquetipos-buttons-container');
    if (!container || !this.arquetiposData) return;
    
    let buttonsHtml = '';
    this.arquetiposData.forEach((arquetipo, index) => {
      buttonsHtml += `
        <button class="arquetipo-button" data-arquetipo-index="${index}">
          ${arquetipo.titulo}
        </button>
      `;
    });
    
    container.innerHTML = buttonsHtml;
  }

  selectArquetipo(index) {
    const detailsContainer = document.getElementById('arquetipo-details-container');
    const selectedButton = document.querySelector(`[data-arquetipo-index="${index}"]`);
    
    const isSameArquetipo = this.selectedArquetipo && this.selectedArquetipo.index === index;
    
    if (isSameArquetipo) {
      this.closeWithAnimation(detailsContainer, () => {
        this.selectedArquetipo = null;
        this.validateSelections();
      });
      
      document.querySelectorAll('.arquetipo-button').forEach(btn => {
        btn.classList.remove('selected');
      });
      
      return;
    }
    
    document.querySelectorAll('.arquetipo-button').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    if (selectedButton) {
      selectedButton.classList.add('selected');
    }
    
    this.selectedArquetipo = {
      index: index,
      data: this.arquetiposData[index]
    };
    
    this.renderArquetipoDetails();
    this.validateSelections();
  }

  renderArquetipoDetails() {
    if (!this.selectedArquetipo) return;
    
    const detailsContainer = document.getElementById('arquetipo-details-container');
    const titleElement = detailsContainer.querySelector('.arquetipo-title');
    const descricaoElement = detailsContainer.querySelector('.arquetipo-descricao');
    
    const arquetipo = this.selectedArquetipo.data;
    
    titleElement.textContent = arquetipo.titulo;
    descricaoElement.innerHTML = `<p>${arquetipo.descricao}</p>`;
    
    detailsContainer.style.display = 'block';
  }

  // ===== MOTIVAÇÕES =====
  async loadMotivacoesData() {
    try {
      const response = await fetch(this.DATA_PATHS.PERSONAGEM);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.sections || !Array.isArray(data.sections)) {
        throw new Error('Formato de dados inválido: sections não encontrada');
      }
      
      const motivacaoSection = data.sections.find(s => s.topic_id === 'motivacao');
      
      if (!motivacaoSection) {
        throw new Error('Seção de motivações não encontrada');
      }
      
      const listaMotivacoes = motivacaoSection.content.find(c => c.type === 'list');
      
      if (!listaMotivacoes || !listaMotivacoes.items) {
        throw new Error('Lista de motivações não encontrada');
      }
      
      this.processarMotivacoes(listaMotivacoes.items);
      
      if (!this.motivacoesData || this.motivacoesData.length === 0) {
        throw new Error('Nenhuma motivação encontrada');
      }
      
      this.renderMotivacoesButtons();
    } catch (error) {
      console.error('Erro ao carregar dados das motivações:', error);
      this.showSectionError('motivacoes-buttons-container', 'Erro ao carregar motivações');
    }
  }

processarMotivacoes(items) {
  this.motivacoesData = items.map(item => {
    const match = item.match(/^__(.+?)__\.\s*(.+)$/);
    
    if (match) {
      return {
        titulo: match[1],
        descricao: match[2].trim()
      };
    } else {
      const firstColonIndex = item.indexOf(':');
      if (firstColonIndex > -1) {
        return {
          titulo: item.substring(0, firstColonIndex).trim(),
          descricao: item.substring(firstColonIndex + 1).trim()
        };
      }
      
      return {
        titulo: item.trim(),
        descricao: ''
      };
    }
  });
}

  renderMotivacoesButtons() {
    const container = document.getElementById('motivacoes-buttons-container');
    if (!container || !this.motivacoesData) return;
    
    let buttonsHtml = '';
    this.motivacoesData.forEach((motivacao, index) => {
      buttonsHtml += `
        <button class="motivacao-button" data-motivacao-index="${index}">
          ${motivacao.titulo}
        </button>
      `;
    });
    
    container.innerHTML = buttonsHtml;
  }

  selectMotivacao(index) {
    const detailsContainer = document.getElementById('motivacao-details-container');
    const selectedButton = document.querySelector(`[data-motivacao-index="${index}"]`);
    
    const isSameMotivacao = this.selectedMotivacao && this.selectedMotivacao.index === index;
    
    if (isSameMotivacao) {
      this.closeWithAnimation(detailsContainer, () => {
        this.selectedMotivacao = null;
        this.validateSelections();
      });
      
      document.querySelectorAll('.motivacao-button').forEach(btn => {
        btn.classList.remove('selected');
      });
      
      return;
    }
    
    document.querySelectorAll('.motivacao-button').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    if (selectedButton) {
      selectedButton.classList.add('selected');
    }
    
    this.selectedMotivacao = {
      index: index,
      data: this.motivacoesData[index]
    };
    
    this.renderMotivacaoDetails();
    this.validateSelections();
  }

  renderMotivacaoDetails() {
    if (!this.selectedMotivacao) return;
    
    const detailsContainer = document.getElementById('motivacao-details-container');
    const titleElement = detailsContainer.querySelector('.motivacao-title');
    const descricaoElement = detailsContainer.querySelector('.motivacao-descricao');
    
    const motivacao = this.selectedMotivacao.data;
    
    titleElement.textContent = motivacao.titulo;
    descricaoElement.innerHTML = `<p>${motivacao.descricao}</p>`;
    
    detailsContainer.style.display = 'block';
  }

  // ===== DISPOSIÇÃO =====
  async loadDisposicaoData() {
    try {
      const response = await fetch(this.DATA_PATHS.PERSONAGEM);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.sections || !Array.isArray(data.sections)) {
        throw new Error('Formato de dados inválido: sections não encontrada');
      }
      
      const disposicaoSection = data.sections.find(s => s.topic_id === 'disposicao');
      
      if (!disposicaoSection) {
        throw new Error('Seção de disposição não encontrada');
      }
      
      const disposicaoText = disposicaoSection.content.find(c => c.type === 'paragraph');
      
      if (!disposicaoText || !disposicaoText.text) {
        throw new Error('Texto da disposição não encontrado');
      }
      
      this.renderDisposicaoText(disposicaoText.text);
    } catch (error) {
      console.error('Erro ao carregar dados da disposição:', error);
      this.showSectionError('disposicao-text-container', 'Erro ao carregar disposição');
    }
  }

  renderDisposicaoText(text) {
    const container = document.getElementById('disposicao-text-container');
    if (!container) return;
    
    container.innerHTML = `<p class="disposicao-text">${text}</p>`;
  }

  // ===== CONTATOS =====
  encontrarContato(item, tiposContato) {
    for (const tipo of tiposContato) {
      if (item[tipo.campo]) {
        return { 
          tipo, 
          nome: item[tipo.campo].replace('.', '').trim() 
        };
      }
    }
    return null;
  }

  ehListaItens(item, currentContato) {
    return item.type === 'list' && 
           currentContato && 
           item.id === currentContato.tipo.idLista;
  }

  criarContato(contatoInfo, item) {
    return {
      nome: contatoInfo.nome,
      descricao: item.text,
      tipo: contatoInfo.tipo
    };
  }

  finalizarContato(currentContato, currentItems, section) {
    if (currentContato && currentItems.length > 0) {
      this.contatosData.push({
        id: `${section?.id || 'contato'}-${currentContato.nome.toLowerCase().replace(/\s+/g, '-')}`,
        nome: currentContato.nome,
        descricao: currentContato.descricao,
        itens: [...currentItems]
      });
    }
  }

  processarSectionContatos(section, tiposContato) {
    let currentContato = null;
    let currentItems = [];
    
    section.content.forEach(item => {
      const contatoInfo = this.encontrarContato(item, tiposContato);
      
      if (contatoInfo) {
        this.finalizarContato(currentContato, currentItems, section);
        currentContato = this.criarContato(contatoInfo, item);
        currentItems = [];
      } else if (this.ehListaItens(item, currentContato)) {
        currentItems = [...currentItems, ...item.items];
      }
    });
    
    this.finalizarContato(currentContato, currentItems, section);
  }

  async loadContatosData() {
    try {
      const response = await fetch(this.DATA_PATHS.SOCIAL);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.sections || !Array.isArray(data.sections)) {
        throw new Error('Formato de dados inválido: sections não encontrada');
      }
      
      this.contatosData = [];
      
      // Mapeamento de tipos de contato e seus respectivos campos
      const tiposContato = [
        { campo: 'lojacomb_item', idLista: 'lojacomb_item' },
        { campo: 'lojarc_item', idLista: 'lojarc_item' },
        { campo: 'montarias_item', idLista: 'montarias_item' }
      ];
      
      data.sections
        .filter(section => !section.topic_id.includes('introducao'))
        .forEach(section => this.processarSectionContatos(section, tiposContato));
      
      if (this.contatosData.length === 0) {
        throw new Error('Nenhum contato encontrado');
      }
      
      this.renderContatosButtons();
    } catch (error) {
      console.error('Erro ao carregar dados dos contatos:', error);
      this.showSectionError('contatos-buttons-container', 'Erro ao carregar contatos');
    }
  }

  renderContatosButtons() {
    const container = document.getElementById('contatos-buttons-container');
    if (!container || !this.contatosData || this.contatosData.length === 0) return;
    
    let buttonsHtml = '';
    this.contatosData.forEach((contato, index) => {
      buttonsHtml += `
        <button class="contato-button" data-contato-index="${index}">
          ${contato.nome}
        </button>
      `;
    });
    
    container.innerHTML = buttonsHtml;
  }

  selectContato(index) {
    const detailsContainer = document.getElementById('contato-details-container');
    const selectedButton = document.querySelector(`[data-contato-index="${index}"]`);
    
    const isSameContato = this.selectedContato && this.selectedContato.index === index;
    
    if (isSameContato) {
      this.closeWithAnimation(detailsContainer, () => {
        this.selectedContato = null;
        this.validateSelections();
      });
      
      document.querySelectorAll('.contato-button').forEach(btn => {
        btn.classList.remove('selected');
      });
      
      return;
    }
    
    document.querySelectorAll('.contato-button').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    if (selectedButton) {
      selectedButton.classList.add('selected');
    }
    
    this.selectedContato = {
      index: index,
      data: this.contatosData[index]
    };
    
    this.renderContatoDetails();
    this.validateSelections();
  }

  renderContatoDetails() {
    if (!this.selectedContato) return;
    
    const detailsContainer = document.getElementById('contato-details-container');
    const titleElement = detailsContainer.querySelector('.contato-title');
    const descricaoElement = detailsContainer.querySelector('.contato-descricao');
    const itensList = detailsContainer.querySelector('.itens-list');
    
    const contato = this.selectedContato.data;
    
    titleElement.textContent = contato.nome;
    descricaoElement.innerHTML = `<p>${contato.descricao}</p>`;
    
    let itensHtml = '';
    contato.itens.forEach(item => {
      itensHtml += `
        <div class="item-lista">
          ${item}
        </div>
      `;
    });
    
    itensList.innerHTML = itensHtml;
    detailsContainer.style.display = 'block';
  }
}

export default NarrativaManager;