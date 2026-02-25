// =========================
// Maeri RPG - Builder Module
// Gerencia a página Área do Jogador
// =========================

class PlayerAreaManager {
  constructor() {
    this.tabButtons = document.querySelectorAll('.tab-button');
    this.tabPanels = document.querySelectorAll('.tab-panel');
    this.builderSteps = document.querySelectorAll('.builder-step');
    this.builderPreview = document.querySelector('.builder-preview');
    this.charCards = document.querySelectorAll('.char-card');
    this.charsCounter = document.querySelector('.chars-counter');
    
    this.init();
  }

  init() {
    this.setupTabs();
    this.setupBuilderSteps();
    this.setupCharCards();
    this.updateCharsCounter();
  }

  // ===== SISTEMA DE ABAS =====
  setupTabs() {
    this.tabButtons.forEach(button => {
      button.addEventListener('click', () => this.switchTab(button.id));
    });
  }

  switchTab(selectedId) {
    // Atualiza botões
    this.tabButtons.forEach(button => {
      const isSelected = button.id === selectedId;
      button.classList.toggle('active', isSelected);
      button.setAttribute('aria-selected', isSelected);
    });

    // Atualiza painéis
    this.tabPanels.forEach(panel => {
      const isActive = panel.id === selectedId.replace('tab-', '') + '-panel';
      panel.classList.toggle('active', isActive);
    });
  }

  // ===== CONSTRUTOR =====
  setupBuilderSteps() {
    this.builderSteps.forEach(step => {
      step.addEventListener('click', () => this.handleBuilderStep(step));
    });
  }

  handleBuilderStep(step) {
    const stepNum = step.dataset.step;
    
    // Remove active de todos os steps
    this.builderSteps.forEach(s => s.classList.remove('active'));
    
    // Adiciona active no step selecionado
    step.classList.add('active');
    
    if (stepNum === '1') {
      this.renderMentalidadeStep();
    } else {
      // Para as outras etapas, mostra apenas placeholder
      this.renderPlaceholder(stepNum);
    }
  }

  renderMentalidadeStep() {
    if (!this.builderPreview) return;
    
    this.builderPreview.innerHTML = `
      <div class="mentalidade-container">
        <p class="mentalidade-intro">Escolha uma Mentalidade.</p>
        
        <div class="mentalidade-table-container">
          <table class="mentalidade-table">
            <thead>
              <tr>
                <th>Mentalidade</th>
                <th>CF</th>
                <th>CM</th>
                <th>Aspectos</th>
                <th>Vit</th>
                <th>Con</th>
              </tr>
            </thead>
            <tbody id="mentalidade-table-body">
              <tr>
                <td colspan="6" class="loading-row">Carregando mentalidades...</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mentalidade-info">
          <p>Em seguida, distribua em CF (F, V, D) e CM (S, I, A) os bônus de acordo com a Mentalidade escolhida, lembrando que cada personagem já começa com 2 em cada característica básica.</p>
          
          <p>Em seguida, defina Vit e Con de acordo com as suas fórmulas:</p>
          
          <div class="formulas">
            <p><strong>Vit = F + V + Mentalidade</strong></p>
            <p><strong>Con = S + I + Mentalidade</strong></p>
          </div>
          
          <p>Aspectos são usados para adquirir um Estudo, uma Técnica Marcial ou um Estudo Mágico, que poderão ser escolhidos na Etapa 2.</p>
        </div>
      </div>
    `;
    
    // Carrega os dados da tabela
    this.loadMentalidadeData();
  }

  async loadMentalidadeData() {
    try {
      const response = await fetch('../../data/rulebook/01-fundamentos.json');
      const data = await response.json();
      
      // Encontra a seção de mentalidade
      const mentalidadeSection = data.sections.find(s => s.id === 'mentalidade');
      const tableData = mentalidadeSection.content.find(c => c.type === 'table');
      
      this.renderMentalidadeTable(tableData);
    } catch (error) {
      console.error('Erro ao carregar dados de mentalidade:', error);
      const tbody = document.getElementById('mentalidade-table-body');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" class="error-row">Erro ao carregar dados</td></tr>';
      }
    }
  }

  renderMentalidadeTable(tableData) {
    const tbody = document.getElementById('mentalidade-table-body');
    if (!tbody) return;
    
    let html = '';
    tableData.rows.forEach(row => {
      html += `
        <tr class="mentalidade-row">
          <td><strong>${row[0]}</strong></td>
          <td>${row[1]}</td>
          <td>${row[2]}</td>
          <td>${row[3]}</td>
          <td>${row[4]}</td>
          <td>${row[5]}</td>
        </tr>
      `;
    });
    
    tbody.innerHTML = html;
  }

  renderPlaceholder(stepNum) {
    if (!this.builderPreview) return;
    
    const titles = {
      '2': 'Complementos',
      '3': 'Narrativa',
      '4': 'Inventário'
    };
    
    this.builderPreview.innerHTML = `
      <div class="placeholder-container">
        <p class="placeholder-text">Etapa ${stepNum} - ${titles[stepNum]} (em desenvolvimento)</p>
      </div>
    `;
  }

  // ===== PERSONAGENS =====
  setupCharCards() {
    this.charCards.forEach(card => {
      card.addEventListener('click', () => this.handleCharCard(card));
    });
  }

  handleCharCard(card) {
    if (card.classList.contains('char-card--empty')) {
      console.log('Criar novo personagem');
    } else {
      card.classList.add('selected');
      setTimeout(() => card.classList.remove('selected'), 200);
    }
  }

  updateCharsCounter() {
    if (!this.charsCounter) return;
    
    const savedChars = document.querySelectorAll('.saved-chars .char-card:not(.char-card--empty)');
    this.charsCounter.textContent = `${savedChars.length}/3`;
  }
}

// ===== INICIALIZAÇÃO =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PlayerAreaManager();
  });
} else {
  new PlayerAreaManager();
}

export default PlayerAreaManager;