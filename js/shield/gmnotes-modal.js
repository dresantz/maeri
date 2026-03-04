// js/shield/gmnotes-modal.js
import { loadGMNotesModal } from './gmnotes-loader.js';
import { GMPlayers } from './gm-players.js';
import { GMNPCs } from './gm-npcs.js';
import { GMCombat } from './gm-combat.js';
import { GMSectionNotes } from './gm-sectionNotes.js';

class GMNotesModal {
  constructor() {
    // Elementos DOM
    this.modal = null;
    this.btn = document.getElementById('gmnotes-button');
    
    // Estado
    this.currentTab = 'npcs';
    this.focusableElements = null;
    this.previouslyFocused = null;
    
    // Inicializa módulos com referência à instância principal
    this.players = new GMPlayers(this);
    this.npcs = new GMNPCs(this);
    this.combat = new GMCombat(this);
    this.notes = new GMSectionNotes(this);
    
    this.init();
  }

  async init() {
    await loadGMNotesModal();
    this.cacheElements();
    this.setupEventListeners();
    this.setupTabs();
    this.setupFocusTrap();
    this.initializeModules();
    this.loadFromStorage();
    this.setInert(true);
  }

  cacheElements() {
    this.modal = document.getElementById('gmnotes-modal');
    this.closeBtn = document.getElementById('gmnotes-modal-close');
    this.doneBtn = document.getElementById('gmnotes-done');
    this.exportBtn = document.getElementById('gmnotes-export');
    this.importBtn = document.getElementById('gmnotes-import');
    this.tabBtns = document.querySelectorAll('.gmnotes-tab-btn');
    this.tabPanes = document.querySelectorAll('.gmnotes-tab-pane');
  }

  initializeModules() {
    this.players.init();
    this.npcs.init();
    this.combat.init();
    this.notes.init();
    
    this.players.renderPlayers();
    this.npcs.renderNPCs();
    this.combat.renderCombatOrder();
    this.notes.renderSessions();
  }

  setupFocusTrap() {
    if (!this.modal) return;
    
    this.focusableElements = this.modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
  }

  setInert(isInert) {
    if (!this.modal) return;
    
    if (isInert) {
      this.modal.setAttribute('inert', '');
      this.modal.setAttribute('aria-hidden', 'true');
    } else {
      this.modal.removeAttribute('inert');
      this.modal.setAttribute('aria-hidden', 'false');
    }
  }

