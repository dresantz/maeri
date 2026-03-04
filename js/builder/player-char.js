// js/builder/player-char.js
// =========================
// Maeri RPG - Player Character Manager
// Gerencia exclusivamente a aba Personagens
// =========================

import templateList from './template-list.js';
import templateManager from './template-manager.js';

// Sistema de Diálogos
class DialogSystem {
  constructor() {
    this.activeDialog = null;
    this.escHandler = null;
  }
  
  show({ title, message, buttons }) {
    this.close(); // Fecha diálogo anterior se existir
    
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = 'dialog-box';
    
    const buttonsHtml = buttons.map(btn => 
      `<button class="dialog-button ${btn.class || ''}" data-action="${btn.action || ''}">${btn.text}</button>`
    ).join('');
    
    dialog.innerHTML = `
      <h3 class="dialog-title">${title}</h3>
      <p class="dialog-message">${message}</p>
      <div class="dialog-actions">
        ${buttonsHtml}
      </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    this.activeDialog = overlay;
    
    // Adicionar event listeners
    const dialogButtons = dialog.querySelectorAll('.dialog-button');
    buttons.forEach((btn, index) => {
      dialogButtons[index].addEventListener('click', (e) => {
        e.preventDefault();
        if (btn.handler) btn.handler();
        this.close();
      });
    });
    
    // Fechar com ESC
    this.escHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', this.escHandler);
    
    // Fechar ao clicar no overlay (fora do diálogo)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close();
      }
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

// Sistema de Toasts
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
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    
    this.container.textContent = message;
    this.container.className = `global-toast global-toast--${type}`;
    this.container.classList.add('show');
    
    this.timeout = setTimeout(() => {
      this.container.classList.remove('show');
    }, duration);
  }
  
  success(message) {
    this.show(message, 'success');
  }
  
  error(message) {
    this.show(message, 'error', 4000);
  }
  
  warning(message) {
    this.show(message, 'warning', 4000);
  }
}

class PlayerCharManager {
  constructor() {
    // Constantes do localStorage
    this.STORAGE_KEYS = {
      CHARACTERS: 'maeri-characters',
      ACTIVE_CHARACTER: 'maeri-active-character',
      SHEET: 'maeri-sheet'
    };
    
    // Elementos DOM específicos da aba Personagens
    this.charsCounter = document.querySelector('.chars-counter');
    this.savedCharsGrid = document.querySelector('.saved-chars');
    this.readyCharsGrid = document.querySelector('.ready-chars');
    
    // Cache dos personagens
    this.characters = {};
    this.activeCharacterId = localStorage.getItem(this.STORAGE_KEYS.ACTIVE_CHARACTER);
    
    // Sistemas auxiliares
    this.dialog = new DialogSystem();
    this.toast = new ToastSystem();
    
    // Handlers com bind para remoção
    this.boundStorageHandler = this.handleStorageChange.bind(this);
    this.boundCharactersUpdatedHandler = this.handleCharactersUpdated.bind(this);
    this.boundReadyCharClickHandler = this.handleReadyCharClick.bind(this);
    
    // Versão com debounce do loadCharacters
    this.loadCharactersDebounced = this.debounce(this.loadCharacters.bind(this), 100);

    this.init();
  }

  // Utilitários
  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  generateCharacterId() {
    return 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
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
    
    if (diffMins < 1) return 'agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} h atrás`;
    return date.toLocaleDateString('pt-BR');
  }

  canCreateNewCharacter() {
    return Object.keys(this.characters).length < 3;
  }

  showLoading(show) {
    if (!this.savedCharsGrid) return;
    
    if (show) {
      this.savedCharsGrid.style.opacity = '0.5';
      this.savedCharsGrid.style.pointerEvents = 'none';
    } else {
      this.savedCharsGrid.style.opacity = '1';
      this.savedCharsGrid.style.pointerEvents = 'auto';
    }
  }

