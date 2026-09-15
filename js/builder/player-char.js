// js/builder/player-char.js
// =========================
// Maeri RPG - Player Character Manager
// =========================

import templateList from './template-list.js';
import templateManager from './template-manager.js';

// ========== Constantes ==========
const STORAGE_KEYS = {
  CHARACTERS: 'maeri-characters',
  ACTIVE_CHARACTER: 'maeri-active-character',
  SHEET: 'maeri-sheet'
};

const MAX_CHARACTERS = 3;

// ========== DialogSystem ==========
class DialogSystem {
  constructor() {
    this.activeDialog = null;
    this.escHandler = null;
  }

  show({ title, message, buttons }) {
    this.close();

    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'dialog-box';

    const buttonsHtml = buttons
      .map(btn => `<button class="dialog-button ${btn.class || ''}">${btn.text}</button>`)
      .join('');

    dialog.innerHTML = `
      <h3 class="dialog-title">${title}</h3>
      <p class="dialog-message">${message}</p>
      <div class="dialog-actions">${buttonsHtml}</div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    this.activeDialog = overlay;

    const dialogButtons = dialog.querySelectorAll('.dialog-button');
    buttons.forEach((btn, index) => {
      dialogButtons[index].addEventListener('click', (e) => {
        e.preventDefault();
        if (btn.handler) btn.handler();
        this.close();
      });
    });

    this.escHandler = (e) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this.escHandler);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });
  }

  close() {
    if (this.activeDialog) {
      document.body.removeChild(this.activeDialog);
      this.activeDialog = null;
    }
    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
      this.escHandler = null;
    }
  }
}

// ========== ToastSystem ==========
class ToastSystem {
  constructor() {
    this.container = document.querySelector('.global-toast');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'global-toast';
      document.body.appendChild(this.container);
    }
    this.timeout = null;
  }

  show(message, type = 'success', duration = 3000) {
    if (this.timeout) clearTimeout(this.timeout);

    this.container.textContent = message;
    this.container.className = `global-toast global-toast--${type}`;
    this.container.classList.add('show');

    this.timeout = setTimeout(() => {
      this.container.classList.remove('show');
    }, duration);
  }

  success(message) { this.show(message, 'success'); }
  error(message)   { this.show(message, 'error', 4000); }
  warning(message) { this.show(message, 'warning', 4000); }
}

// ========== PlayerCharManager ==========
class PlayerCharManager {
  constructor() {
    this.charsCounter = document.querySelector('.chars-counter');
    this.savedCharsGrid = document.querySelector('.saved-chars');
    this.readyCharsGrid = document.querySelector('.ready-chars');

    this.characters = {};
    this.activeCharacterId = localStorage.getItem(STORAGE_KEYS.ACTIVE_CHARACTER);

    this.dialog = new DialogSystem();
    this.toast = new ToastSystem();

    // Handlers vinculados (para poder remover depois)
    this.boundStorageHandler = this.handleStorageChange.bind(this);
    this.boundCharactersUpdatedHandler = this.handleCharactersUpdated.bind(this);
    this.boundReadyCharClickHandler = this.handleReadyCharClick.bind(this);

    this.loadCharactersDebounced = this.debounce(this.loadCharacters.bind(this), 100);

    this.init();
  }

  // ========== Utilitários ==========
  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  generateCharacterId() {
    return 'char_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1)    return 'agora mesmo';
    if (diffMins < 60)   return `${diffMins} min atrás`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} h atrás`;
    return date.toLocaleDateString('pt-BR');
  }

  // ========== Validação ==========
  canCreateNewCharacter() {
    return Object.keys(this.characters).length < MAX_CHARACTERS;
  }

  validateCharacter(character) {
    if (!character?.id || !character.name || !character.lastModified || !character.data) {
      return false;
    }
    return true;
  }

  // ========== UI — helpers ==========
  showLoading(show) {
    if (!this.savedCharsGrid) return;
    this.savedCharsGrid.style.opacity = show ? '0.5' : '1';
    this.savedCharsGrid.style.pointerEvents = show ? 'none' : 'auto';
  }

  openSheet() {
    if (window.SheetManager && typeof window.SheetManager.open === 'function') {
      window.SheetManager.open();
    } else {
      document.getElementById('sheet-button')?.click();
    }
  }

