// =========================
// Maeri RPG - Etapa 2: Complementos
// Gerencia a seleção do tipo de ser do personagem, estudos, técnicas marciais e estudos mágicos
// =========================

class ComplementosManager {
  constructor(previewElement) {
    this.previewElement = previewElement;
    this.seresData = null;
    this.estudosData = null;
    this.tecnicasData = null;
    this.magiasData = null;
    this.selectedSer = null;
    this.selectedEstudo = null;
    this.selectedTecnica = null;
    this.selectedMagia = null;

    // Referências para os containers (preenchidos no buildStructure)
    this.containers = {
      seresButtons: null,
      serDetails: null,
      estudosButtons: null,
      estudoDetails: null,
      tecnicasButtons: null,
      tecnicaDetails: null,  // <- CORRIGIDO: singular
      magiasButtons: null,
      magiaDetails: null,
    };

    this.DATA_PATHS = {
      SERES: '../data/rulebook/06-seres.json',
      PERSONAGEM: '../data/rulebook/02-personagem.json',
      SOCIAL: '../data/rulebook/05-circulo-social-comercio.json',
      MAGIA: '../data/rulebook/04-magia.json'
    };

    this.setupEventDelegation();
  }

  // ===== MÉTODO PRINCIPAL =====
  render() {
    if (!this.previewElement) return;

    this.previewElement.innerHTML = '';
    this.buildStructure();

    this.loadSeresData();
    this.loadEstudosData();
    this.loadTecnicasData();
    this.loadMagiasData();

    this.restoreSelections();
  }

