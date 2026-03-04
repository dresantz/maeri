// js/shield/gm-players.js
export class GMPlayers {
  constructor(parent) {
    this.parent = parent;
    this.players = [];
    this.filteredPlayers = null;
  }

  init() {
    this.setupPlayerForm();
  }

  setupPlayerForm() {
    const addBtn = document.getElementById('player-add');
    addBtn?.addEventListener('click', () => this.addPlayer());
    
    const searchInput = document.querySelector('.gmnotes-players-search');
    searchInput?.addEventListener('input', (e) => this.searchPlayers(e.target.value));
  }

  getFormValues() {
    return {
      name: document.getElementById('player-name')?.value?.trim() || '',
      info: document.getElementById('player-info')?.value?.trim() || ''
    };
  }

  addPlayer() {
    const form = this.getFormValues();
    
    if (!form.name) {
      alert('Preencha o nome do jogador');
      return;
    }

    const player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name: form.name,
      info: form.info,
      createdAt: new Date().toISOString()
    };

    this.players.push(player);
    this.clearPlayerForm();
    this.resetSearch();
    this.renderPlayers();
    this.parent.saveToStorage();
    this.parent.updateStatus('Jogador adicionado!');
  }

  clearPlayerForm() {
    document.getElementById('player-name').value = '';
    document.getElementById('player-info').value = '';
  }

  resetSearch() {
    this.filteredPlayers = null;
    const searchInput = document.querySelector('.gmnotes-players-search');
    if (searchInput) searchInput.value = '';
  }

  isInCombat(playerId) {
    return this.parent.combat?.combatOrder?.some(item => item.id === playerId) || false;
  }

  renderPlayers() {
    const container = document.getElementById('players-list');
    if (!container) return;

    const playersToRender = this.filteredPlayers || this.players;

    if (playersToRender.length === 0) {
      container.innerHTML = '<div class="gmnotes-empty-state">Nenhum jogador cadastrado</div>';
      return;
    }

    container.innerHTML = playersToRender.map(player => this.renderPlayerItem(player)).join('');
  }

  renderPlayerItem(player) {
    const inCombat = this.isInCombat(player.id);
    const combatButtonClass = inCombat ? 'gmnotes-npc-btn combat-added' : 'gmnotes-npc-btn';
    const combatTitle = inCombat ? 'Já está no combate' : 'Adicionar ao Combate';
    
    return `
      <div class="gmnotes-player-item" data-player-id="${player.id}">
        <div class="gmnotes-player-header">
          <span class="gmnotes-player-name">${this.parent.escapeHtml(player.name)}</span>
          <div class="gmnotes-player-actions">
            <button class="${combatButtonClass}" 
                    onclick="gmNotes.togglePlayerInCombat('${player.id}', this)" 
                    title="${combatTitle}">⚔️</button>
            <button class="gmnotes-npc-btn" 
                    onclick="gmNotes.editPlayer('${player.id}')" 
                    title="Editar">✏️</button>
            <button class="gmnotes-npc-btn" 
                    onclick="gmNotes.deletePlayer('${player.id}')" 
                    title="Remover">🗑️</button>
          </div>
        </div>
        ${player.info ? this.renderPlayerInfo(player.info) : ''}
      </div>
    `;
  }

  renderPlayerInfo(info) {
    return `
      <div class="gmnotes-player-info">
        ${this.parent.escapeHtml(info)}
      </div>
    `;
  }

  editPlayer(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return;

    document.getElementById('player-name').value = player.name;
    document.getElementById('player-info').value = player.info || '';
    
    this.deletePlayer(playerId, false);
    this.parent.switchTab('players');
  }

  deletePlayer(playerId, render = true) {
    const wasInCombat = this.isInCombat(playerId);
    
    this.players = this.players.filter(p => p.id !== playerId);
    
    if (this.parent.combat && wasInCombat) {
      this.parent.combat.removeFromCombatById(playerId);
    }
    
    if (!render) return;
    
    this.renderPlayers();
    this.parent.combat?.renderCombatOrder();
    this.parent.saveToStorage();
    this.parent.updateStatus('Jogador removido');
  }

  searchPlayers(query) {
    const searchTerm = query?.trim().toLowerCase();
    
    if (!searchTerm) {
      this.filteredPlayers = null;
    } else {
      this.filteredPlayers = this.players.filter(player => 
        player.name.toLowerCase().includes(searchTerm) ||
        (player.info && player.info.toLowerCase().includes(searchTerm))
      );
    }
    
    this.renderPlayers();
  }

  loadFromStorage(data) {
    this.players = data?.players || [];
    this.filteredPlayers = null;
    
    if (document.getElementById('players-list')) {
      this.renderPlayers();
    }
  }

  getData() {
    return this.players;
  }
}