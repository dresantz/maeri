// =========================
// Maeri RPG - Builder Module
// Gerencia a página Área do Jogador e coordena as etapas
// =========================

import MentalidadeManager from './e1-mentalidade.js';
import ComplementosManager from './e2-complementos.js';
import NarrativaManager from './e3-narrativa.js';
import InventarioManager from './e4-inventario.js';

class PlayerAreaManager {
  constructor() {
    this.tabButtons = document.querySelectorAll('.tab-button');
    this.tabPanels = document.querySelectorAll('.tab-panel');
    this.builderSteps = document.querySelectorAll('.builder-step');
    this.builderPreview = document.querySelector('.builder-preview');
    this.charCards = document.querySelectorAll('.char-card');
    this.charsCounter = document.querySelector('.chars-counter');
    
    // Managers das etapas
    this.mentalidadeManager = new MentalidadeManager(this.builderPreview);
    this.complementosManager = new ComplementosManager(this.builderPreview);
    this.narrativaManager = new NarrativaManager(this.builderPreview);
    this.inventarioManager = new InventarioManager(this.builderPreview);
    
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
    
    // Renderiza a etapa apropriada
    this.renderStep(stepNum);
  }

  renderStep(stepNum) {
    switch(stepNum) {
      case '1':
        this.mentalidadeManager.render();
        break;
      case '2':
        this.complementosManager.render();
        break;
      case '3':
        this.narrativaManager.render();
        break;
      case '4':
        this.inventarioManager.render();
        break;
      default:
        this.renderPlaceholder(stepNum, 'Em desenvolvimento');
    }
  }

  renderPlaceholder(stepNum, title) {
    if (!this.builderPreview) return;
    
    this.builderPreview.innerHTML = `
      <div class="placeholder-container">
        <p class="placeholder-text">Etapa ${stepNum} - ${title} (em desenvolvimento)</p>
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