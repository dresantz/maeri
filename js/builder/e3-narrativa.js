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

    // Referências para os containers (preenchidos no buildStructure)
    this.containers = {
      arquetiposButtons: null,
      arquetipoDetails: null,
      motivacoesButtons: null,
      motivacaoDetails: null,
      disposicaoText: null,
      contatosButtons: null,
      contatoDetails: null,
    };

    // Caminhos dos dados padronizados
    this.DATA_PATHS = {
      PERSONAGEM: '../data/rulebook/02-personagem.json',
      SOCIAL: '../data/rulebook/05-circulo-social-comercio.json'
    };

    // Configura a delegação de eventos (uma única vez, pois o previewElement não é recriado)
    this.setupEventDelegation();
  }

  // ===== MÉTODO PRINCIPAL =====
  render() {
    if (!this.previewElement) return;

    // Limpa o previewElement antes de construir o novo conteúdo
    this.previewElement.innerHTML = '';

    // Constrói a estrutura do zero
    this.buildStructure();

    // Carrega os dados e preenche os botões
    this.loadArquetiposData();
    this.loadMotivacoesData();
    this.loadDisposicaoData();
    this.loadContatosData();

    // Restaura seleções (se houver) após carregar os dados
    this.restoreSelections();
  }

  // ===== CONSTRUÇÃO DA ESTRUTURA DOM =====
  buildStructure() {
    const fragment = document.createDocumentFragment();
    const container = document.createElement('div');
    container.className = 'narrativa-container';

    // --- Arquétipos ---
    const introArq = document.createElement('p');
    introArq.className = 'narrativa-intro';
    introArq.textContent = 'Escolha o arquétipo do seu personagem:';
    container.appendChild(introArq);

    const arquetiposButtonsContainer = document.createElement('div');
    arquetiposButtonsContainer.id = 'arquetipos-buttons-container';
    arquetiposButtonsContainer.className = 'arquetipos-buttons';
    arquetiposButtonsContainer.innerHTML = `
      <div class="loading-state">
        <span class="spinner"></span>
        <span>Carregando arquétipos...</span>
      </div>
    `;
    container.appendChild(arquetiposButtonsContainer);
    this.containers.arquetiposButtons = arquetiposButtonsContainer;

    const arquetipoDetailsContainer = document.createElement('div');
    arquetipoDetailsContainer.id = 'arquetipo-details-container';
    arquetipoDetailsContainer.className = 'arquetipo-details';
    arquetipoDetailsContainer.style.display = 'none';
    arquetipoDetailsContainer.innerHTML = `
      <h3 class="arquetipo-title"></h3>
      <div class="arquetipo-descricao"></div>
    `;
    container.appendChild(arquetipoDetailsContainer);
    this.containers.arquetipoDetails = arquetipoDetailsContainer;

    // --- Motivações ---
    const motivacoesSection = document.createElement('div');
    motivacoesSection.className = 'motivacoes-section';
    container.appendChild(motivacoesSection);

    const introMot = document.createElement('p');
    introMot.className = 'motivacoes-intro';
    introMot.textContent = 'Escolha a motivação do seu personagem:';
    motivacoesSection.appendChild(introMot);

    const motivacoesButtonsContainer = document.createElement('div');
    motivacoesButtonsContainer.id = 'motivacoes-buttons-container';
    motivacoesButtonsContainer.className = 'motivacoes-buttons';
    motivacoesButtonsContainer.innerHTML = `
      <div class="loading-state">
        <span class="spinner"></span>
        <span>Carregando motivações...</span>
      </div>
    `;
    motivacoesSection.appendChild(motivacoesButtonsContainer);
    this.containers.motivacoesButtons = motivacoesButtonsContainer;

    const motivacaoDetailsContainer = document.createElement('div');
    motivacaoDetailsContainer.id = 'motivacao-details-container';
    motivacaoDetailsContainer.className = 'motivacao-details';
    motivacaoDetailsContainer.style.display = 'none';
    motivacaoDetailsContainer.innerHTML = `
      <h3 class="motivacao-title"></h3>
      <div class="motivacao-descricao"></div>
    `;
    motivacoesSection.appendChild(motivacaoDetailsContainer);
    this.containers.motivacaoDetails = motivacaoDetailsContainer;

    // --- Disposição ---
    const disposicaoSection = document.createElement('div');
    disposicaoSection.className = 'disposicao-section';
    container.appendChild(disposicaoSection);

    const introDisp = document.createElement('p');
    introDisp.className = 'disposicao-intro';
    introDisp.textContent = 'A Disposição é:';
    disposicaoSection.appendChild(introDisp);

    const disposicaoTextContainer = document.createElement('div');
    disposicaoTextContainer.id = 'disposicao-text-container';
    disposicaoTextContainer.className = 'disposicao-text';
    disposicaoTextContainer.innerHTML = `
      <div class="loading-state">
        <span class="spinner"></span>
        <span>Carregando...</span>
      </div>
    `;
    disposicaoSection.appendChild(disposicaoTextContainer);
    this.containers.disposicaoText = disposicaoTextContainer;

    // --- Contatos ---
    const contatosSection = document.createElement('div');
    contatosSection.className = 'contatos-section';
    container.appendChild(contatosSection);

    const introCont = document.createElement('p');
    introCont.className = 'contatos-intro';
    introCont.textContent = 'Escolha os Contatos';
    contatosSection.appendChild(introCont);

    const descCont = document.createElement('p');
    descCont.className = 'contatos-descricao';
    descCont.textContent = 'O jogador pode escolher sua I em contatos, ou deixar para depois, não precisa estar na lista, porém, para adquirir itens em uma loja, é necessário ter o Contato específico.';
    contatosSection.appendChild(descCont);

    const contatosButtonsContainer = document.createElement('div');
    contatosButtonsContainer.id = 'contatos-buttons-container';
    contatosButtonsContainer.className = 'contatos-buttons';
    contatosButtonsContainer.innerHTML = `
      <div class="loading-state">
        <span class="spinner"></span>
        <span>Carregando contatos...</span>
      </div>
    `;
    contatosSection.appendChild(contatosButtonsContainer);
    this.containers.contatosButtons = contatosButtonsContainer;

    const contatoDetailsContainer = document.createElement('div');
    contatoDetailsContainer.id = 'contato-details-container';
    contatoDetailsContainer.className = 'contato-details';
    contatoDetailsContainer.style.display = 'none';
    contatoDetailsContainer.innerHTML = `
      <h3 class="contato-title"></h3>
      <div class="contato-descricao"></div>
      <div class="contato-itens">
        <h4>Itens Disponíveis</h4>
        <div class="itens-list"></div>
      </div>
    `;
    contatosSection.appendChild(contatoDetailsContainer);
    this.containers.contatoDetails = contatoDetailsContainer;

    // Adiciona o container completo ao preview
    this.previewElement.appendChild(container);
  }

  // ===== DELEGAÇÃO DE EVENTOS =====
  setupEventDelegation() {
    this.previewElement.addEventListener('click', (event) => {
      // VERIFICAÇÃO ADICIONADA: só processa cliques dentro do container do NarrativaManager
      const container = event.target.closest('.narrativa-container');
      if (!container) return;

      const button = event.target.closest('.arquetipo-button, .motivacao-button, .contato-button');
      if (!button) return;

      if (button.classList.contains('arquetipo-button')) {
        this.selectArquetipo(parseInt(button.dataset.arquetipoIndex, 10));
      } else if (button.classList.contains('motivacao-button')) {
        this.selectMotivacao(parseInt(button.dataset.motivacaoIndex, 10));
      } else if (button.classList.contains('contato-button')) {
        this.selectContato(parseInt(button.dataset.contatoIndex, 10));
      }
    });
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
    if (container.style.display === 'none') {
      if (callback) callback();
      return;
    }
    container.classList.add('closing');
    setTimeout(() => {
      container.style.display = 'none';
      container.classList.remove('closing');
      if (callback) callback();
    }, 300);
  }

  // Fecha todos os detalhes, exceto o container especificado
  closeAllDetails(excludeContainer = null) {
    const allDetails = [
      this.containers.arquetipoDetails,
      this.containers.motivacaoDetails,
      this.containers.contatoDetails
    ];

    allDetails.forEach(container => {
      if (container && container !== excludeContainer) {
        container.style.display = 'none';
        container.classList.remove('closing');
      }
    });
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

  // ===== RESTAURAÇÃO DE SELEÇÕES =====
  restoreSelections() {
    if (this.selectedArquetipo && this.arquetiposData) {
      this.selectArquetipo(this.selectedArquetipo.index, true);
    }
    if (this.selectedMotivacao && this.motivacoesData) {
      this.selectMotivacao(this.selectedMotivacao.index, true);
    }
    if (this.selectedContato && this.contatosData) {
      this.selectContato(this.selectedContato.index, true);
    }
  }

  // Limpa a seleção de todas as categorias, exceto a informada
  clearOtherSelections(exceptCategory) {
    const map = {
      arquetipo: {
        key: 'selectedArquetipo',
        buttons: this.containers.arquetiposButtons,
        selector: '.arquetipo-button'
      },
      motivacao: {
        key: 'selectedMotivacao',
        buttons: this.containers.motivacoesButtons,
        selector: '.motivacao-button'
      },
      contato: {
        key: 'selectedContato',
        buttons: this.containers.contatosButtons,
        selector: '.contato-button'
      }
    };

    Object.entries(map).forEach(([category, cfg]) => {
      if (category === exceptCategory) return;

      this[cfg.key] = null;

      if (cfg.buttons) {
        cfg.buttons.querySelectorAll(cfg.selector).forEach(btn => {
          btn.classList.remove('selected');
        });
      }
    });
  }

  // ==========================================================
  // ARQUÉTIPOS
  // ==========================================================
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
      this.restoreSelections();
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
      return { titulo, descricao };
    });
  }

  renderArquetiposButtons() {
    const container = this.containers.arquetiposButtons;
    if (!container || !this.arquetiposData) return;

    const fragment = document.createDocumentFragment();
    this.arquetiposData.forEach((arquetipo, index) => {
      const btn = document.createElement('button');
      btn.className = 'arquetipo-button';
      btn.dataset.arquetipoIndex = index;
      btn.textContent = arquetipo.titulo;
      fragment.appendChild(btn);
    });

    container.replaceChildren(fragment);
  }

  selectArquetipo(index, skipToggle = false) {
    const detailsContainer = this.containers.arquetipoDetails;
    const selectedButton = this.containers.arquetiposButtons.querySelector(`[data-arquetipo-index="${index}"]`);

    const isSameSelection = this.selectedArquetipo && this.selectedArquetipo.index === index;

    // Clique do usuário em botão já selecionado → toggle (fecha / desmarca)
    if (isSameSelection && !skipToggle) {
      this.selectedArquetipo = null;
      this.containers.arquetiposButtons
        .querySelectorAll('.arquetipo-button')
        .forEach(btn => btn.classList.remove('selected'));
      this.closeAllDetails();
      this.validateSelections();
      return;
    }

    this.clearOtherSelections('arquetipo');

    this.containers.arquetiposButtons
      .querySelectorAll('.arquetipo-button')
      .forEach(btn => btn.classList.remove('selected'));
    if (selectedButton) selectedButton.classList.add('selected');

    this.closeAllDetails(detailsContainer);

    this.selectedArquetipo = { index, data: this.arquetiposData[index] };
    this.renderArquetipoDetails();
    this.validateSelections();
  }

  renderArquetipoDetails() {
    if (!this.selectedArquetipo) return;

    const detailsContainer = this.containers.arquetipoDetails;
    const titleElement = detailsContainer.querySelector('.arquetipo-title');
    const descricaoElement = detailsContainer.querySelector('.arquetipo-descricao');

    const arquetipo = this.selectedArquetipo.data;
    titleElement.textContent = arquetipo.titulo;
    descricaoElement.innerHTML = `<p>${arquetipo.descricao}</p>`;
    detailsContainer.style.display = 'block';
  }

  // ==========================================================
  // MOTIVAÇÕES
  // ==========================================================
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
      this.restoreSelections();
    } catch (error) {
      console.error('Erro ao carregar dados das motivações:', error);
      this.showSectionError('motivacoes-buttons-container', 'Erro ao carregar motivações');
    }
  }

  processarMotivacoes(items) {
    this.motivacoesData = items.map(item => {
      const match = item.match(/^__(.+?)__\.\s*(.+)$/);
      if (match) {
        return { titulo: match[1], descricao: match[2].trim() };
      } else {
        const firstColonIndex = item.indexOf(':');
        if (firstColonIndex > -1) {
          return {
            titulo: item.substring(0, firstColonIndex).trim(),
            descricao: item.substring(firstColonIndex + 1).trim()
          };
        }
        return { titulo: item.trim(), descricao: '' };
      }
    });
  }

  renderMotivacoesButtons() {
    const container = this.containers.motivacoesButtons;
    if (!container || !this.motivacoesData) return;

    const fragment = document.createDocumentFragment();
    this.motivacoesData.forEach((motivacao, index) => {
      const btn = document.createElement('button');
      btn.className = 'motivacao-button';
      btn.dataset.motivacaoIndex = index;
      btn.textContent = motivacao.titulo;
      fragment.appendChild(btn);
    });

    container.replaceChildren(fragment);
  }

  selectMotivacao(index, skipToggle = false) {
    const detailsContainer = this.containers.motivacaoDetails;
    const selectedButton = this.containers.motivacoesButtons.querySelector(`[data-motivacao-index="${index}"]`);

    const isSameSelection = this.selectedMotivacao && this.selectedMotivacao.index === index;

    if (isSameSelection && !skipToggle) {
      this.selectedMotivacao = null;
      this.containers.motivacoesButtons
        .querySelectorAll('.motivacao-button')
        .forEach(btn => btn.classList.remove('selected'));
      this.closeAllDetails();
      this.validateSelections();
      return;
    }

    this.clearOtherSelections('motivacao');

    this.containers.motivacoesButtons
      .querySelectorAll('.motivacao-button')
      .forEach(btn => btn.classList.remove('selected'));
    if (selectedButton) selectedButton.classList.add('selected');

    this.closeAllDetails(detailsContainer);

    this.selectedMotivacao = { index, data: this.motivacoesData[index] };
    this.renderMotivacaoDetails();
    this.validateSelections();
  }

  renderMotivacaoDetails() {
    if (!this.selectedMotivacao) return;

    const detailsContainer = this.containers.motivacaoDetails;
    const titleElement = detailsContainer.querySelector('.motivacao-title');
    const descricaoElement = detailsContainer.querySelector('.motivacao-descricao');

    const motivacao = this.selectedMotivacao.data;
    titleElement.textContent = motivacao.titulo;
    descricaoElement.innerHTML = `<p>${motivacao.descricao}</p>`;
    detailsContainer.style.display = 'block';
  }

  // ==========================================================
  // DISPOSIÇÃO
  // ==========================================================
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
    const container = this.containers.disposicaoText;
    if (!container) return;
    container.innerHTML = `<p class="disposicao-text">${text}</p>`;
  }

  // ==========================================================
  // CONTATOS
  // ==========================================================
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
      this.restoreSelections();
    } catch (error) {
      console.error('Erro ao carregar dados dos contatos:', error);
      this.showSectionError('contatos-buttons-container', 'Erro ao carregar contatos');
    }
  }

  renderContatosButtons() {
    const container = this.containers.contatosButtons;
    if (!container || !this.contatosData || this.contatosData.length === 0) return;

    const fragment = document.createDocumentFragment();
    this.contatosData.forEach((contato, index) => {
      const btn = document.createElement('button');
      btn.className = 'contato-button';
      btn.dataset.contatoIndex = index;
      btn.textContent = contato.nome;
      fragment.appendChild(btn);
    });

    container.replaceChildren(fragment);
  }

  selectContato(index, skipToggle = false) {
    const detailsContainer = this.containers.contatoDetails;
    const selectedButton = this.containers.contatosButtons.querySelector(`[data-contato-index="${index}"]`);

    const isSameSelection = this.selectedContato && this.selectedContato.index === index;

    if (isSameSelection && !skipToggle) {
      this.selectedContato = null;
      this.containers.contatosButtons
        .querySelectorAll('.contato-button')
        .forEach(btn => btn.classList.remove('selected'));
      this.closeAllDetails();
      this.validateSelections();
      return;
    }

    this.clearOtherSelections('contato');

    this.containers.contatosButtons
      .querySelectorAll('.contato-button')
      .forEach(btn => btn.classList.remove('selected'));
    if (selectedButton) selectedButton.classList.add('selected');

    this.closeAllDetails(detailsContainer);

    this.selectedContato = { index, data: this.contatosData[index] };
    this.renderContatoDetails();
    this.validateSelections();
  }

  renderContatoDetails() {
    if (!this.selectedContato) return;

    const detailsContainer = this.containers.contatoDetails;
    const titleElement = detailsContainer.querySelector('.contato-title');
    const descricaoElement = detailsContainer.querySelector('.contato-descricao');
    const itensList = detailsContainer.querySelector('.itens-list');

    const contato = this.selectedContato.data;
    titleElement.textContent = contato.nome;
    descricaoElement.innerHTML = `<p>${contato.descricao}</p>`;

    let itensHtml = '';
    contato.itens.forEach(item => {
      itensHtml += `<div class="item-lista">${item}</div>`;
    });
    itensList.innerHTML = itensHtml;
    detailsContainer.style.display = 'block';
  }
}

export default NarrativaManager;