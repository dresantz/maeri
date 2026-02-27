// js/builder/player-char.js
// =========================
// Maeri RPG - Player Character Manager
// Gerencia exclusivamente a aba Personagens
// =========================

class PlayerCharManager {
  constructor() {
    // Elementos DOM específicos da aba Personagens
    this.charsCounter = document.querySelector('.chars-counter');
    this.savedCharsGrid = document.querySelector('.saved-chars');
    this.readyCharsGrid = document.querySelector('.ready-chars');
    
    // Cache dos personagens
    this.characters = {};
    this.activeCharacterId = localStorage.getItem('maeri-active-character');
    
    this.init();
  }

  init() {
    this.loadCharacters();
    this.setupEventListeners();
    this.setupReadyChars();
  }

  setupEventListeners() {
    // Ouvir mudanças nos personagens (disparado pelo sheet.js ao salvar)
    window.addEventListener('characters-updated', () => {
      this.loadCharacters();
    });
    
    // Ouvir mudanças no localStorage de outras abas
    window.addEventListener('storage', (e) => {
      if (e.key === 'maeri-characters' || e.key === 'maeri-active-character') {
        this.loadCharacters();
      }
    });
  }

  // ===== CARREGAMENTO =====
  loadCharacters() {
    const saved = localStorage.getItem('maeri-characters');
    this.characters = saved ? JSON.parse(saved) : {};
    this.activeCharacterId = localStorage.getItem('maeri-active-character');
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

  // ===== PERSONAGENS PRONTOS =====
  setupReadyChars() {
    if (!this.readyCharsGrid) return;
    
    const readyCards = this.readyCharsGrid.querySelectorAll('.char-card--ready');
    readyCards.forEach(card => {
      card.addEventListener('click', () => this.handleReadyCharClick(card));
    });
  }

  handleReadyCharClick(card) {
    const charType = card.dataset.char;
    
    // Verificar se há slots disponíveis
    if (Object.keys(this.characters).length >= 3) {
      this.showDialog({
        title: 'Área Cheia',
        message: 'Remova um personagem para poder copiar este template.',
        buttons: [
          { text: 'OK', class: 'dialog-button--cancel' }
        ]
      });
      return;
    }
    
    // Mostrar diálogo de confirmação
    this.showDialog({
      title: 'Copiar Template',
      message: 'Deseja copiar este personagem pronto para um slot vazio?',
      buttons: [
        { 
          text: 'Copiar', 
          class: 'dialog-button--save',
          handler: () => this.copyReadyCharacter(charType)
        },
        { 
          text: 'Cancelar', 
          class: 'dialog-button--cancel' 
        }
      ]
    });
  }

  copyReadyCharacter(charType) {
    // Templates dos personagens prontos
    const templates = {
      warrior: {
        name: 'Thorn, o Brutal',
        level: '3',
        attributes: { f: '4', v: '3', d: '2', s: '2', i: '1', a: '2' },
        vit: { current: '14', total: '14' },
        con: { current: '12', total: '12' },
        complemento: {
          ser: 'Humano alto, cicatrizes de batalha',
          estudos: 'Táticas de guerra',
          tecnicas: 'Golpe Poderoso, Postura Defensiva',
          magias: '',
          xp: { m: '0', l: '0', p: '0' }
        },
        narrativa: {
          arquetipo: 'Guerreiro',
          motivacao: 'Vingança',
          disposicao: 'Brutal',
          historia: 'Ex-soldado buscando vingança',
          contatos: 'Antigo regimento'
        },
        itens: {
          fo: '2', dp: '0', tc: '0',
          pesoFx2: '8', pesoFx4: '16', pesoTotal: '12',
          lista: 'Espada longa, Armadura de couro, Escudo'
        }
      },
      mage: {
        name: 'Eldrin, o Sábio',
        level: '3',
        attributes: { f: '1', v: '2', d: '2', s: '3', i: '4', a: '2' },
        vit: { current: '8', total: '8' },
        con: { current: '10', total: '10' },
        complemento: {
          ser: 'Elfo, olhos brilhantes',
          estudos: 'Arcanismo, Runas',
          tecnicas: '',
          magias: 'Bola de Fogo, Escudo Arcano',
          xp: { m: '0', l: '0', p: '0' }
        },
        narrativa: {
          arquetipo: 'Mago',
          motivacao: 'Conhecimento',
          disposicao: 'Sábio',
          historia: 'Estudioso das artes arcanas',
          contatos: 'Conselho de Magos'
        },
        itens: {
          fo: '0', dp: '0', tc: '0',
          pesoFx2: '2', pesoFx4: '4', pesoTotal: '3',
          lista: 'Cajado, Grimório, Componentes'
        }
      }
      // Adicionar outros templates...
    };

    const template = templates[charType];
    if (!template) return;

    // Criar novo personagem
    const characterId = 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    
    const newCharacter = {
      id: characterId,
      name: template.name,
      lastModified: new Date().toISOString(),
      data: template
    };

    // Salvar
    this.characters[characterId] = newCharacter;
    localStorage.setItem('maeri-characters', JSON.stringify(this.characters));
    
    // Atualizar UI
    this.renderCharacterCards();
    this.updateCharsCounter();
    this.showToast('Template copiado com sucesso!');
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
      
      const currentSheet = localStorage.getItem('maeri-sheet');
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
    this.showDialog({
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
    
    const currentSheet = localStorage.getItem('maeri-sheet');
    if (!currentSheet) return;
    
    try {
      const currentData = JSON.parse(currentSheet);
      this.characters[this.activeCharacterId].data = currentData;
      this.characters[this.activeCharacterId].lastModified = new Date().toISOString();
      localStorage.setItem('maeri-characters', JSON.stringify(this.characters));
      this.renderCharacterCards();
      this.showToast('Personagem salvo');
    } catch (e) {
      console.error('Erro ao salvar personagem atual:', e);
    }
  }

  loadCharacterToSheet(characterId) {
    const character = this.characters[characterId];
    if (!character) return;
    
    localStorage.setItem('maeri-sheet', JSON.stringify(character.data));
    localStorage.setItem('maeri-active-character', characterId);
    this.activeCharacterId = characterId;
    
    window.dispatchEvent(new CustomEvent('character-changed', { 
      detail: { characterId } 
    }));
    
    this.renderCharacterCards();
    this.showToast(`Personagem "${character.name}" carregado`);
  }

  createNewCharacter() {
    if (Object.keys(this.characters).length >= 3) {
      this.showDialog({
        title: 'Área Cheia',
        message: 'Remova um personagem para criar um novo.',
        buttons: [
          { text: 'OK', class: 'dialog-button--cancel' }
        ]
      });
      return;
    }
    
    localStorage.removeItem('maeri-sheet');
    localStorage.removeItem('maeri-active-character');
    this.activeCharacterId = null;
    
    window.dispatchEvent(new CustomEvent('character-changed', { 
      detail: { characterId: null } 
    }));
    
    document.getElementById('sheet-button')?.click();
    this.showToast('Nova ficha em branco');
  }

  confirmDeleteCharacter(characterId) {
    const character = this.characters[characterId];
    if (!character) return;
    
    this.showDialog({
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
    localStorage.setItem('maeri-characters', JSON.stringify(this.characters));
    
    if (this.activeCharacterId === characterId) {
      localStorage.removeItem('maeri-active-character');
      localStorage.removeItem('maeri-sheet');
      this.activeCharacterId = null;
      window.dispatchEvent(new CustomEvent('character-changed', { 
        detail: { characterId: null } 
      }));
    }
    
    this.renderCharacterCards();
    this.updateCharsCounter();
    this.showToast('Personagem removido');
  }

  // ===== UTILITÁRIOS =====
  showDialog({ title, message, buttons }) {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = 'dialog-box';
    
    let buttonsHtml = '';
    buttons.forEach(btn => {
      buttonsHtml += `<button class="dialog-button ${btn.class}">${btn.text}</button>`;
    });
    
    dialog.innerHTML = `
      <h3 class="dialog-title">${title}</h3>
      <p class="dialog-message">${message}</p>
      <div class="dialog-actions">
        ${buttonsHtml}
      </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // Adicionar event listeners
    const dialogButtons = dialog.querySelectorAll('.dialog-button');
    buttons.forEach((btn, index) => {
      dialogButtons[index].addEventListener('click', () => {
        if (btn.handler) btn.handler();
        document.body.removeChild(overlay);
      });
    });
  }

  showToast(message, type = 'success') {
    let toast = document.querySelector('.global-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'global-toast';
      document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.className = `global-toast global-toast--${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  updateCharsCounter() {
    if (!this.charsCounter) return;
    const count = Object.keys(this.characters).length;
    this.charsCounter.textContent = `${count}/3`;
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

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export default PlayerCharManager;