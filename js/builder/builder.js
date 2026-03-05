// =========================
// Maeri RPG - Builder Module
// Gerencia a página Área do Jogador e coordena as etapas
// =========================

import MentalidadeManager from './e1-mentalidade.js';
import ComplementosManager from './e2-complementos.js';
import NarrativaManager from './e3-narrativa.js';
import InventarioManager from './e4-inventario.js';
import LevelUpManager from './level-up.js';
import PlayerCharManager from './player-char.js';

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
    this.levelUpManager = new LevelUpManager(this.builderPreview);
    this.playerCharManager = new PlayerCharManager();

    // Validar elementos críticos
    if (!this.builderPreview) {
      console.warn('PlayerAreaManager: builderPreview não encontrado');
    }
    
    if (!this.tabButtons.length) {
      console.warn('PlayerAreaManager: Nenhum botão de aba encontrado');
    }

    this.state = {
      currentTab: 'builder',
      currentStep: null,
      characterInProgress: null
    };
    
    this.init();
  }

  init() {
    this.setupTabs();
    this.setupBuilderSteps();
  }

  // ===== SISTEMA DE ABAS =====
  setupTabs() {
    // Guardar referências para poder remover depois se necessário
    this.tabClickHandlers = new Map();
    
    this.tabButtons.forEach(button => {
      const handler = () => this.switchTab(button.id);
      this.tabClickHandlers.set(button, handler);
      button.addEventListener('click', handler);
    });
  }

  // Método para cleanup (útil se a página for SPA)
  destroy() {
    this.tabButtons.forEach(button => {
      const handler = this.tabClickHandlers.get(button);
      if (handler) {
        button.removeEventListener('click', handler);
      }
    });
    // Remover outros listeners...
  }

  switchTab(selectedId) {
    // Validar se selectedId é válido
    if (!selectedId) return;
    
    // Atualiza botões
    this.tabButtons.forEach(button => {
      const isSelected = button.id === selectedId;
      button.classList.toggle('active', isSelected);
      button.setAttribute('aria-selected', isSelected);
    });

    // Atualiza painéis
    this.tabPanels.forEach(panel => {
      const expectedPanelId = selectedId.replace('tab-', '') + '-panel';
      const isActive = panel.id === expectedPanelId;
      panel.classList.toggle('active', isActive);
      
      if (isActive && panel.id === 'chars-panel') {
        // Verificar se playerCharManager existe antes de chamar
        if (this.playerCharManager) {
          this.playerCharManager.loadCharacters();
        } else {
          console.warn('playerCharManager não inicializado');
        }
      }
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

    // Feedback visual imediato
    step.style.transform = 'scale(0.95)';
    setTimeout(() => {
      step.style.transform = '';
    }, 100);

    // Atualizar estado
    this.state.currentStep = stepNum;

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
      case 'levelup':
        this.levelUpManager.render();
        break;
      default:
        this.renderPlaceholder(stepNum, 'Em desenvolvimento');
    }
  }

  renderPlaceholder(stepNum, title) {
    if (!this.builderPreview) return;
    
    // Evitar recriação desnecessária do DOM
    const existingPlaceholder = this.builderPreview.querySelector('.placeholder-container');
    
    if (existingPlaceholder) {
      const textEl = existingPlaceholder.querySelector('.placeholder-text');
      if (textEl) {
        textEl.textContent = `Etapa ${stepNum} - ${title} (em desenvolvimento)`;
      }
    } else {
      this.builderPreview.innerHTML = `
        <div class="placeholder-container">
          <p class="placeholder-text">Etapa ${stepNum} - ${title} (em desenvolvimento)</p>
        </div>
      `;
    }
  }
}

// ===== INICIALIZAÇÃO =====
let instance = null;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!instance) {
      instance = new PlayerAreaManager();
    }
  });
} else {
  if (!instance) {
    instance = new PlayerAreaManager();
  }
}

export default PlayerAreaManager;