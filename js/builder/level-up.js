// =========================
// Maeri RPG - Level Up Manager
// Gerencia a visualização das informações de Level Up e Classes
// =========================

class LevelUpManager {
  constructor(container) {
    this.container = container;
    this.rulebookData = null;
    this.currentView = 'levelup';
    this.selectedClass = null;
    
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
      this.rulebookData = await response.json();
      
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

  async render() {
    if (!this.container) return;
    
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
    
    let html = `
      <div class="levelup-container">
        <h2 class="levelup-title">⚡ Level Up ⚡</h2>
        <h3 class="levelup-subtitle">${fundamentalsSection.title}</h3>
    `;
    
    if (lvlupContent?.type === 'list') {
      html += `
        <div class="levelup-rules-container">
          <div class="levelup-rules">
            <ul class="levelup-list">
              ${lvlupContent.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    }
    
    html += `
      <div class="levelup-classes-intro">
        <p class="classes-intro-text">As opções de Classe e suas características são:</p>
      </div>
      <div class="levelup-classes-grid" id="classes-grid"></div>
    `;
    
    this.container.innerHTML = html;
    this.renderClassList();
  }

  renderClassList() {
    const loadClasses = () => {
      if (this.classesData) {
        this.populateClassesGrid();
      } else {
        const grid = document.getElementById('classes-grid');
        if (grid) {
          grid.innerHTML = '<p class="error-message">Nenhuma classe encontrada.</p>';
        }
      }
    };

    if (!this.classesData) {
      fetch('../data/rulebook/07-classes.json')
        .then(response => response.json())
        .then(data => {
          this.classesData = data;
          loadClasses();
        })
        .catch(() => {
          const grid = document.getElementById('classes-grid');
          if (grid) {
            grid.innerHTML = '<p class="error-message">Não foi possível carregar as classes.</p>';
          }
        });
    } else {
      loadClasses();
    }
  }

  populateClassesGrid() {
    const grid = document.getElementById('classes-grid');
    if (!grid || !this.classesData?.sections) return;
    
    const classes = this.classesData.sections.filter(section => 
      section.topic_id && section.topic_id !== 'o-que-sao-classes'
    );
    
    const buttonsHtml = classes.map(classSection => {
      const classTitleItem = classSection.content?.find(item => item.classes_item);
      const displayName = classTitleItem ? classTitleItem.classes_item : classSection.title;
      
      return `
        <button class="class-card" data-class-id="${classSection.topic_id}">
          <span class="class-name">${displayName}</span>
        </button>
      `;
    }).join('');
    
    grid.innerHTML = buttonsHtml;
    
    grid.querySelectorAll('.class-card').forEach(button => {
      button.addEventListener('click', () => {
        this.handleClassClick(button.dataset.classId);
      });
    });
  }

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

  renderClassDetails(classData) {
    if (!this.container) return;
    
    const classTitleItem = classData.content?.find(item => item.classes_item);
    const className = classTitleItem ? classTitleItem.classes_item : classData.title;
    
    const classFeatures = classData.content?.filter(
      item => item.id === 'classes_item' && !item.classes_item
    ) || [];
    
    const featuresHtml = classFeatures.map(feature => `
      <div class="class-feature">
        <p class="feature-text">${feature.text}</p>
      </div>
    `).join('');
    
    const html = `
      <div class="class-details-container">
        <button class="class-back-button" id="class-back-button">
          ← Voltar para Level Up
        </button>
        <div class="class-header">
          <h2 class="class-title">${className}</h2>
        </div>
        <div class="class-features-container">
          <div class="class-features">
            ${featuresHtml || '<p class="error-message">Nenhuma característica encontrada.</p>'}
          </div>
        </div>
      </div>
    `;
    
    this.container.innerHTML = html;
    
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

  showError(message) {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="levelup-error">
        <p>${message}</p>
        <button class="levelup-back-button" onclick="window.playerManager?.renderLevelUpInfo()">Voltar</button>
      </div>
    `;
  }
}

export default LevelUpManager;