// js/shield/gm-combat.js
export class GMCombat {
  constructor(parent) {
    this.parent = parent;
    this.combatOrder = [];
    this.selectedItemId = null;
    this.confirmationActive = false;
  }

  init() {
    this.setupCombat();
    this.setupSelectionHandler();
    this.setupClickOutsideHandler();
  }

  setupCombat() {
    const startBtn = document.getElementById('combat-start');
    const nextBtn = document.getElementById('combat-next');
    const removeSelectedBtn = document.getElementById('combat-remove-selected');
    const removeAllBtn = document.getElementById('combat-remove-all');

    startBtn?.addEventListener('click', () => this.startCombat());
    nextBtn?.addEventListener('click', () => this.nextTurn());
    removeSelectedBtn?.addEventListener('click', () => this.showRemoveConfirmation('selected'));
    removeAllBtn?.addEventListener('click', () => this.showRemoveConfirmation('all'));
  }

  showRemoveConfirmation(type) {
    if (this.confirmationActive) return;

    const selectedId = this.selectedItemId;
    
    if (type === 'selected' && !selectedId) {
      this.parent.updateStatus('Nenhum personagem selecionado');
      return;
    }

    if (type === 'all' && this.combatOrder.length === 0) {
      this.parent.updateStatus('Ordem já está vazia');
      return;
    }

    const item = type === 'selected' 
      ? this.combatOrder.find(i => i.id === selectedId)
      : null;

    const message = type === 'selected' 
      ? `Remover ${item?.name || 'selecionado'} da ordem?` 
      : 'Remover todos os personagens?';

    const container = document.getElementById('combat-confirmation');
    if (!container) return;

    this.setButtonsDisabled(true);
    this.confirmationActive = true;

    container.innerHTML = `
      <div class="gmnotes-confirmation-box">
        <div class="gmnotes-confirmation-message">${message}</div>
        <div class="gmnotes-confirmation-actions">
          <button class="gmnotes-confirm-btn" id="confirm-yes">Sim</button>
          <button class="gmnotes-cancel-btn" id="confirm-no">Cancelar</button>
        </div>
      </div>
    `;

    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');

    const cleanup = () => {
      container.innerHTML = '';
      this.setButtonsDisabled(false);
      this.confirmationActive = false;
    };

    confirmYes?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (type === 'selected') {
        this.removeSelectedById(selectedId);
      } else {
        this.removeAll();
      }
      cleanup();
    });
    
    confirmNo?.addEventListener('click', (e) => {
      e.stopPropagation();
      cleanup();
    });
  }

  removeSelectedById(id) {
    if (!id) return;

    const item = this.combatOrder.find(i => i.id === id);
    if (!item) return;

    this.combatOrder = this.combatOrder.filter(i => i.id !== id);
    
    if (this.selectedItemId === id) {
      this.clearSelection();
    }
    
    this.renderCombatOrder();
    this.updateCombatButtons();
    this.parent.saveToStorage();
    this.parent.updateStatus(`${item.name} removido`);
  }

  removeAll() {
    if (this.combatOrder.length === 0) return;
    
    this.combatOrder = [];
    this.clearSelection();
    this.renderCombatOrder();
    this.updateCombatButtons();
    this.parent.saveToStorage();
    this.parent.updateStatus('Ordem limpa');
  }

  setButtonsDisabled(disabled) {
    ['remove-selected', 'remove-all'].forEach(id => {
      const btn = document.getElementById(`combat-${id}`);
      if (!btn) return;
      
      if (disabled) {
        btn.setAttribute('disabled', 'disabled');
        btn.classList.add('disabled');
      } else {
        btn.removeAttribute('disabled');
        btn.classList.remove('disabled');
      }
    });
  }

  setupSelectionHandler() {
    const container = document.getElementById('combat-order');
    if (!container) return;

    container.addEventListener('click', (e) => {
      if (this.confirmationActive) return;

      const item = e.target.closest('.gmnotes-combat-item');
      if (!item) return;

      const clickedId = item.dataset.combatId;
      
      if (this.selectedItemId === clickedId) {
        this.clearSelection();
      } else {
        this.selectItem(clickedId, item);
      }
      
      e.stopPropagation();
    });
  }

  selectItem(id, element) {
    if (this.selectedItemId) {
      const prev = document.querySelector(`.gmnotes-combat-item[data-combat-id="${this.selectedItemId}"]`);
      prev?.classList.remove('selected');
    }
    
    this.selectedItemId = id;
    element.classList.add('selected');
  }

  setupClickOutsideHandler() {
    document.addEventListener('click', (e) => {
      if (this.confirmationActive) return;
      
      const combatList = document.getElementById('combat-order');
      const confirmationBox = document.querySelector('.gmnotes-confirmation-box');
      
      if (this.selectedItemId && combatList && !combatList.contains(e.target) && !confirmationBox) {
        this.clearSelection();
      }
    });
  }

  clearSelection() {
    if (!this.selectedItemId) return;
    
    const prev = document.querySelector(`.gmnotes-combat-item[data-combat-id="${this.selectedItemId}"]`);
    prev?.classList.remove('selected');
    this.selectedItemId = null;
  }

  updateCombatButtons() {
    this.parent.npcs?.renderNPCs();
    this.parent.players?.renderPlayers();
  }

  removeFromCombatById(id) {
    this.combatOrder = this.combatOrder.filter(item => item.id !== id);
    if (this.selectedItemId === id) this.clearSelection();
    this.renderCombatOrder();
    this.updateCombatButtons();
  }

  toggleNPCInCombat(npcId, btnElement) {
    const npc = this.parent.npcs?.npcs.find(n => n.id === npcId);
    if (!npc) return;

    if (this.combatOrder.some(item => item.id === npcId)) {
      this.parent.updateStatus(`${npc.name} já está no combate`);
    } else {
      this.combatOrder.push({
        id: npc.id,
        name: npc.name,
        type: 'npc',
        initiative: 1,
        vit: npc.vitCurrent,
        vitMax: npc.vitMax,
        con: npc.conCurrent || 0,
        conMax: npc.conMax || 0,
        condition: 'normal'
      });

      this.renderCombatOrder();
      this.parent.npcs?.renderNPCs();
      this.parent.saveToStorage();
      this.parent.updateStatus(`${npc.name} adicionado`);
    }
  }

  togglePlayerInCombat(playerId, btnElement) {
    const player = this.parent.players?.players.find(p => p.id === playerId);
    if (!player) return;

    if (this.combatOrder.some(item => item.id === playerId)) {
      this.parent.updateStatus(`${player.name} já está no combate`);
    } else {
      this.combatOrder.push({
        id: player.id,
        name: player.name,
        type: 'player',
        initiative: 1,
        condition: 'normal'
      });

      this.renderCombatOrder();
      this.parent.players?.renderPlayers();
      this.parent.saveToStorage();
      this.parent.updateStatus(`${player.name} adicionado`);
    }
  }

  getConditionOptions(currentCondition) {
    const conditionGroups = [
      {
        label: 'Estado Básico',
        options: [{ value: 'normal', label: 'Normal' }]
      },
      {
        label: 'Condições Graves',
        options: [
          { value: 'inconsciente', label: 'Inconsciente' },
          { value: 'paralisado', label: 'Paralisado' }
        ]
      },
      {
        label: 'Estado Físico',
        options: [
          { value: 'envenenado', label: 'Envenenado' },
          { value: 'cansado', label: 'Cansado' },
          { value: 'exausto', label: 'Exausto' }
        ]
      },
      {
        label: 'Sentidos',
        options: [
          { value: 'cego', label: 'Cego' },
          { value: 'silenciado', label: 'Silenciado' }
        ]
      },
      {
        label: 'Movimento',
        options: [
          { value: 'caido', label: 'Caído' },
          { value: 'restringido', label: 'Restringido' },
          { value: 'escorregadio', label: 'Escorregadio' },
          { value: 'submerso', label: 'Submerso' }
        ]
      },
      {
        label: 'Estado Mental',
        options: [
          { value: 'atordoado', label: 'Atordoado' },
          { value: 'amedrontado', label: 'Amedrontado' },
          { value: 'aterrorizado', label: 'Aterrorizado' },
          { value: 'confuso', label: 'Confuso' },
          { value: 'encantado', label: 'Encantado' }
        ]
      }
    ];

    return conditionGroups.map(group => `
      <optgroup label="${group.label}" style="font-weight: bold; color: var(--gold); background: var(--surface-light);">
        ${group.options.map(opt => `
          <option value="${opt.value}" ${currentCondition === opt.value ? 'selected' : ''}>
            ${opt.label}
          </option>
        `).join('')}
      </optgroup>
    `).join('');
  }

  renderCombatOrder() {
    const container = document.getElementById('combat-order');
    if (!container) return;

    if (this.combatOrder.length === 0) {
      container.innerHTML = '<div class="gmnotes-empty-state">Ordem vazia</div>';
      return;
    }

    const sorted = [...this.combatOrder].sort((a, b) => a.initiative - b.initiative);

    container.innerHTML = sorted.map(item => `
      <div class="gmnotes-combat-item ${item.id === this.selectedItemId ? 'selected' : ''}" 
           data-combat-id="${item.id}">
        <div class="gmnotes-combat-name">${this.parent.escapeHtml(item.name)}</div>
        
        <div class="gmnotes-combat-controls-row">
          ${this.renderInitiativeControl(item)}
          ${this.renderConditionControl(item)}
        </div>
        
        ${item.type === 'npc' ? this.renderNPCStats(item) : ''}
      </div>
    `).join('');
  }

  renderInitiativeControl(item) {
    return `
      <div class="gmnotes-combat-initiative">
        <input type="number" class="gmnotes-combat-initiative-input" 
               value="${item.initiative}" min="1" max="99" 
               onchange="gmNotes.updateCombatInitiative('${item.id}', this.value)">
      </div>
    `;
  }

  renderConditionControl(item) {
    return `
      <div class="gmnotes-combat-status">
        <select class="gmnotes-combat-condition" 
                onchange="gmNotes.updateCombatCondition('${item.id}', this.value)">
          ${this.getConditionOptions(item.condition)}
        </select>
      </div>
    `;
  }

  renderNPCStats(item) {
    return `
      <div class="gmnotes-combat-stats-row">
        ${this.renderStatControl('Vit', item.vit, item.vitMax, item.id, 'adjustCombatVit')}
        ${this.renderStatControl('Con', item.con || 0, item.conMax || 0, item.id, 'adjustCombatCon')}
      </div>
    `;
  }

  renderStatControl(label, current, max, id, method) {
    return `
      <div class="gmnotes-combat-stat">
        <span class="gmnotes-combat-stat-label">${label}:</span>
        <div class="gmnotes-combat-stat-control">
          <button class="gmnotes-combat-stat-btn" onclick="gmNotes.${method}('${id}', -1)">-</button>
          <span class="gmnotes-combat-stat-value">
            <span class="gmnotes-combat-stat-current">${current}</span>/
            <span class="gmnotes-combat-stat-max">${max}</span>
          </span>
          <button class="gmnotes-combat-stat-btn" onclick="gmNotes.${method}('${id}', 1)">+</button>
        </div>
      </div>
    `;
  }

  adjustCombatVit(combatId, change) {
    const item = this.combatOrder.find(i => i.id === combatId);
    if (item?.type !== 'npc') return;

    item.vit = Math.max(0, Math.min(item.vitMax, item.vit + change));
    this.renderCombatOrder();
    
    const npc = this.parent.npcs?.npcs.find(n => n.id === combatId);
    if (npc) {
      npc.vitCurrent = item.vit;
      this.parent.npcs?.renderNPCs();
    }
    this.parent.saveToStorage();
  }

  adjustCombatCon(combatId, change) {
    const item = this.combatOrder.find(i => i.id === combatId);
    if (item?.type !== 'npc') return;

    item.con = Math.max(0, Math.min(item.conMax, (item.con || 0) + change));
    this.renderCombatOrder();
    
    const npc = this.parent.npcs?.npcs.find(n => n.id === combatId);
    if (npc) {
      npc.conCurrent = item.con;
      this.parent.npcs?.renderNPCs();
    }
    this.parent.saveToStorage();
  }

  updateCombatInitiative(combatId, value) {
    const item = this.combatOrder.find(i => i.id === combatId);
    if (!item) return;

    item.initiative = Math.min(99, parseInt(value) || 1);
    this.renderCombatOrder();
    this.parent.saveToStorage();
  }

  updateCombatCondition(combatId, condition) {
    const item = this.combatOrder.find(i => i.id === combatId);
    if (!item) return;

    item.condition = condition;
    this.parent.saveToStorage();
  }

  startCombat() {
    if (this.combatOrder.length === 0) return;
    
    document.querySelectorAll('.gmnotes-combat-item').forEach((item, index) => {
      item.classList.toggle('active-turn', index === 0);
    });
    this.parent.updateStatus('Combate iniciado!');
  }

  nextTurn() {
    const items = document.querySelectorAll('.gmnotes-combat-item');
    if (items.length === 0) return;
    
    const activeIndex = Array.from(items).findIndex(item => item.classList.contains('active-turn'));
    
    items.forEach(item => item.classList.remove('active-turn'));
    
    const nextIndex = activeIndex < items.length - 1 ? activeIndex + 1 : 0;
    items[nextIndex].classList.add('active-turn');
  }

  loadFromStorage(data) {
    this.combatOrder = (data.combatOrder || []).map(item => {
      if (item.type === 'npc') {
        const npc = this.parent.npcs?.npcs.find(n => n.id === item.id);
        if (npc) {
          return {
            ...item,
            vit: npc.vitCurrent,
            vitMax: npc.vitMax,
            con: npc.conCurrent || 0,
            conMax: npc.conMax || 0
          };
        }
      }
      return item;
    });
    
    this.clearSelection();
    
    setTimeout(() => {
      this.renderCombatOrder();
      this.parent.npcs?.renderNPCs();
      this.parent.players?.renderPlayers();
    }, 50);
  }

  getData() {
    return this.combatOrder;
  }
}