  // ===== CONSTRUÇÃO DA ESTRUTURA DOM =====
  buildStructure() {
    const fragment = document.createDocumentFragment();
    const container = document.createElement('div');
    container.className = 'complementos-container';

    // --- Introdução ---
    const intro = document.createElement('p');
    intro.className = 'complementos-intro';
    intro.textContent = 'Escolha o tipo de ser do personagem:';
    container.appendChild(intro);

    // --- SERES ---
    const seresButtonsContainer = document.createElement('div');
    seresButtonsContainer.id = 'seres-buttons-container';
    seresButtonsContainer.className = 'seres-buttons';
    seresButtonsContainer.innerHTML = `
      <div class="loading-state">
        <span class="spinner"></span>
        <span>Carregando seres...</span>
      </div>
    `;
    container.appendChild(seresButtonsContainer);
    this.containers.seresButtons = seresButtonsContainer;

    const serDetailsContainer = document.createElement('div');
    serDetailsContainer.id = 'ser-details-container';
    serDetailsContainer.className = 'ser-details';
    serDetailsContainer.style.display = 'none';
    serDetailsContainer.innerHTML = `
      <h3 class="ser-title"></h3>
      <div class="ser-caracteristicas"></div>
      <div class="ser-descricao"></div>
    `;
    container.appendChild(serDetailsContainer);
    this.containers.serDetails = serDetailsContainer;

    // --- ESTUDOS ---
    const estudosSection = document.createElement('div');
    estudosSection.id = 'estudos-section';
    estudosSection.className = 'estudos-section';
    estudosSection.innerHTML = `
      <p class="estudos-intro">Escolha onde gastar Aspectos:</p>
      <p class="estudos-subtitle">Estudos</p>
      <p class="estudos-subtitle">Um personagem pode ter sua S em Conhecimentos, que são cumulativos com magia, pois também contam como conhecimentos</p>
    `;
    container.appendChild(estudosSection);

    const estudosButtonsContainer = document.createElement('div');
    estudosButtonsContainer.id = 'estudos-buttons-container';
    estudosButtonsContainer.className = 'estudos-buttons';
    estudosButtonsContainer.innerHTML = `
      <div class="loading-state">
        <span class="spinner"></span>
        <span>Carregando estudos...</span>
      </div>
    `;
    estudosSection.appendChild(estudosButtonsContainer);
    this.containers.estudosButtons = estudosButtonsContainer;

    const estudoDetailsContainer = document.createElement('div');
    estudoDetailsContainer.id = 'estudo-details-container';
    estudoDetailsContainer.className = 'estudo-details';
    estudoDetailsContainer.style.display = 'none';
    estudoDetailsContainer.innerHTML = `
      <h3 class="estudo-title"></h3>
      <div class="estudo-descricao"></div>
      <div class="estudo-conhecimentos">
        <h4>Conhecimentos</h4>
        <div class="conhecimentos-list"></div>
      </div>
    `;
    estudosSection.appendChild(estudoDetailsContainer);
    this.containers.estudoDetails = estudoDetailsContainer;

    // --- TÉCNICAS MARCIAIS ---
    const tecnicasSection = document.createElement('div');
    tecnicasSection.id = 'tecnicas-section';
    tecnicasSection.className = 'tecnicas-section';
    tecnicasSection.innerHTML = `
      <p class="tecnicas-subtitle">Técnicas Marciais</p>
      <p class="magias-subtitle">Exige que um dos seus Contatos seja um Mestre.</p>
    `;
    container.appendChild(tecnicasSection);

    const tecnicasButtonsContainer = document.createElement('div');
    tecnicasButtonsContainer.id = 'tecnicas-buttons-container';
    tecnicasButtonsContainer.className = 'tecnicas-buttons';
    tecnicasButtonsContainer.innerHTML = `
      <div class="loading-state">
        <span class="spinner"></span>
        <span>Carregando técnicas...</span>
      </div>
    `;
    tecnicasSection.appendChild(tecnicasButtonsContainer);
    this.containers.tecnicasButtons = tecnicasButtonsContainer;

    const tecnicaDetailsContainer = document.createElement('div');
    tecnicaDetailsContainer.id = 'tecnica-details-container';
    tecnicaDetailsContainer.className = 'tecnica-details';
    tecnicaDetailsContainer.style.display = 'none';
    tecnicaDetailsContainer.innerHTML = `
      <h3 class="tecnica-title"></h3>
      <div class="tecnica-descricao"></div>
    `;
    tecnicasSection.appendChild(tecnicaDetailsContainer);
    this.containers.tecnicaDetails = tecnicaDetailsContainer; // <- SINGULAR

    // --- ESTUDOS MÁGICOS ---
    const magiasSection = document.createElement('div');
    magiasSection.id = 'magias-section';
    magiasSection.className = 'magias-section';
    magiasSection.innerHTML = `
      <p class="magias-subtitle">Estudos Mágicos</p>
      <p class="magias-subtitle">Antes de poder adquirir Bruxaria, Divinação ou Feitiçaria, é obrigatório adquirir Neófita antes. Um personagem pode conhecer sua S em magias.</p>
    `;
    container.appendChild(magiasSection);

    const magiasButtonsContainer = document.createElement('div');
    magiasButtonsContainer.id = 'magias-buttons-container';
    magiasButtonsContainer.className = 'magias-buttons';
    magiasButtonsContainer.innerHTML = `
      <div class="loading-state">
        <span class="spinner"></span>
        <span>Carregando estudos mágicos...</span>
      </div>
    `;
    magiasSection.appendChild(magiasButtonsContainer);
    this.containers.magiasButtons = magiasButtonsContainer;

    const magiaDetailsContainer = document.createElement('div');
    magiaDetailsContainer.id = 'magia-details-container';
    magiaDetailsContainer.className = 'magia-details';
    magiaDetailsContainer.style.display = 'none';
    magiaDetailsContainer.innerHTML = `
      <h3 class="magia-title"></h3>
      <div class="magia-descricao"></div>
      <div class="magia-efeitos">
        <h4>Efeitos Menores</h4>
        <div class="efeitos-list"></div>
      </div>
    `;
    magiasSection.appendChild(magiaDetailsContainer);
    this.containers.magiaDetails = magiaDetailsContainer;

    this.previewElement.appendChild(container);
  }

