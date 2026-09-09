// =========================
// Maeri RPG - Level Up Manager
// Gerencia a visualização das informações de Level Up e Classes
// =========================

class LevelUpManager {
  constructor(container) {
    this.container = container;
    this.rulebookData = null;
    this.classesData = null;
    this.currentView = 'levelup';
    this.selectedClass = null;

    // Bind dos métodos
    this.render = this.render.bind(this);
    this.loadRulebookData = this.loadRulebookData.bind(this);
    this.renderLevelUpInfo = this.renderLevelUpInfo.bind(this);
    this.renderClassList = this.renderClassList.bind(this);
    this.renderClassDetails = this.renderClassDetails.bind(this);
    this.handleClassClick = this.handleClassClick.bind(this);
    this.handleBackClick = this.handleBackClick.bind(this);

    // Configura a delegação de eventos uma única vez (o container não é recriado)
    this.setupEventDelegation();
  }

  // ===== MÉTODO PRINCIPAL =====
  async render() {
    if (!this.container) return;

    // Limpa o container antes de construir o novo conteúdo
    this.container.innerHTML = '';

    // Constrói a estrutura do zero
    this.buildStructure();

    // Carrega os dados (se já não estiverem carregados)
    if (!this.rulebookData) {
      this.showLoading('Carregando informações de evolução...');
      await this.loadRulebookData();
    }

    // Se não conseguiu carregar os dados, exibe erro
    if (!this.rulebookData) {
      this.renderError('Não foi possível carregar as informações de Level Up.');
      return;
    }

    // Restaura a view atual (se houver)
    this.restoreView();

    // Renderiza a view atual
    if (this.currentView === 'levelup') {
      this.renderLevelUpInfo();
    } else if (this.currentView === 'class' && this.selectedClass) {
      this.renderClassDetails(this.selectedClass);
    }
  }

  // ===== CONSTRUÇÃO DA ESTRUTURA DOM =====
  buildStructure() {
    const container = document.createElement('div');
    container.className = 'levelup-container';

    // Container de conteúdo (será preenchido dinamicamente)
    const content = document.createElement('div');
    content.id = 'levelup-content';
    container.appendChild(content);

    // Adiciona ao container principal
    this.container.appendChild(container);
  }

  // ===== DELEGAÇÃO DE EVENTOS =====
  setupEventDelegation() {
    // Usamos o container principal para capturar cliques em elementos dinâmicos
    this.container.addEventListener('click', (event) => {
      // Clique em uma classe (card)
      const classCard = event.target.closest('.class-card');
      if (classCard) {
        const classId = classCard.dataset.classId;
        if (classId) {
          this.handleClassClick(classId);
        }
        return;
      }

      // Clique no botão "Voltar"
      const backButton = event.target.closest('#class-back-button');
      if (backButton) {
        this.handleBackClick();
        return;
      }

      // Clique no botão "Tentar novamente" (erro)
      const retryButton = event.target.closest('.levelup-retry-button');
      if (retryButton) {
        this.render();
        return;
      }
    });
  }

  // ===== CARREGAMENTO DE DADOS =====
  async loadRulebookData() {
    try {
      const response = await fetch('../data/rulebook/01-fundamentos.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.rulebookData = await response.json();

      // Carrega classes em paralelo
      const classesResponse = await fetch('../data/rulebook/07-classes.json');
      if (classesResponse.ok) {
        this.classesData = await classesResponse.json();
      }

      return this.rulebookData;
    } catch (error) {
      console.error('Erro ao carregar dados do rulebook:', error);
      this.renderError('Não foi possível carregar as informações de Level Up.');
      return null;
    }
  }

  // ===== RESTAURAÇÃO DE VIEW =====
  restoreView() {
    // Se houver uma classe selecionada, mantém a view 'class'
    // Caso contrário, mantém 'levelup'
    // (já está no estado atual)
  }

  // ===== UTILITÁRIOS DE RENDERIZAÇÃO =====
  getContentContainer() {
    return this.container.querySelector('#levelup-content');
  }

  showLoading(message) {
    const content = this.getContentContainer();
    if (!content) return;

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'levelup-loading';
    loadingDiv.innerHTML = `
      <p>${message}</p>
      <div class="loading-spinner"></div>
    `;
    content.replaceChildren(loadingDiv);
  }

  renderError(message) {
    const content = this.getContentContainer();
    if (!content) return;

    const errorDiv = document.createElement('div');
    errorDiv.className = 'levelup-error';
    errorDiv.innerHTML = `
      <p>${message}</p>
      <button class="levelup-retry-button">Tentar novamente</button>
    `;
    content.replaceChildren(errorDiv);
  }

  showError(message) {
    const content = this.getContentContainer();
    if (!content) return;

    const errorDiv = document.createElement('div');
    errorDiv.className = 'levelup-error';
    errorDiv.innerHTML = `
      <p>${message}</p>
      <button class="levelup-back-button" id="class-back-button">Voltar</button>
    `;
    content.replaceChildren(errorDiv);
  }

  // ===== VIEW: LEVEL UP (LISTA DE REGRAS E CLASSES) =====
  renderLevelUpInfo() {
    const content = this.getContentContainer();
    if (!content || !this.rulebookData) return;

    const fundamentalsSection = this.rulebookData.sections?.find(
      section => section.topic_id === 'nivel-e-experiencia'
    );

    if (!fundamentalsSection) {
      this.showError('Informações de Level Up não encontradas.');
      return;
    }

    const lvlupContent = fundamentalsSection.content?.find(
      item => item.id === 'lvlup_item'
    );

    // Cria o container principal
    const container = document.createElement('div');
    container.className = 'levelup-view';

    // Título
    const title = document.createElement('h2');
    title.className = 'levelup-title';
    title.textContent = 'Level Up';
    container.appendChild(title);

    const subtitle = document.createElement('h3');
    subtitle.className = 'levelup-subtitle';
    subtitle.textContent = fundamentalsSection.title;
    container.appendChild(subtitle);

    // Regras (lista)
    if (lvlupContent?.type === 'list') {
      const rulesContainer = document.createElement('div');
      rulesContainer.className = 'levelup-rules-container';

      const rulesDiv = document.createElement('div');
      rulesDiv.className = 'levelup-rules';

      const list = document.createElement('ul');
      list.className = 'levelup-list';
      lvlupContent.items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
      });
      rulesDiv.appendChild(list);
      rulesContainer.appendChild(rulesDiv);
      container.appendChild(rulesContainer);
    }

