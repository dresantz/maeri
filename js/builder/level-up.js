// =========================
// Maeri RPG - Level Up Manager
// Gerencia a visualização das informações de Level Up e Classes
// =========================

class LevelUpManager {
  constructor(container) {
    this.container = container;
    this.rulebookData = null;
    this.currentView = 'levelup'; // 'levelup' ou 'class'
    this.selectedClass = null;
    
    // Bind dos métodos
    this.render = this.render.bind(this);
    this.loadRulebookData = this.loadRulebookData.bind(this);
    this.renderLevelUpInfo = this.renderLevelUpInfo.bind(this);
    this.renderClassList = this.renderClassList.bind(this);
    this.renderClassDetails = this.renderClassDetails.bind(this);
    this.handleClassClick = this.handleClassClick.bind(this);
    this.handleBackClick = this.handleBackClick.bind(this);
  }

  async loadRulebookData() {
    try {
      const response = await fetch('../data/rulebook/01-fundamentos.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Buscar também o arquivo de classes
      const classesResponse = await fetch('../data/rulebook/07-classes.json');
      if (classesResponse.ok) {
        const classesData = await classesResponse.json();
        this.classesData = classesData;
      }
      
      this.rulebookData = data;
      return data;
    } catch (error) {
      console.error('Erro ao carregar dados do rulebook:', error);
      this.renderError('Não foi possível carregar as informações de Level Up.');
      return null;
    }
  }

  async render() {
    if (!this.container) return;
    
    // Mostra loading
    this.container.innerHTML = `
      <div class="levelup-loading">
        <p>Carregando informações de evolução...</p>
        <div class="loading-spinner"></div>
      </div>
    `;
    
    await this.loadRulebookData();
    
    if (this.currentView === 'levelup') {
      this.renderLevelUpInfo();
    } else if (this.currentView === 'class' && this.selectedClass) {
      this.renderClassDetails(this.selectedClass);
    }
  }

  renderLevelUpInfo() {
    if (!this.container || !this.rulebookData) return;
    
    // Encontrar a seção de Nível e Experiência
    const fundamentalsSection = this.rulebookData.sections?.find(
      section => section.topic_id === 'nivel-e-experiencia'
    );
    
    if (!fundamentalsSection) {
      this.container.innerHTML = `
        <div class="levelup-error">
          <p>Informações de Level Up não encontradas.</p>
          <button class="levelup-back-button">Voltar</button>
        </div>
      `;
      return;
    }
    
    // Encontrar o item com id "lvlup_item"
    const lvlupContent = fundamentalsSection.content?.find(
      item => item.id === 'lvlup_item'
    );
    
    // Construir HTML
    let html = `
      <div class="levelup-container">
        <h2 class="levelup-title"> Level Up </h2>
        <h3 class="levelup-subtitle">${fundamentalsSection.title}</h3>
    `;
    
    // Renderizar lista de regras de level up
    if (lvlupContent && lvlupContent.type === 'list') {
      html += `
        <div class="levelup-rules">
          <ul class="levelup-list">
            ${lvlupContent.items.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    // Adicionar texto explicativo sobre classes
    html += `
      <div class="levelup-classes-intro">
        <p class="classes-intro-text">As opções de Classe e suas características são:</p>
      </div>
      
      <div class="levelup-classes-grid" id="classes-grid">
        <!-- Grid será preenchido via JavaScript -->
      </div>
    `;
    
    this.container.innerHTML = html;
    
    // Agora carregar e renderizar as classes
    this.renderClassList();
  }

  renderClassList() {
    if (!this.classesData) {
      // Tentar carregar classes novamente
      fetch('../data/rulebook/07-classes.json')
        .then(response => response.json())
        .then(data => {
          this.classesData = data;
          this.populateClassesGrid();
        })
        .catch(error => {
          console.error('Erro ao carregar classes:', error);
          const grid = document.getElementById('classes-grid');
          if (grid) {
            grid.innerHTML = '<p class="error-message">Não foi possível carregar as classes.</p>';
          }
        });
    } else {
      this.populateClassesGrid();
    }
  }

  populateClassesGrid() {
    const grid = document.getElementById('classes-grid');
    if (!grid || !this.classesData) return;
    
    // Filtrar apenas as seções que são classes (excluir "O que são Classes")
    const classes = this.classesData.sections?.filter(section => 
      section.topic_id && section.topic_id !== 'o-que-sao-classes'
    ) || [];
    
    let buttonsHtml = '';
    classes.forEach(classSection => {
      // Encontrar o item com classes_item para pegar o nome formatado
      const classTitleItem = classSection.content?.find(
        item => item.classes_item
      );
      
      const displayName = classTitleItem ? classTitleItem.classes_item : classSection.title;
      
      buttonsHtml += `
        <button class="class-card" data-class-id="${classSection.topic_id}">
          <span class="class-name">${displayName}</span>
        </button>
      `;
    });
    
    grid.innerHTML = buttonsHtml;
    
    // Adicionar event listeners aos botões
    grid.querySelectorAll('.class-card').forEach(button => {
      button.addEventListener('click', () => {
        const classId = button.dataset.classId;
        this.handleClassClick(classId);
      });
    });
  }

  handleClassClick(classId) {
    if (!this.classesData) return;
    
    const selectedClass = this.classesData.sections?.find(
      section => section.topic_id === classId
    );
    
    if (selectedClass) {
      this.currentView = 'class';
      this.selectedClass = selectedClass;
      this.renderClassDetails(selectedClass);
    }
  }

  renderClassDetails(classData) {
    if (!this.container) return;
    
    // Encontrar o título da classe (item com classes_item)
    const classTitleItem = classData.content?.find(
      item => item.classes_item
    );
    
    const className = classTitleItem ? classTitleItem.classes_item : classData.title;
    
    // Filtrar apenas os itens com id "classes_item" que são as características
    const classFeatures = classData.content?.filter(
      item => item.id === 'classes_item' && !item.classes_item // Excluir o título
    ) || [];
    
    let html = `
      <div class="class-details-container">
        <button class="class-back-button" id="class-back-button">
          ← Voltar para Level Up
        </button>
        
        <div class="class-header">
          <h2 class="class-title">${className}</h2>
        </div>
        
        <div class="class-features">
    `;
    
    classFeatures.forEach(feature => {
      html += `
        <div class="class-feature">
          <p class="feature-text">${feature.text}</p>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
    
    this.container.innerHTML = html;
    
    // Adicionar event listener para o botão voltar
    const backButton = document.getElementById('class-back-button');
    if (backButton) {
      backButton.addEventListener('click', this.handleBackClick);
    }
  }

  handleBackClick() {
    this.currentView = 'levelup';
    this.selectedClass = null;
    this.renderLevelUpInfo();
  }

  renderError(message) {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="levelup-error">
        <p>${message}</p>
        <button class="levelup-retry-button">Tentar novamente</button>
      </div>
    `;
    
    const retryButton = this.container.querySelector('.levelup-retry-button');
    if (retryButton) {
      retryButton.addEventListener('click', () => this.render());
    }
  }
}

export default LevelUpManager;