  // ===== DELEGAÇÃO DE EVENTOS =====
  setupEventDelegation() {
    this.previewElement.addEventListener('click', (event) => {
      const button = event.target.closest('.ser-button, .estudo-button, .tecnica-button, .magia-button');
      if (!button) return;

      if (button.classList.contains('ser-button')) {
        this.selectSer(button.dataset.serId);
      } else if (button.classList.contains('estudo-button')) {
        this.selectEstudo(parseInt(button.dataset.estudoIndex, 10));
      } else if (button.classList.contains('tecnica-button')) {
        this.selectTecnica(parseInt(button.dataset.tecnicaIndex, 10));
      } else if (button.classList.contains('magia-button')) {
        this.selectMagia(parseInt(button.dataset.magiaIndex, 10));
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

  // Fecha todos os detalhes, exceto o container especificado
  closeAllDetails(excludeContainer = null) {
    const allDetails = [
      this.containers.serDetails,
      this.containers.estudoDetails,
      this.containers.tecnicaDetails, // <- CORRIGIDO: singular
      this.containers.magiaDetails
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
      ser: this.selectedSer,
      estudo: this.selectedEstudo,
      tecnica: this.selectedTecnica,
      magia: this.selectedMagia
    };

    const event = new CustomEvent('complementos:updated', {
      detail: selections,
      bubbles: true
    });
    this.previewElement?.dispatchEvent(event);
    return selections;
  }

  // ===== RESTAURAÇÃO DE SELEÇÕES =====
  restoreSelections() {
    if (this.selectedSer) {
      this.selectSer(this.selectedSer.topic_id, true);
    }
    if (this.selectedEstudo) {
      this.selectEstudo(this.selectedEstudo.index, true);
    }
    if (this.selectedTecnica) {
      this.selectTecnica(this.selectedTecnica.index, true);
    }
    if (this.selectedMagia) {
      this.selectMagia(this.selectedMagia.index, true);
    }
  }

  // ==========================================================
  // SERES
  // ==========================================================
  async loadSeresData() {
    try {
      const response = await fetch(this.DATA_PATHS.SERES);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data.sections || !Array.isArray(data.sections)) {
        throw new Error('Formato de dados inválido: sections não encontrada');
      }

      this.seresData = data.sections.filter(section =>
        section.topic_id !== 'o-que-sao-seres' &&
        section.topic_id !== 'introducao'
      );

      if (this.seresData.length === 0) {
        throw new Error('Nenhum ser encontrado');
      }

      this.renderSeresButtons();
      this.restoreSelections();
    } catch (error) {
      console.error('Erro ao carregar dados dos seres:', error);
      this.showSectionError('seres-buttons-container', 'Erro ao carregar seres');
    }
  }

  renderSeresButtons() {
    const container = this.containers.seresButtons;
    if (!container || !this.seresData) return;

    const fragment = document.createDocumentFragment();
    this.seresData.forEach(ser => {
      const btn = document.createElement('button');
      btn.className = 'ser-button';
      btn.dataset.serId = ser.topic_id;
      btn.textContent = ser.title;
      fragment.appendChild(btn);
    });

    container.replaceChildren(fragment);
  }

  selectSer(serId, skipToggle = false) {
    const detailsContainer = this.containers.serDetails;
    const selectedButton = this.containers.seresButtons.querySelector(`[data-ser-id="${serId}"]`);

    if (skipToggle && this.selectedSer && this.selectedSer.topic_id === serId) {
      return;
    }

    this.containers.seresButtons.querySelectorAll('.ser-button').forEach(btn => btn.classList.remove('selected'));
    if (selectedButton) selectedButton.classList.add('selected');

    this.closeAllDetails(detailsContainer);

    this.selectedSer = this.seresData.find(ser => ser.topic_id === serId);
    this.renderSerDetails();
    this.validateSelections();
  }

  renderSerDetails() {
    if (!this.selectedSer) return;

    const detailsContainer = this.containers.serDetails;
    const titleElement = detailsContainer.querySelector('.ser-title');
    const caracteristicasElement = detailsContainer.querySelector('.ser-caracteristicas');
    const descricaoElement = detailsContainer.querySelector('.ser-descricao');

    titleElement.textContent = this.selectedSer.title;

    const caracteristicasList = this.selectedSer.content.filter(item => item.id === 'seres_item');
    if (caracteristicasList.length > 0) {
      let html = '<h4>Características</h4>';
      caracteristicasList.forEach(item => {
        const textParts = item.text.split('. ');
        const titulo = textParts.length > 1 ? textParts[0] : 'Característica';
        const descricaoChar = textParts.length > 1 ? textParts.slice(1).join('. ') : item.text;
        html += `<div class="caracteristica-item"><strong>${titulo}:</strong> ${descricaoChar}</div>`;
      });
      caracteristicasElement.innerHTML = html;
    } else {
      caracteristicasElement.innerHTML = '';
    }

    const descricao = this.selectedSer.content.find(item => item.item_descrip);
    if (descricao) {
      descricaoElement.innerHTML = `<h4>Descrição</h4><p>${descricao.item_descrip || descricao.text}</p>`;
    } else {
      descricaoElement.innerHTML = '';
    }

    detailsContainer.style.display = 'block';
  }

  // ==========================================================
  // ESTUDOS
  // ==========================================================
  async loadEstudosData() {
    try {
      const response = await fetch(this.DATA_PATHS.PERSONAGEM);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data.sections || !Array.isArray(data.sections)) {
        throw new Error('Formato de dados inválido: sections não encontrada');
      }

      const estudosSection = data.sections.find(s => s.topic_id === 'lista-de-estudos');
      if (!estudosSection) {
        throw new Error('Seção de estudos não encontrada');
      }

      this.processarEstudos(estudosSection.content);
      if (!this.estudosData || this.estudosData.length === 0) {
        throw new Error('Nenhum estudo encontrado');
      }

      this.renderEstudosButtons();
      this.restoreSelections();
    } catch (error) {
      console.error('Erro ao carregar dados dos estudos:', error);
      this.showSectionError('estudos-buttons-container', 'Erro ao carregar estudos');
    }
  }

  isRegraGeral(texto) {
    if (!texto) return false;
    const textoLower = texto.toLowerCase();
    const regrasGerais = ['custo', 'xpm', 'teste', 'fonte', 'repouso'];
    return regrasGerais.some(regra => textoLower.includes(regra));
  }

  isNewEstudo(item) {
    return item.estudos_item && !this.isRegraGeral(item.estudos_item);
  }

  isConhecimento(item) {
    return item.id === 'estudos_item';
  }

  createEstudo(item) {
    return {
      nome: item.estudos_item,
      descricao: item.text,
      conhecimentos: []
    };
  }

  processarEstudos(content) {
    this.estudosData = [];
    let currentEstudo = null;

    content.forEach(item => {
      if (this.isNewEstudo(item)) {
        if (currentEstudo) {
          this.estudosData.push(currentEstudo);
        }
        currentEstudo = this.createEstudo(item);
      } else if (this.isConhecimento(item) && currentEstudo) {
        currentEstudo.conhecimentos.push(item.text);
      }
    });

    if (currentEstudo) {
      this.estudosData.push(currentEstudo);
    }
  }

  renderEstudosButtons() {
    const container = this.containers.estudosButtons;
    if (!container || !this.estudosData) return;

    const fragment = document.createDocumentFragment();
    this.estudosData.forEach((estudo, index) => {
      const btn = document.createElement('button');
      btn.className = 'estudo-button';
      btn.dataset.estudoIndex = index;
      btn.textContent = estudo.nome;
      fragment.appendChild(btn);
    });

    container.replaceChildren(fragment);
  }

  selectEstudo(index, skipToggle = false) {
    const detailsContainer = this.containers.estudoDetails;
    const selectedButton = this.containers.estudosButtons.querySelector(`[data-estudo-index="${index}"]`);

    if (skipToggle && this.selectedEstudo && this.selectedEstudo.index === index) {
      return;
    }

    this.containers.estudosButtons.querySelectorAll('.estudo-button').forEach(btn => btn.classList.remove('selected'));
    if (selectedButton) selectedButton.classList.add('selected');

    this.closeAllDetails(detailsContainer);

    this.selectedEstudo = { index, data: this.estudosData[index] };
    this.renderEstudoDetails();
    this.validateSelections();
  }

  renderEstudoDetails() {
    if (!this.selectedEstudo) return;

    const detailsContainer = this.containers.estudoDetails;
    const titleElement = detailsContainer.querySelector('.estudo-title');
    const descricaoElement = detailsContainer.querySelector('.estudo-descricao');
    const conhecimentosList = detailsContainer.querySelector('.conhecimentos-list');

    const estudo = this.selectedEstudo.data;
    titleElement.textContent = estudo.nome;
    descricaoElement.innerHTML = `<p>${estudo.descricao}</p>`;

    let conhecimentosHtml = '';
    estudo.conhecimentos.forEach(conhecimento => {
      const textParts = conhecimento.split('. ');
      const titulo = textParts.length > 1 ? textParts[0] : 'Conhecimento';
      const descricao = textParts.length > 1 ? textParts.slice(1).join('. ') : conhecimento;
      conhecimentosHtml += `
        <div class="conhecimento-item">
          <strong>${titulo}:</strong> ${descricao}
        </div>
      `;
    });
    conhecimentosList.innerHTML = conhecimentosHtml;
    detailsContainer.style.display = 'block';
  }

  // ==========================================================
  // TÉCNICAS MARCIAIS
  // ==========================================================
  async loadTecnicasData() {
    try {
      const response = await fetch(this.DATA_PATHS.SOCIAL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data.sections || !Array.isArray(data.sections)) {
        throw new Error('Formato de dados inválido: sections não encontrada');
      }

      const tecnicasSection = data.sections.find(s => s.topic_id === 'tecnicas-marcais');
      if (!tecnicasSection) {
        throw new Error('Seção de técnicas marciais não encontrada');
      }

      const listaTecnicas = tecnicasSection.content.find(c => c.type === 'list' && c.id === 'tec_item');
      if (!listaTecnicas || !listaTecnicas.items) {
        throw new Error('Lista de técnicas não encontrada');
      }

      this.processarTecnicas(listaTecnicas.items);
      if (!this.tecnicasData || this.tecnicasData.length === 0) {
        throw new Error('Nenhuma técnica encontrada');
      }

      this.renderTecnicasButtons();
      this.restoreSelections();
    } catch (error) {
      console.error('Erro ao carregar dados das técnicas marciais:', error);
      this.showSectionError('tecnicas-buttons-container', 'Erro ao carregar técnicas');
    }
  }

  processarTecnicas(items) {
    this.tecnicasData = items.map(item => {
      const firstDotIndex = item.indexOf('.');
      const titulo = item.substring(0, firstDotIndex).trim();
      const descricao = item.substring(firstDotIndex + 1).trim();
      return { titulo, descricao };
    });
  }

  renderTecnicasButtons() {
    const container = this.containers.tecnicasButtons;
    if (!container || !this.tecnicasData) return;

    const fragment = document.createDocumentFragment();
    this.tecnicasData.forEach((tecnica, index) => {
      const btn = document.createElement('button');
      btn.className = 'tecnica-button';
      btn.dataset.tecnicaIndex = index;
      btn.textContent = tecnica.titulo;
      fragment.appendChild(btn);
    });

    container.replaceChildren(fragment);
  }

  selectTecnica(index, skipToggle = false) {
    const detailsContainer = this.containers.tecnicaDetails; // <- SINGULAR
    const selectedButton = this.containers.tecnicasButtons.querySelector(`[data-tecnica-index="${index}"]`);

    if (skipToggle && this.selectedTecnica && this.selectedTecnica.index === index) {
      return;
    }

    this.containers.tecnicasButtons.querySelectorAll('.tecnica-button').forEach(btn => btn.classList.remove('selected'));
    if (selectedButton) selectedButton.classList.add('selected');

    this.closeAllDetails(detailsContainer);

    this.selectedTecnica = { index, data: this.tecnicasData[index] };
    this.renderTecnicaDetails();
    this.validateSelections();
  }

  renderTecnicaDetails() {
    if (!this.selectedTecnica) return;

    const detailsContainer = this.containers.tecnicaDetails;
    const titleElement = detailsContainer.querySelector('.tecnica-title');
    const descricaoElement = detailsContainer.querySelector('.tecnica-descricao');

    const tecnica = this.selectedTecnica.data;
    titleElement.textContent = tecnica.titulo;
    descricaoElement.innerHTML = `<p>${tecnica.descricao}</p>`;
    detailsContainer.style.display = 'block';
  }

  // ==========================================================
  // ESTUDOS MÁGICOS
  // ==========================================================
  async loadMagiasData() {
    try {
      const response = await fetch(this.DATA_PATHS.MAGIA);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data.sections || !Array.isArray(data.sections)) {
        throw new Error('Formato de dados inválido: sections não encontrada');
      }

      const estudosMagicosValidos = ['neofita', 'bruxaria', 'divinacao', 'feiticaria'];
      this.magiasData = data.sections.filter(section =>
        estudosMagicosValidos.includes(section.topic_id)
      );

      if (this.magiasData.length === 0) {
        throw new Error('Nenhum estudo mágico encontrado');
      }

      this.renderMagiasButtons();
      this.restoreSelections();
    } catch (error) {
      console.error('Erro ao carregar dados dos estudos mágicos:', error);
      this.showSectionError('magias-buttons-container', 'Erro ao carregar estudos mágicos');
    }
  }

  renderMagiasButtons() {
    const container = this.containers.magiasButtons;
    if (!container || !this.magiasData) return;

    const fragment = document.createDocumentFragment();
    this.magiasData.forEach((magia, index) => {
      const btn = document.createElement('button');
      btn.className = 'magia-button';
      btn.dataset.magiaIndex = index;
      btn.textContent = magia.title;
      fragment.appendChild(btn);
    });

    container.replaceChildren(fragment);
  }

  selectMagia(index, skipToggle = false) {
    const detailsContainer = this.containers.magiaDetails;
    const selectedButton = this.containers.magiasButtons.querySelector(`[data-magia-index="${index}"]`);

    if (skipToggle && this.selectedMagia && this.selectedMagia.index === index) {
      return;
    }

    this.containers.magiasButtons.querySelectorAll('.magia-button').forEach(btn => btn.classList.remove('selected'));
    if (selectedButton) selectedButton.classList.add('selected');

    this.closeAllDetails(detailsContainer);

    this.selectedMagia = { index, data: this.magiasData[index] };
    this.renderMagiaDetails();
    this.validateSelections();
  }

  renderMagiaDetails() {
    if (!this.selectedMagia) return;

    const detailsContainer = this.containers.magiaDetails;
    const titleElement = detailsContainer.querySelector('.magia-title');
    const descricaoElement = detailsContainer.querySelector('.magia-descricao');
    const efeitosList = detailsContainer.querySelector('.efeitos-list');

    const magia = this.selectedMagia.data;
    titleElement.textContent = magia.title;

    const descricaoParagrafos = [];
    const efeitos = [];
    let encontrouEfeitos = false;

    magia.content.forEach(item => {
      if (item.type === 'paragraph' && !encontrouEfeitos) {
        if (item.text.includes('Efeitos Menores')) {
          encontrouEfeitos = true;
        } else {
          descricaoParagrafos.push(`<p>${item.text}</p>`);
        }
      } else if (item.type === 'list' && item.items) {
        efeitos.push(...item.items);
      }
    });

    descricaoElement.innerHTML = descricaoParagrafos.join('');

    let efeitosHtml = '';
    efeitos.forEach(efeito => {
      efeitosHtml += `<div class="efeito-item">${efeito}</div>`;
    });
    efeitosList.innerHTML = efeitosHtml;

    detailsContainer.style.display = 'block';
  }
}

export default ComplementosManager;