    // Introdução às classes
    const introDiv = document.createElement('div');
    introDiv.className = 'levelup-classes-intro';
    const introText = document.createElement('p');
    introText.className = 'classes-intro-text';
    introText.textContent = 'As opções de Classe e suas características são:';
    introDiv.appendChild(introText);
    container.appendChild(introDiv);

    // Grid de classes
    const grid = document.createElement('div');
    grid.className = 'levelup-classes-grid';
    grid.id = 'classes-grid';
    container.appendChild(grid);

    // Substitui o conteúdo
    content.replaceChildren(container);

    // Popula a lista de classes
    this.renderClassList();
  }

  // ===== LISTA DE CLASSES =====
  renderClassList() {
    const grid = document.getElementById('classes-grid');
    if (!grid) return;

    // Se os dados das classes ainda não foram carregados, tenta carregar
    if (!this.classesData) {
      fetch('../data/rulebook/07-classes.json')
        .then(response => response.json())
        .then(data => {
          this.classesData = data;
          this.populateClassesGrid(grid);
        })
        .catch(() => {
          grid.innerHTML = '<p class="error-message">Não foi possível carregar as classes.</p>';
        });
      return;
    }

    this.populateClassesGrid(grid);
  }

  populateClassesGrid(grid) {
    if (!grid || !this.classesData?.sections) return;

    const classes = this.classesData.sections.filter(section =>
      section.topic_id && section.topic_id !== 'o-que-sao-classes'
    );

    // Limpa o grid
    grid.innerHTML = '';

    classes.forEach(classSection => {
      const classTitleItem = classSection.content?.find(item => item.classes_item);
      const displayName = classTitleItem ? classTitleItem.classes_item : classSection.title;

      const card = document.createElement('button');
      card.className = 'class-card';
      card.dataset.classId = classSection.topic_id;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'class-name';
      nameSpan.textContent = displayName;

      card.appendChild(nameSpan);
      grid.appendChild(card);
    });
  }

  // ===== MANIPULAÇÃO DE CLIQUE EM CLASSE =====
  handleClassClick(classId) {
    if (!this.classesData?.sections) return;

    const selectedClass = this.classesData.sections.find(
      section => section.topic_id === classId
    );

    if (selectedClass) {
      this.currentView = 'class';
      this.selectedClass = selectedClass;
      this.renderClassDetails(selectedClass);
    }
  }

  // ===== VIEW: DETALHES DA CLASSE =====
  renderClassDetails(classData) {
    const content = this.getContentContainer();
    if (!content) return;

    const classTitleItem = classData.content?.find(item => item.classes_item);
    const className = classTitleItem ? classTitleItem.classes_item : classData.title;

    const classFeatures = classData.content?.filter(
      item => item.id === 'classes_item' && !item.classes_item
    ) || [];

    // Cria o container de detalhes
    const container = document.createElement('div');
    container.className = 'class-details-container';

    // Botão voltar
    const backButton = document.createElement('button');
    backButton.className = 'class-back-button';
    backButton.id = 'class-back-button';
    backButton.textContent = '← Voltar para Level Up';
    container.appendChild(backButton);

    // Cabeçalho
    const header = document.createElement('div');
    header.className = 'class-header';
    const title = document.createElement('h2');
    title.className = 'class-title';
    title.textContent = className;
    header.appendChild(title);
    container.appendChild(header);

    // Características
    const featuresContainer = document.createElement('div');
    featuresContainer.className = 'class-features-container';
    const featuresDiv = document.createElement('div');
    featuresDiv.className = 'class-features';

    if (classFeatures.length > 0) {
      classFeatures.forEach(feature => {
        const featureDiv = document.createElement('div');
        featureDiv.className = 'class-feature';
        const p = document.createElement('p');
        p.className = 'feature-text';
        p.textContent = feature.text;
        featureDiv.appendChild(p);
        featuresDiv.appendChild(featureDiv);
      });
    } else {
      const errorMsg = document.createElement('p');
      errorMsg.className = 'error-message';
      errorMsg.textContent = 'Nenhuma característica encontrada.';
      featuresDiv.appendChild(errorMsg);
    }

    featuresContainer.appendChild(featuresDiv);
    container.appendChild(featuresContainer);

    // Substitui o conteúdo
    content.replaceChildren(container);
  }

  // ===== VOLTAR PARA LEVEL UP =====
  handleBackClick() {
    this.currentView = 'levelup';
    this.selectedClass = null;
    this.renderLevelUpInfo();
  }
}

export default LevelUpManager;