  // Operações de localStorage
  saveCharacters() {
    try {
      localStorage.setItem(this.STORAGE_KEYS.CHARACTERS, JSON.stringify(this.characters));
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
        localStorage.setItem(this.STORAGE_KEYS.ACTIVE_CHARACTER, characterId);
      } else {
        localStorage.removeItem(this.STORAGE_KEYS.ACTIVE_CHARACTER);
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
      localStorage.setItem(this.STORAGE_KEYS.SHEET, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Erro ao salvar ficha:', e);
      return false;
    }
  }

  // Validação
  validateCharacter(character) {
    if (!character || typeof character !== 'object') return false;
    if (!character.id || typeof character.id !== 'string') return false;
    if (!character.name) return false;
    if (!character.lastModified) return false;
    if (!character.data || typeof character.data !== 'object') return false;
    
    return true;
  }

  // Inicialização
  init() {
    this.loadCharacters();
    this.setupEventListeners();
    this.renderReadyTemplates(); // Renderiza os templates
  }

  setupEventListeners() {
    window.addEventListener('characters-updated', this.boundCharactersUpdatedHandler);
    window.addEventListener('storage', this.boundStorageHandler);
  }

  // ===== TEMPLATES PRONTOS =====
  async renderReadyTemplates() {
    if (!this.readyCharsGrid) {
      console.warn('Grid de personagens prontos não encontrado');
      return;
    }

    // Renderiza os cards usando a lista de templates
    await templateList.renderCards(this.readyCharsGrid, templateManager);
    
    // Configura os eventos nos cards recém-criados
    this.setupReadyChars();
  }

  setupReadyChars() {
    if (!this.readyCharsGrid) return;
    
    const readyCards = this.readyCharsGrid.querySelectorAll('.char-card--ready');
    console.log(`${readyCards.length} personagens prontos configurados`);
    
    // Verificar cada card antes de adicionar eventos
    readyCards.forEach((card, index) => {
      console.log(`Configurando card ${index}:`, {
        templateFile: card.dataset.templateFile,
        char: card.dataset.char
      });
      
      // Só adiciona evento se tiver os dados necessários
      if (!card.dataset.templateFile || !card.dataset.char) {
        console.warn(`Card ${index} sem dados completos, ignorando`);
        return;
      }
      
      // Remove listener antigo se existir
      card.removeEventListener('click', this.boundReadyCharClickHandler);
      
      // Adiciona novo listener - NÃO usar arrow function aqui para manter o 'this' correto
      card.addEventListener('click', this.boundReadyCharClickHandler);
    });
  }

  // ===== PERSONAGENS PRONTOS =====
  async handleReadyCharClick(event) {
    console.log('=== HANDLE READY CHAR CLICK ===');
    console.log('Evento recebido:', event);
    
    // CORREÇÃO: Extrair o card do evento
    const card = event.currentTarget; // ou event.target
    console.log('Card extraído do evento:', card);
    console.log('Classes do card:', card?.className);
    console.log('Dataset completo:', card?.dataset);
    
    const templateFile = card?.dataset?.templateFile;
    const baseId = card?.dataset?.char;
    
    console.log('templateFile:', templateFile);
    console.log('baseId:', baseId);
    
    if (!templateFile || !baseId) {
      console.error('Dados do template não encontrados no card:', card);
      console.error('Dataset disponível:', card?.dataset);
      this.showError('Personagem não identificado');
      return;
    }
    
    // Verificar limite de personagens
    if (!this.canCreateNewCharacter()) {
      this.showAreaCheiaDialog();
      return;
    }
    
    try {
      this.showLoading(true);
      
      console.log(`Carregando template: ${templateFile}`);
      const template = await templateManager.loadTemplate(templateFile);
      
      if (!template) {
        throw new Error('Template não encontrado');
      }
      
      console.log('Template carregado com sucesso:', template);
      
      this.showLoading(false);
      
      // Mostra diálogo com preview usando os dados do template
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
          <hr>
          <p>Deseja copiar este personagem para um slot vazio?</p>
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

  // No player-char.js, método copyReadyCharacter
  copyReadyCharacter(template, templateFile, baseId) {
    // Cria o personagem a partir do template
    const characterId = this.generateCharacterId();
    
    // Converte o template para o formato da ficha
    const sheetData = templateManager.templateToSheetData(template);
    
    const newCharacter = {
      id: characterId,
      name: template.name,
      lastModified: new Date().toISOString(),
      data: sheetData,
      template: {
        file: templateFile,
        id: baseId
      }
    };

    this.characters[characterId] = newCharacter;
    
    if (this.saveCharacters()) {
      this.renderCharacterCards();
      this.updateCharsCounter();
      
      // Pergunta se quer abrir
      this.dialog.show({
        title: 'Template Copiado',
        message: `"${template.name}" foi adicionado aos seus personagens. Deseja abri-lo agora?`,
        buttons: [
          { 
            text: 'Abrir Ficha', 
            class: 'dialog-button--save',
            handler: () => {
              // Carrega o personagem na ficha
              this.loadCharacterToSheet(characterId);
              
              // USAR window.SheetManager (disponível globalmente)
              if (window.SheetManager) {
                window.SheetManager.open();
              } else {
                console.warn('SheetManager não disponível');
                document.getElementById('sheet-button')?.click();
              }
            }
          },
          { 
            text: 'Ficar na Área', 
            class: 'dialog-button--cancel' 
          }
        ]
      });
    }
  }

  // Handlers de eventos
  handleCharactersUpdated() {
    this.loadCharactersDebounced();
  }

  handleStorageChange(e) {
    if (e.key === this.STORAGE_KEYS.CHARACTERS || e.key === this.STORAGE_KEYS.ACTIVE_CHARACTER) {
      this.loadCharactersDebounced();
    }
  }

  destroy() {
    window.removeEventListener('characters-updated', this.boundCharactersUpdatedHandler);
    window.removeEventListener('storage', this.boundStorageHandler);
    
    if (this.readyCharsGrid) {
      const readyCards = this.readyCharsGrid.querySelectorAll('.char-card--ready');
      readyCards.forEach(card => {
        card.removeEventListener('click', this.boundReadyCharClickHandler);
      });
    }
  }

  // ===== CARREGAMENTO =====
  loadCharacters() {
    const saved = localStorage.getItem(this.STORAGE_KEYS.CHARACTERS);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.characters = {};
        
        // Validar cada personagem
        Object.entries(parsed).forEach(([id, char]) => {
          if (this.validateCharacter(char)) {
            this.characters[id] = char;
          } else {
            console.warn('Personagem inválido ignorado:', id);
          }
        });
      } catch (e) {
        console.error('Erro ao carregar personagens:', e);
        this.characters = {};
      }
    } else {
      this.characters = {};
    }
    
    this.activeCharacterId = localStorage.getItem(this.STORAGE_KEYS.ACTIVE_CHARACTER);
    this.renderCharacterCards();
    this.updateCharsCounter();
  }

  // ===== RENDERIZAÇÃO =====
  renderCharacterCards() {
    if (!this.savedCharsGrid) return;
    
    const characterArray = Object.values(this.characters);
    
    // Limpar grid
    this.savedCharsGrid.innerHTML = '';
    
    // Renderizar personagens salvos
    characterArray.forEach(char => {
      const card = this.createCharacterCard(char);
      this.savedCharsGrid.appendChild(card);
    });
    
    // Preencher slots vazios até 3
    const slotsFaltando = 3 - characterArray.length;
    for (let i = 0; i < slotsFaltando; i++) {
      const emptyCard = this.createEmptyCard();
      this.savedCharsGrid.appendChild(emptyCard);
    }
  }

  createCharacterCard(character) {
    const card = document.createElement('div');
    card.className = 'char-card char-card--saved';
    if (character.id === this.activeCharacterId) {
      card.classList.add('active');
    }
    card.dataset.characterId = character.id;
    
    // Extrair nome e nível dos dados
    const nome = character.data?.name || 'Personagem sem nome';
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
    
    // Event listeners
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
    
    card.addEventListener('click', () => {
      this.createNewCharacter();
    });
    
    return card;
  }

  // ===== AÇÕES COM PERSONAGENS =====
  async handleCharacterClick(characterId) {
    const character = this.characters[characterId];
    if (!character) return;
    
    // Verificar se há modificações na ficha atual
    const hasChanges = await this.checkForUnsavedChanges();
    
    if (hasChanges) {
      this.showUnsavedChangesDialog(characterId);
    } else {
      this.loadCharacterToSheet(characterId);
    }
  }

  checkForUnsavedChanges() {
    return new Promise((resolve) => {
      // Se não há ficha ativa, não há mudanças
      if (!this.activeCharacterId) {
        resolve(false);
        return;
      }
      
      const currentSheet = localStorage.getItem(this.STORAGE_KEYS.SHEET);
      if (!currentSheet) {
        resolve(false);
        return;
      }
      
      const activeCharacter = this.characters[this.activeCharacterId];
      if (!activeCharacter) {
        resolve(false);
        return;
      }
      
      try {
        const currentData = JSON.parse(currentSheet);
        const savedData = activeCharacter.data;
        const hasChanges = JSON.stringify(currentData) !== JSON.stringify(savedData);
        resolve(hasChanges);
      } catch (e) {
        console.error('Erro ao comparar dados:', e);
        resolve(false);
      }
    });
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

  saveCurrentCharacter() {
    if (!this.activeCharacterId) return;
    
    const currentSheet = localStorage.getItem(this.STORAGE_KEYS.SHEET);
    if (!currentSheet) return;
    
    try {
      const currentData = JSON.parse(currentSheet);
      this.characters[this.activeCharacterId].data = currentData;
      this.characters[this.activeCharacterId].lastModified = new Date().toISOString();
      
      if (this.saveCharacters()) {
        this.renderCharacterCards();
        this.toast.success('Personagem salvo');
      }
    } catch (e) {
      console.error('Erro ao salvar personagem atual:', e);
      this.toast.error('Erro ao salvar personagem');
    }
  }

  loadCharacterToSheet(characterId) {
    const character = this.characters[characterId];
    if (!character) return;
    
    // Salva os dados da ficha
    if (this.saveSheet(character.data) && this.setActiveCharacter(characterId)) {
      window.dispatchEvent(new CustomEvent('character-changed', { 
        detail: { characterId } 
      }));
      
      this.renderCharacterCards();
      this.toast.success(`Personagem "${character.name}" carregado`);
    }
  }

  createNewCharacter() {
    if (!this.canCreateNewCharacter()) {
      this.showAreaCheiaDialog();
      return;
    }
    
    localStorage.removeItem(this.STORAGE_KEYS.SHEET);
    this.setActiveCharacter(null);
    
    window.dispatchEvent(new CustomEvent('character-changed', { 
      detail: { characterId: null } 
    }));
    
    document.getElementById('sheet-button')?.click();
    this.toast.success('Nova ficha em branco');
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
    
    if (this.saveCharacters()) {
      if (this.activeCharacterId === characterId) {
        localStorage.removeItem(this.STORAGE_KEYS.SHEET);
        this.setActiveCharacter(null);
        window.dispatchEvent(new CustomEvent('character-changed', { 
          detail: { characterId: null } 
        }));
      }
      
      this.renderCharacterCards();
      this.updateCharsCounter();
      this.toast.success('Personagem removido');
    }
  }

  // ===== UTILITÁRIOS DE DIÁLOGO =====
  showError(message) {
    this.dialog.show({
      title: 'Erro',
      message: message,
      buttons: [
        { text: 'OK', class: 'dialog-button--cancel' }
      ]
    });
  }

  showAreaCheiaDialog() {
    this.dialog.show({
      title: 'Área Cheia',
      message: 'Remova um personagem para poder criar ou copiar um novo.',
      buttons: [
        { text: 'OK', class: 'dialog-button--cancel' }
      ]
    });
  }

  // ===== UTILITÁRIOS =====
  updateCharsCounter() {
    if (!this.charsCounter) return;
    const count = Object.keys(this.characters).length;
    this.charsCounter.textContent = `${count}/3`;
  }
}

export default PlayerCharManager;