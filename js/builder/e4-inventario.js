// =========================
// Maeri RPG - Etapa 4: Inventário
// Gerencia a visualização de moedas, limites de peso e itens disponíveis por contato
// =========================

class InventarioManager {
  constructor(previewElement) {
    this.previewElement = previewElement;
    this.contatosData = null;
    this.selectedContato = null;

    // Referências para os containers (preenchidos no buildStructure)
    this.containers = {
      moedaFlorins: null,
      moedaDenares: null,
      moedaTostoes: null,
      pesoMedio: null,
      pesoMaximo: null,
      contatosButtons: null,
      contatoDetails: null,
    };

    // Caminhos dos dados padronizados
    this.DATA_PATHS = {
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

    // Carrega os dados dos contatos
    this.loadContatosData();

    // Restaura seleção (se houver)
    this.restoreSelections();
  }

  // ===== CONSTRUÇÃO DA ESTRUTURA DOM =====
  buildStructure() {
    const fragment = document.createDocumentFragment();
    const container = document.createElement('div');
    container.className = 'inventario-container';

    // --- Moedas ---
    const moedasSection = document.createElement('div');
    moedasSection.className = 'moedas-section';

    const moedasTitle = document.createElement('h3');
    moedasTitle.className = 'inventario-subtitle';
    moedasTitle.textContent = 'Moedas';
    moedasSection.appendChild(moedasTitle);

    const moedasText = document.createElement('p');
    moedasText.className = 'moedas-text';
    moedasText.textContent = 'As moedas são definidas da seguinte maneira:';
    moedasSection.appendChild(moedasText);

    const moedasGrid = document.createElement('div');
    moedasGrid.className = 'moedas-grid';

    // Florins
    const florinsItem = this.createMoedaItem('Fo', 'Florins de Ouro', 'I + 1d6', 'moeda-florins');
    moedasGrid.appendChild(florinsItem);
    this.containers.moedaFlorins = florinsItem.querySelector('.moeda-valor');

    // Denares
    const denaresItem = this.createMoedaItem('Dp', 'Denares de Prata', 'V + 1d6', 'moeda-denares');
    moedasGrid.appendChild(denaresItem);
    this.containers.moedaDenares = denaresItem.querySelector('.moeda-valor');

    // Tostões
    const tostoesItem = this.createMoedaItem('Tc', 'Tostões de Cobre', 'S + 1d6', 'moeda-tostoes');
    moedasGrid.appendChild(tostoesItem);
    this.containers.moedaTostoes = tostoesItem.querySelector('.moeda-valor');

    moedasSection.appendChild(moedasGrid);
    container.appendChild(moedasSection);

    // --- Limites de Peso ---
    const pesoSection = document.createElement('div');
    pesoSection.className = 'peso-section';

    const pesotitle = document.createElement('h3');
    pesotitle.className = 'inventario-subtitle';
    pesotitle.textContent = 'Limites de Peso';
    pesoSection.appendChild(pesotitle);

    const pesoText = document.createElement('p');
    pesoText.className = 'peso-text';
    pesoText.textContent = 'Os limites de peso médio e máximo são definidos assim:';
    pesoSection.appendChild(pesoText);

    const pesoGrid = document.createElement('div');
    pesoGrid.className = 'peso-grid';

    // Médio
    const medioItem = this.createPesoItem('Médio', 'F x 2', 'peso-medio');
    pesoGrid.appendChild(medioItem);
    this.containers.pesoMedio = medioItem.querySelector('.peso-valor');

    // Máximo
    const maximoItem = this.createPesoItem('Máximo', 'F x 4', 'peso-maximo');
    pesoGrid.appendChild(maximoItem);
    this.containers.pesoMaximo = maximoItem.querySelector('.peso-valor');

    pesoSection.appendChild(pesoGrid);
    container.appendChild(pesoSection);

    // --- Itens por Contato ---
    const itensSection = document.createElement('div');
    itensSection.className = 'itens-contato-section';

    const itensTitle = document.createElement('h3');
    itensTitle.className = 'inventario-subtitle';
    itensTitle.textContent = 'Itens Disponíveis';
    itensSection.appendChild(itensTitle);

    const itensIntro = document.createElement('p');
    itensIntro.className = 'itens-intro';
    itensIntro.textContent = 'Os itens são adquiridos nas lojas de acordo com os Contatos escolhidos:';
    itensSection.appendChild(itensIntro);

    const contatosButtonsContainer = document.createElement('div');
    contatosButtonsContainer.id = 'inventario-contatos-buttons-container';
    contatosButtonsContainer.className = 'contatos-buttons';
    contatosButtonsContainer.innerHTML = `
      <div class="loading-state">
        <span class="spinner"></span>
        <span>Carregando contatos...</span>
      </div>
    `;
    itensSection.appendChild(contatosButtonsContainer);
    this.containers.contatosButtons = contatosButtonsContainer;

    const contatoDetailsContainer = document.createElement('div');
    contatoDetailsContainer.id = 'inventario-contato-details-container';
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
    itensSection.appendChild(contatoDetailsContainer);
    this.containers.contatoDetails = contatoDetailsContainer;

    container.appendChild(itensSection);

    // Adiciona o container completo ao preview
    this.previewElement.appendChild(container);
  }

  // ===== AUXILIARES DE CRIAÇÃO DE ELEMENTOS =====
  createMoedaItem(simbolo, nome, calculo, id) {
    const item = document.createElement('div');
    item.className = 'moeda-item';

    const simboloEl = document.createElement('span');
    simboloEl.className = 'moeda-simbolo';
    simboloEl.textContent = simbolo;
    item.appendChild(simboloEl);

    const nomeEl = document.createElement('span');
    nomeEl.className = 'moeda-nome';
    nomeEl.textContent = nome;
    item.appendChild(nomeEl);

    const calcEl = document.createElement('span');
    calcEl.className = 'moeda-calculo';
    calcEl.textContent = calculo;
    item.appendChild(calcEl);

    const valorEl = document.createElement('span');
    valorEl.className = 'moeda-valor';
    valorEl.id = id;
    valorEl.textContent = '—';
    item.appendChild(valorEl);

    return item;
  }

  createPesoItem(tipo, calculo, id) {
    const item = document.createElement('div');
    item.className = 'peso-item';

    const tipoEl = document.createElement('span');
    tipoEl.className = 'peso-tipo';
    tipoEl.textContent = tipo;
    item.appendChild(tipoEl);

    const calcEl = document.createElement('span');
    calcEl.className = 'peso-calculo';
    calcEl.textContent = calculo;
    item.appendChild(calcEl);

    const valorEl = document.createElement('span');
    valorEl.className = 'peso-valor';
    valorEl.id = id;
    valorEl.textContent = '—';
    item.appendChild(valorEl);

    return item;
  }

  // ===== DELEGAÇÃO DE EVENTOS =====
  setupEventDelegation() {
    this.previewElement.addEventListener('click', (event) => {
      const button = event.target.closest('[data-inventario-contato-index]');
      if (!button) return;
      this.selectContato(parseInt(button.dataset.inventarioContatoIndex, 10));
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

  // ===== CÁLCULOS =====
  rollD6() {
    return Math.floor(Math.random() * 6) + 1;
  }

  calcularMoedas(atributos) {
    const { inteligencia = 0, vontade = 0, sagacidade = 0 } = atributos;
    return {
      florins: inteligencia + this.rollD6(),
      denares: vontade + this.rollD6(),
      tostoes: sagacidade + this.rollD6()
    };
  }

  calcularPeso(forca = 0) {
    return {
      medio: forca * 2,
      maximo: forca * 4
    };
  }

  atualizarValores(atributos) {
    if (!this.previewElement) return;

    // Atualiza moedas
    const moedas = this.calcularMoedas(atributos);
    if (this.containers.moedaFlorins) this.containers.moedaFlorins.textContent = moedas.florins;
    if (this.containers.moedaDenares) this.containers.moedaDenares.textContent = moedas.denares;
    if (this.containers.moedaTostoes) this.containers.moedaTostoes.textContent = moedas.tostoes;

    // Atualiza peso
    const peso = this.calcularPeso(atributos.forca || 0);
    if (this.containers.pesoMedio) this.containers.pesoMedio.textContent = peso.medio;
    if (this.containers.pesoMaximo) this.containers.pesoMaximo.textContent = peso.maximo;
  }

  // ===== INTEGRAÇÃO COM ETAPA 3 =====
  setSelectedContatos(contatosSelecionados) {
    if (!contatosSelecionados?.contato || !this.contatosData) return;
    const index = this.contatosData.findIndex(
      c => c.nome === contatosSelecionados.contato.data.nome
    );
    if (index !== -1) {
      this.selectContato(index);
    }
  }

  // ===== RESTAURAÇÃO DE SELEÇÕES =====
  restoreSelections() {
    if (this.selectedContato) {
      this.selectContato(this.selectedContato.index, true);
    }
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
      this.showSectionError('inventario-contatos-buttons-container', 'Erro ao carregar contatos');
    }
  }

  renderContatosButtons() {
    const container = this.containers.contatosButtons;
    if (!container || !this.contatosData || this.contatosData.length === 0) return;

    const fragment = document.createDocumentFragment();
    this.contatosData.forEach((contato, index) => {
      const btn = document.createElement('button');
      btn.className = 'contato-button';
      btn.dataset.inventarioContatoIndex = index;
      btn.textContent = contato.nome;
      fragment.appendChild(btn);
    });

    container.replaceChildren(fragment);
  }

  selectContato(index, skipToggle = false) {
    const detailsContainer = this.containers.contatoDetails;
    const selectedButton = this.containers.contatosButtons.querySelector(`[data-inventario-contato-index="${index}"]`);

    const isSame = this.selectedContato && this.selectedContato.index === index;

    if (isSame && !skipToggle) {
      this.closeWithAnimation(detailsContainer, () => {
        this.selectedContato = null;
        this.containers.contatosButtons.querySelectorAll('[data-inventario-contato-index]').forEach(btn => btn.classList.remove('selected'));
      });
      return;
    }

    // Fecha o detalhe anterior (se houver) - como só temos um, não precisamos de closeAllDetails
    // Mas garantimos que o container atual seja fechado antes de abrir outro
    // Como é um único container, podemos simplesmente escondê-lo se já estiver aberto
    // Porém, como há apenas um, não há outro para fechar. Então não fazemos nada.

    this.containers.contatosButtons.querySelectorAll('[data-inventario-contato-index]').forEach(btn => btn.classList.remove('selected'));
    if (selectedButton) selectedButton.classList.add('selected');

    this.selectedContato = {
      index: index,
      data: this.contatosData[index]
    };
    this.renderContatoDetails();
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

export default InventarioManager;