  clearSheetFields() {
    if (window.SheetManager && typeof window.SheetManager.clear === 'function') {
      window.SheetManager.clear();
      return;
    }

    const modal = document.getElementById('sheet-modal');
    if (!modal) return;

    const inputs = modal.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      if (input.type === 'number') {
        if (input.id.startsWith('attr-')) {
          input.value = '2';
        } else if (input.id === 'char-level') {
          input.value = '1';
        } else {
          input.value = '0';
        }
      } else {
        input.value = '';
      }
    });
  }

  // ========== Persistência ==========
  saveCharacters() {
    try {
      localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(this.characters));
      window.dispatchEvent(new CustomEvent('characters-updated'));
      return true;
    } catch (e) {
      console.error('Erro ao salvar personagens:', e);
      this.toast.error('Erro ao salvar personagens');
      return false;
    }
  }

  setActiveCharacter(characterId) {
    try {
      if (characterId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_CHARACTER, characterId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHARACTER);
      }
      this.activeCharacterId = characterId;
      return true;
    } catch (e) {
      console.error('Erro ao definir personagem ativo:', e);
      return false;
    }
  }

  saveSheet(data) {
    try {
      localStorage.setItem(STORAGE_KEYS.SHEET, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Erro ao salvar ficha:', e);
      return false;
    }
  }

  // ========== Ciclo de vida ==========
  init() {
    this.loadCharacters();
    this.setupEventListeners();
    this.renderReadyTemplates();
  }

  setupEventListeners() {
    window.addEventListener('characters-updated', this.boundCharactersUpdatedHandler);
    window.addEventListener('storage', this.boundStorageHandler);
  }

  destroy() {
    window.removeEventListener('characters-updated', this.boundCharactersUpdatedHandler);
    window.removeEventListener('storage', this.boundStorageHandler);

    if (this.readyCharsGrid) {
      const readyCards = this.readyCharsGrid.querySelectorAll('.char-card--ready');
      readyCards.forEach(card =>
        card.removeEventListener('click', this.boundReadyCharClickHandler)
      );
    }
  }

  // ========== Templates prontos ==========
  async renderReadyTemplates() {
    if (!this.readyCharsGrid) return;
    await templateList.renderCards(this.readyCharsGrid, templateManager);
    this.setupReadyChars();
  }

  setupReadyChars() {
    if (!this.readyCharsGrid) return;

    const readyCards = this.readyCharsGrid.querySelectorAll('.char-card--ready');
    readyCards.forEach((card) => {
      if (!card.dataset.templateFile || !card.dataset.char) return;
      card.removeEventListener('click', this.boundReadyCharClickHandler);
      card.addEventListener('click', this.boundReadyCharClickHandler);
    });
  }

  async handleReadyCharClick(event) {
    const card = event.currentTarget;
    const templateFile = card?.dataset?.templateFile;
    const baseId = card?.dataset?.char;

    if (!templateFile || !baseId) {
      this.showError('Personagem não identificado');
      return;
    }

    if (!this.canCreateNewCharacter()) {
      this.showAreaCheiaDialog();
      return;
    }

    try {
      this.showLoading(true);
      const template = await templateManager.loadTemplate(templateFile);
      if (!template) throw new Error('Template não encontrado');

      this.showLoading(false);
      this.showTemplatePreview(template, templateFile, baseId);
    } catch (error) {
      this.showLoading(false);
      console.error('Erro ao carregar template:', error);
      this.showError('Erro ao carregar personagem pronto');
    }
  }

  showTemplatePreview(template, templateFile, baseId) {
    this.dialog.show({
      title: `Copiar ${template.name}`,
      message: `
        <div class="template-preview">
          <p><strong>Classe:</strong> ${template.class || ''}</p>
          <p><strong>Nível:</strong> ${template.level || '?'}</p>
          <p><strong>Descrição:</strong> ${template.description || ''}</p>
          <hr><p>Deseja copiar este personagem para um slot vazio?</p>
        </div>
      `,
      buttons: [
        {
          text: 'Copiar',
          class: 'dialog-button--save',
          handler: () => this.copyReadyCharacter(template, templateFile, baseId)
        },
        {
          text: 'Cancelar',
          class: 'dialog-button--cancel'
        }
      ]
    });
  }

  copyReadyCharacter(template, templateFile, baseId) {
    const characterId = this.generateCharacterId();
    const sheetData = templateManager.templateToSheetData(template);

    const newCharacter = {
      id: characterId,
      name: template.name,
      lastModified: new Date().toISOString(),
      data: sheetData,
      template: { file: templateFile, id: baseId }
    };

    this.characters[characterId] = newCharacter;

    if (!this.saveCharacters()) return;

    this.renderCharacterCards();
    this.updateCharsCounter();

    this.dialog.show({
      title: 'Template Copiado',
      message: `"${template.name}" foi adicionado aos seus personagens. Deseja abri-lo agora?`,
      buttons: [
        {
          text: 'Abrir Ficha',
          class: 'dialog-button--save',
          handler: () => {
            this.loadCharacterToSheet(characterId);
            this.openSheet();
          }
        },
        {
          text: 'Ficar na Área',
          class: 'dialog-button--cancel'
        }
      ]
    });
  }

  // ========== Event handlers (storage / custom) ==========
  handleCharactersUpdated() {
    this.loadCharactersDebounced();
  }

  handleStorageChange(e) {
    if (e.key === STORAGE_KEYS.CHARACTERS || e.key === STORAGE_KEYS.ACTIVE_CHARACTER) {
      this.loadCharactersDebounced();
    }
  }

  // ========== Carregamento ==========
  loadCharacters() {
    const saved = localStorage.getItem(STORAGE_KEYS.CHARACTERS);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.characters = {};

        Object.entries(parsed).forEach(([id, char]) => {
          if (this.validateCharacter(char)) this.characters[id] = char;
        });
      } catch (e) {
        console.error('Erro ao carregar personagens:', e);
        this.characters = {};
      }
    } else {
      this.characters = {};
    }

    this.activeCharacterId = localStorage.getItem(STORAGE_KEYS.ACTIVE_CHARACTER);
    this.renderCharacterCards();
    this.updateCharsCounter();
  }

  // ========== Renderização de cards ==========
  renderCharacterCards() {
    if (!this.savedCharsGrid) return;

    const characterArray = Object.values(this.characters);
    this.savedCharsGrid.innerHTML = '';

    characterArray.forEach(char => {
      this.savedCharsGrid.appendChild(this.createCharacterCard(char));
    });

    const emptySlots = MAX_CHARACTERS - characterArray.length;
    for (let i = 0; i < emptySlots; i++) {
      this.savedCharsGrid.appendChild(this.createEmptyCard());
    }
  }

  createCharacterCard(character) {
    const card = document.createElement('div');
    card.className = `char-card char-card--saved ${
      character.id === this.activeCharacterId ? 'active' : ''
    }`;
    card.dataset.characterId = character.id;

    const nome = character.name || character.data?.name || 'Personagem sem nome';
    const nivel = character.data?.level || '1';

    card.innerHTML = `
      <div class="char-card-content">
        <div class="char-card-header">
          <span class="char-card-name">${this.escapeHtml(nome)}</span>
          <button class="char-card-delete" aria-label="Remover personagem">✕</button>
        </div>
        <div class="char-card-body">
          <span class="char-card-level">Nível ${this.escapeHtml(nivel)}</span>
          <span class="char-card-modified">${this.formatDate(character.lastModified)}</span>
        </div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (!e.target.closest('.char-card-delete')) {
        this.handleCharacterClick(character.id);
      }
    });

    const deleteBtn = card.querySelector('.char-card-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.confirmDeleteCharacter(character.id);
      });
    }

    return card;
  }

  createEmptyCard() {
    const card = document.createElement('div');
    card.className = 'char-card char-card--empty';
    card.innerHTML = `
      <div class="char-card-content">
        <span class="char-plus">+</span>
        <span class="char-label">Novo Personagem</span>
      </div>
    `;

    card.addEventListener('click', () => this.createNewCharacter());
    return card;
  }

  updateCharsCounter() {
    if (!this.charsCounter) return;
    const count = Object.keys(this.characters).length;
    this.charsCounter.textContent = `${count}/${MAX_CHARACTERS}`;
  }

  // ========== Ações do personagem ==========
  handleCharacterClick(characterId) {
    const character = this.characters[characterId];
    if (!character) return;

    const hasChanges = this.checkForUnsavedChanges();

    if (hasChanges) {
      this.showUnsavedChangesDialog(characterId);
    } else {
      this.loadCharacterToSheet(characterId);
    }
  }

  loadCharacterToSheet(characterId) {
    const character = this.characters[characterId];
    if (!character) return;

    if (this.saveSheet(character.data) && this.setActiveCharacter(characterId)) {
      window.dispatchEvent(new CustomEvent('character-changed', { detail: { characterId } }));
      this.renderCharacterCards();
      this.toast.success(`Personagem "${character.name}" carregado`);
    }
  }

  createNewCharacter() {
    if (!this.canCreateNewCharacter()) {
      this.showAreaCheiaDialog();
      return;
    }

    const hasChanges = this.checkForUnsavedChanges();

    if (hasChanges) {
      this.showUnsavedChangesForNewCharacter();
    } else {
      this.proceedWithNewCharacter();
    }
  }

  proceedWithNewCharacter() {
    const characterId = this.generateCharacterId();

    const newCharacter = {
      id: characterId,
      name: 'Novo Personagem',
      lastModified: new Date().toISOString(),
      data: {}
    };

    this.characters[characterId] = newCharacter;

    if (!this.saveCharacters()) {
      // saveCharacters() já mostrou o toast de erro
      delete this.characters[characterId];
      return;
    }

    // Prepara a ficha em branco
    localStorage.removeItem(STORAGE_KEYS.SHEET);
    this.setActiveCharacter(characterId);
    this.clearSheetFields();

    // Atualiza UI
    this.renderCharacterCards();
    this.updateCharsCounter();

    // Notifica o resto do sistema
    window.dispatchEvent(new CustomEvent('character-changed', { detail: { characterId } }));

    // Abre a ficha para edição
    this.openSheet();

    this.toast.success('Novo personagem criado');
  }

  confirmDeleteCharacter(characterId) {
    const character = this.characters[characterId];
    if (!character) return;

    this.dialog.show({
      title: 'Remover Personagem',
      message: `Tem certeza que deseja remover "${character.name}"?`,
      buttons: [
        {
          text: 'Remover',
          class: 'dialog-button--danger',
          handler: () => this.deleteCharacter(characterId)
        },
        {
          text: 'Cancelar',
          class: 'dialog-button--cancel'
        }
      ]
    });
  }

  deleteCharacter(characterId) {
    delete this.characters[characterId];

    if (!this.saveCharacters()) return;

    if (this.activeCharacterId === characterId) {
      localStorage.removeItem(STORAGE_KEYS.SHEET);
      this.setActiveCharacter(null);
      window.dispatchEvent(new CustomEvent('character-changed', { detail: { characterId: null } }));
    }

    this.renderCharacterCards();
    this.updateCharsCounter();
    this.toast.success('Personagem removido');
  }

  // ========== Alterações não salvas ==========
  checkForUnsavedChanges() {
    if (!this.activeCharacterId) return false;

    const currentSheet = localStorage.getItem(STORAGE_KEYS.SHEET);
    const activeCharacter = this.characters[this.activeCharacterId];

    if (!currentSheet || !activeCharacter) return false;

    try {
      const currentData = JSON.parse(currentSheet);
      const savedData = activeCharacter.data;
      return JSON.stringify(currentData) !== JSON.stringify(savedData);
    } catch (e) {
      console.error('Erro ao comparar dados:', e);
      return false;
    }
  }

  showUnsavedChangesDialog(targetCharacterId) {
    this.dialog.show({
      title: 'Alterações não salvas',
      message: 'Deseja salvar as alterações atuais antes de trocar de personagem?',
      buttons: [
        {
          text: 'Salvar e Trocar',
          class: 'dialog-button--save',
          handler: () => {
            this.saveCurrentCharacter();
            this.loadCharacterToSheet(targetCharacterId);
          }
        },
        {
          text: 'Descartar e Trocar',
          class: 'dialog-button--discard',
          handler: () => this.loadCharacterToSheet(targetCharacterId)
        },
        {
          text: 'Cancelar',
          class: 'dialog-button--cancel'
        }
      ]
    });
  }

  showUnsavedChangesForNewCharacter() {
    this.dialog.show({
      title: 'Alterações não salvas',
      message: 'Deseja salvar as alterações atuais antes de criar um novo personagem?',
      buttons: [
        {
          text: 'Salvar e Novo',
          class: 'dialog-button--save',
          handler: () => {
            this.saveCurrentCharacter();
            this.proceedWithNewCharacter();
          }
        },
        {
          text: 'Descartar e Novo',
          class: 'dialog-button--discard',
          handler: () => this.proceedWithNewCharacter()
        },
        {
          text: 'Cancelar',
          class: 'dialog-button--cancel'
        }
      ]
    });
  }

  saveCurrentCharacter() {
    if (!this.activeCharacterId) return;

    const currentSheet = localStorage.getItem(STORAGE_KEYS.SHEET);
    if (!currentSheet) return;

    const activeCharacter = this.characters[this.activeCharacterId];
    if (!activeCharacter) {
      console.warn('Personagem ativo não encontrado:', this.activeCharacterId);
      return;
    }

    try {
      const currentData = JSON.parse(currentSheet);
      activeCharacter.data = currentData;
      activeCharacter.lastModified = new Date().toISOString();

      if (this.saveCharacters()) {
        this.renderCharacterCards();
        this.toast.success('Personagem salvo');
      }
    } catch (e) {
      console.error('Erro ao salvar personagem atual:', e);
      this.toast.error('Erro ao salvar personagem');
    }
  }

  // ========== Diálogos utilitários ==========
  showError(message) {
    this.dialog.show({
      title: 'Erro',
      message,
      buttons: [{ text: 'OK', class: 'dialog-button--cancel' }]
    });
  }

  showAreaCheiaDialog() {
    this.dialog.show({
      title: 'Área Cheia',
      message: 'Remova um personagem para poder criar ou copiar um novo.',
      buttons: [{ text: 'OK', class: 'dialog-button--cancel' }]
    });
  }
}

export default PlayerCharManager;