  setupEventListeners() {
    if (!this.btn || !this.modal) return;

    // Abrir/fechar
    this.btn.addEventListener('click', () => this.open());
    
    [this.closeBtn, this.doneBtn].forEach(btn => {
      if (btn) btn.addEventListener('click', () => this.close());
    });

    // Exportação/Importação
    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => this.exportData());
    }
    
    if (this.importBtn) {
      this.importBtn.addEventListener('click', () => this.importData());
    }

    // Eventos globais
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.modal.addEventListener('click', this.handleModalClick.bind(this));
  }

  handleKeyDown(e) {
    if (!this.modal?.classList.contains('active')) return;

    if (e.key === 'Escape') {
      this.close();
    }
    
    if (e.key === 'Tab') {
      this.trapFocus(e);
    }
  }

  handleModalClick(e) {
    if (e.target === this.modal) {
      this.close();
    }
  }

  trapFocus(e) {
    if (!this.focusableElements?.length) return;
    
    const first = this.focusableElements[0];
    const last = this.focusableElements[this.focusableElements.length - 1];
    
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  open() {
    this.previouslyFocused = document.activeElement;
    
    this.modal.classList.add('active');
    this.setInert(false);
    this.btn?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    
    // Foca no primeiro elemento após animação
    setTimeout(() => {
      if (this.focusableElements?.length) {
        this.focusableElements[0].focus();
      }
    }, 100);
  }

  close() {
    this.modal.classList.remove('active');
    this.setInert(true);
    this.btn?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    
    this.previouslyFocused?.focus();
  }

  setupTabs() {
    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab) this.switchTab(tab);
      });
    });
  }

  switchTab(tabId) {
    this.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    this.tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabId}`);
    });

    this.currentTab = tabId;
  }

  // ========== MÉTODOS DELEGADOS ==========
  // NPCs
  adjustVit(npcId, change) { this.npcs.adjustVit(npcId, change); }
  adjustCon(npcId, change) { this.npcs.adjustCon(npcId, change); }
  editNPC(npcId) { this.npcs.editNPC(npcId); }
  duplicateNPC(npcId) { this.npcs.duplicateNPC(npcId); }
  deleteNPC(npcId) { this.npcs.deleteNPC(npcId); }
  toggleNPCInCombat(npcId, btnElement) { this.combat.toggleNPCInCombat(npcId, btnElement); }

  // Players
  editPlayer(playerId) { this.players.editPlayer(playerId); }
  deletePlayer(playerId) { this.players.deletePlayer(playerId); }
  togglePlayerInCombat(playerId, btnElement) { this.combat.togglePlayerInCombat(playerId, btnElement); }

  // Combat
  adjustCombatVit(combatId, change) { this.combat.adjustCombatVit(combatId, change); }
  adjustCombatCon(combatId, change) { this.combat.adjustCombatCon(combatId, change); }
  updateCombatInitiative(combatId, value) { this.combat.updateCombatInitiative(combatId, value); }
  updateCombatCondition(combatId, condition) { this.combat.updateCombatCondition(combatId, condition); }

  // ========== EXPORTAÇÃO/IMPORTAÇÃO ==========
  exportData() {
    const data = {
      npcs: this.npcs.getData(),
      players: this.players.getData(),
      combatOrder: this.combat.getData(),
      ...this.notes.getData(),
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gmnotes-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.updateStatus('Dados exportados!');
  }

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          
          if (confirm('Isso substituirá todos os dados atuais. Continuar?')) {
            this.loadData(data);
            this.updateStatus('Dados importados com sucesso!');
          }
        } catch (error) {
          alert(`Erro ao importar arquivo: ${error.message}`);
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  }

  loadData(data) {
    this.npcs.loadFromStorage(data);
    this.players.loadFromStorage(data);
    this.combat.loadFromStorage(data);
    this.notes.loadFromStorage(data);
    
    this.npcs.renderNPCs();
    this.players.renderPlayers();
    this.combat.renderCombatOrder();
    this.notes.renderSessions();
    
    this.saveToStorage();
  }

  // ========== ARMAZENAMENTO ==========
  saveToStorage() {
    const data = {
      npcs: this.npcs.getData(),
      players: this.players.getData(),
      combatOrder: this.combat.getData(),
      ...this.notes.getData()
    };
    
    localStorage.setItem('gmnotes_data', JSON.stringify(data));
    this.updateSaveIndicator();
  }

  loadFromStorage() {
    const saved = localStorage.getItem('gmnotes_data');
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      this.npcs.loadFromStorage(data);
      this.players.loadFromStorage(data);
      this.combat.loadFromStorage(data);
      this.notes.loadFromStorage(data);
      
      // Pequeno delay para garantir renderização após carregamento
      setTimeout(() => this.combat.renderCombatOrder(), 50);
    } catch (error) {
      console.error('Erro ao carregar dados salvos:', error);
    }
  }

  updateSaveIndicator() {
    const indicator = document.querySelector('.gmnotes-save-indicator');
    if (!indicator) return;
    
    indicator.textContent = '💾 Salvo';
    setTimeout(() => {
      indicator.textContent = '💾 Salvo';
    }, 2000);
  }

  // ========== UTILITÁRIOS ==========
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  updateStatus(message) {
    const status = document.getElementById('gmnotes-status');
    if (!status) return;
    
    status.textContent = message;
    setTimeout(() => {
      status.textContent = 'Pronto';
    }, 3000);
  }
}

// Inicializa e expõe globalmente
const gmNotes = new GMNotesModal();
window.gmNotes = gmNotes;