// js/shield/gm-combat.js

const CONDITION_OPTIONS = [
  '💀', '🩸', '🐍', '🔥', '❄️', '⚡',
  '🛡️', '✨', '😵', '🕸️', '👁️', '💤'
];

export class GMCombat {
  constructor(parent) {
    this.parent = parent;
    this.combatOrder = [];
    this.selectedItemId = null;
    this.confirmationActive = false;
    this.npcColor = 'var(--red)';
    this.playerColor = 'var(--green)';
    this.swapSourceId = null;

    // Estado interno para o menu de condições
    this._initialized = false;
    this._conditionMenuClose = null;
  }

  init() {
    if (this._initialized) return;
    this._initialized = true;

    this.setupCombat();
    this.setupSelectionHandler();
    this.setupClickOutsideHandler();
    this.setupConditionMenu();
  }

  // ===== BOTÕES DE AÇÃO =====

  setupCombat() {
    const removeSelectedBtn = document.getElementById('combat-remove-selected');
    const removeAllBtn = document.getElementById('combat-remove-all');
    const resetActionsBtn = document.getElementById('combat-reset-actions');

    removeSelectedBtn?.addEventListener('click', () => this.showRemoveConfirmation('selected'));
    removeAllBtn?.addEventListener('click', () => this.showRemoveConfirmation('all'));
    resetActionsBtn?.addEventListener('click', () => this.resetAllActions());
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
      if (type === 'selected') this.removeSelectedById(selectedId);
      else this.removeAll();
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
    if (this.selectedItemId === id) this.clearSelection();

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

  resetAllActions() {
    if (this.combatOrder.length === 0) {
      this.parent.updateStatus('Nenhum token na ordem de combate');
      return;
    }
    const hasActed = this.combatOrder.some(item => item.hasActed === true);
    if (!hasActed) {
      this.parent.updateStatus('Todos os tokens já estão com ações pendentes');
      return;
    }

    this.combatOrder.forEach(item => { item.hasActed = false; });
    document.querySelectorAll('.gmnotes-token-checkbox').forEach(cb => {
      cb.checked = false;
    });

    this.parent.saveToStorage();
    this.parent.updateStatus('✅ Todas as ações foram reiniciadas');
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

  // ===== TROCA E MOVIMENTAÇÃO =====

  moveToken(id, direction) {
    const currentIndex = this.combatOrder.findIndex(item => item.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    const directionName = direction === 'left' ? 'esquerda' : 'direita';

    if (newIndex < 0 || newIndex >= this.combatOrder.length) {
      this.parent.updateStatus(`Token já está no ${direction === 'left' ? 'início' : 'final'} da ordem`);
      return;
    }

    const [item] = this.combatOrder.splice(currentIndex, 1);
    this.combatOrder.splice(newIndex, 0, item);

    this.selectedItemId = id;
    this.swapSourceId = id;

    this.renderCombatOrder();
    this.parent.saveToStorage();
    this.parent.updateStatus(`${item.name} movido para ${directionName}`);
  }

  swapTokens(id1, id2) {
    const index1 = this.combatOrder.findIndex(i => i.id === id1);
    const index2 = this.combatOrder.findIndex(i => i.id === id2);
    if (index1 === -1 || index2 === -1) return;

    [this.combatOrder[index1], this.combatOrder[index2]] = 
    [this.combatOrder[index2], this.combatOrder[index1]];

    this.renderCombatOrder();
    this.parent.saveToStorage();
  }

  clearSwapMode() {
    this.swapSourceId = null;
    document.querySelectorAll('.gmnotes-combat-token').forEach(el => {
      el.classList.remove('swap-source');
    });
  }

  clearSelection() {
    if (!this.selectedItemId) return;
    const prev = document.querySelector(
      `.gmnotes-combat-token[data-combat-id="${CSS.escape(this.selectedItemId)}"]`
    );
    prev?.classList.remove('selected');
    this.selectedItemId = null;
    this.clearSwapMode();
  }

  // ===== SELEÇÃO / CLIQUE EM TOKEN =====

  setupSelectionHandler() {
    const container = document.getElementById('combat-order');
    if (!container) return;

    container.addEventListener('click', (e) => {
      if (this.confirmationActive) return;

      const item = e.target.closest('.gmnotes-combat-token');
      if (!item) return;

      // Ignora cliques em elementos do painel de condições
      if (
        e.target.closest('.gmnotes-token-conditions') ||
        e.target.closest('.gmnotes-condition-menu') ||
        e.target.closest('.gmnotes-conditions-add') ||
        e.target.closest('.gmnotes-condition')
      ) {
        return;
      }

      // Checkbox de ação
      const checkbox = e.target.closest('.gmnotes-token-checkbox');
      if (checkbox) {
        e.stopPropagation();
        this.toggleTokenAction(checkbox.dataset.tokenId);
        return;
      }

      // Botão de mover (◀ / ▶)
      const navBtn = e.target.closest('.gmnotes-token-nav-btn');
      if (navBtn) {
        e.stopPropagation();
        e.preventDefault();
        this.moveToken(item.dataset.combatId, navBtn.dataset.direction);
        return;
      }

      // Botões de ajuste de Vit / Con (agora delegados, sem onclick inline)
      const statBtn = e.target.closest('.gmnotes-token-stat-btn');
      if (statBtn) {
        e.stopPropagation();
        e.preventDefault();
        const stat = statBtn.dataset.stat;
        const change = parseInt(statBtn.dataset.change, 10);
        if (stat === 'vit') this.adjustCombatVit(item.dataset.combatId, change);
        else if (stat === 'con') this.adjustCombatCon(item.dataset.combatId, change);
        return;
      }

      // Clique no corpo do token = seleção / troca
      const clickedId = item.dataset.combatId;

      if (this.swapSourceId) {
        if (this.swapSourceId === clickedId) {
          this.clearSwapMode();
          this.clearSelection();
          this.parent.updateStatus('Seleção cancelada');
          this.renderCombatOrder();
          e.stopPropagation();
          return;
        }
        this.swapTokens(this.swapSourceId, clickedId);
        this.clearSwapMode();
        this.clearSelection();
        this.renderCombatOrder();
        this.parent.updateStatus('Troca realizada');
        e.stopPropagation();
        return;
      }

      if (this.selectedItemId === clickedId) {
        this.clearSelection();
        this.clearSwapMode();
        this.parent.updateStatus('Seleção cancelada');
        this.renderCombatOrder();
      } else {
        if (this.selectedItemId) {
          const prev = document.querySelector(
            `.gmnotes-combat-token[data-combat-id="${CSS.escape(this.selectedItemId)}"]`
          );
          prev?.classList.remove('selected', 'swap-source');
        }

        this.selectedItemId = clickedId;
        this.swapSourceId = clickedId;

        const name = this.combatOrder.find(i => i.id === clickedId)?.name;
        this.parent.updateStatus(`Clique em outro token para trocar com ${name}`);
        this.renderCombatOrder();
      }

      e.stopPropagation();
    });
  }

  setupClickOutsideHandler() {
    document.addEventListener('click', (e) => {
      if (this.confirmationActive) return;

      const combatList = document.getElementById('combat-order');
      const confirmationBox = document.querySelector('.gmnotes-confirmation-box');

      if (
        this.selectedItemId &&
        combatList &&
        !combatList.contains(e.target) &&
        !confirmationBox
      ) {
        this.clearSelection();
        this.clearSwapMode();
        this.parent.updateStatus('Seleção cancelada');
        this.renderCombatOrder();
      }
    });
  }

  // ===== ADIÇÃO / REMOÇÃO NA ORDEM =====

  updateCombatButtons() {
    this.parent.npcs?.renderNPCs();
    this.parent.players?.renderPlayers();
  }

  removeFromCombatById(id) {
    this.combatOrder = this.combatOrder.filter(item => item.id !== id);
    if (this.selectedItemId === id) {
      this.clearSelection();
      this.clearSwapMode();
    }
    this.renderCombatOrder();
    this.updateCombatButtons();
  }

  toggleNPCInCombat(npcId) {
    const npc = this.parent.npcs?.npcs.find(n => n.id === npcId);
    if (!npc) return;

    if (this.combatOrder.some(item => item.id === npcId)) {
      this.parent.updateStatus(`${npc.name} já está no combate`);
      return;
    }

    this.combatOrder.push({
      id: npc.id,
      name: npc.name,
      type: 'npc',
      vit: npc.vitCurrent,
      vitMax: npc.vitMax,
      con: npc.conCurrent || 0,
      conMax: npc.conMax || 0,
      color: this.npcColor,
      hasActed: false,
      conditions: []
    });

    this.renderCombatOrder();
    this.parent.npcs?.renderNPCs();
    this.parent.saveToStorage();
    this.parent.updateStatus(`${npc.name} adicionado`);
  }

  togglePlayerInCombat(playerId) {
    const player = this.parent.players?.players.find(p => p.id === playerId);
    if (!player) return;

    if (this.combatOrder.some(item => item.id === playerId)) {
      this.parent.updateStatus(`${player.name} já está no combate`);
      return;
    }

    this.combatOrder.push({
      id: player.id,
      name: player.name,
      type: 'player',
      color: this.playerColor,
      hasActed: false,
      conditions: []
    });

    this.renderCombatOrder();
    this.parent.players?.renderPlayers();
    this.parent.saveToStorage();
    this.parent.updateStatus(`${player.name} adicionado`);
  }

  // ===== RENDERIZAÇÃO =====

  renderCombatOrder() {
    // Garante que um menu de condições aberto seja fechado
    this.closeConditionMenu();

    const container = document.getElementById('combat-order');
    if (!container) return;

    if (this.combatOrder.length === 0) {
      container.className = '';
      container.innerHTML = '<div class="gmnotes-empty-state">Ordem vazia</div>';
      return;
    }

    container.className = 'gmnotes-combat-grid';
    container.innerHTML = this.combatOrder.map(item => this.renderToken(item)).join('');
  }

  renderToken(item) {
    const isSelected = item.id === this.selectedItemId;
    const isSwapSource = item.id === this.swapSourceId;
    const color = item.type === 'npc' ? this.npcColor : this.playerColor;
    const safeId = this.parent.escapeHtml(item.id);

    const currentIndex = this.combatOrder.findIndex(i => i.id === item.id);
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === this.combatOrder.length - 1;

    return `
      <div class="gmnotes-combat-token ${isSelected ? 'selected' : ''} ${isSwapSource ? 'swap-source' : ''}"
          data-combat-id="${safeId}"
          style="border-color: ${color}">

        <div class="gmnotes-token-header" style="background: ${color}">
          <div class="gmnotes-token-name">${this.parent.escapeHtml(item.name)}</div>
          <div class="gmnotes-token-type">
            <input type="checkbox" class="gmnotes-token-checkbox"
                  data-token-id="${safeId}"
                  ${item.hasActed ? 'checked' : ''}
                  title="Ação realizada">
          </div>
        </div>

        <div class="gmnotes-token-body">
          ${item.type === 'npc' ? this.renderTokenStats(item) : ''}
          ${this.renderConditions(item)}
        </div>

        ${isSelected ? `
          <div class="gmnotes-token-nav">
            <button class="gmnotes-token-nav-btn ${isFirst ? 'disabled' : ''}"
                    data-direction="left"
                    ${isFirst ? 'disabled' : ''}
                    title="Mover para esquerda">◀</button>
            <button class="gmnotes-token-nav-btn ${isLast ? 'disabled' : ''}"
                    data-direction="right"
                    ${isLast ? 'disabled' : ''}
                    title="Mover para direita">▶</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderTokenStats(item) {
    const safeId = this.parent.escapeHtml(item.id);
    return `
      <div class="gmnotes-token-stats">
        <div class="gmnotes-token-stat">
          <span class="gmnotes-token-stat-label">Vit</span>
          <div class="gmnotes-token-stat-control">
            <button class="gmnotes-token-stat-btn" data-stat="vit" data-change="-1" data-combat-id="${safeId}">-</button>
            <span class="gmnotes-token-stat-value">
              <span class="gmnotes-token-stat-current">${item.vit}</span>/
              <span class="gmnotes-token-stat-max">${item.vitMax}</span>
            </span>
            <button class="gmnotes-token-stat-btn" data-stat="vit" data-change="1" data-combat-id="${safeId}">+</button>
          </div>
        </div>
        <div class="gmnotes-token-stat">
          <span class="gmnotes-token-stat-label">Con</span>
          <div class="gmnotes-token-stat-control">
            <button class="gmnotes-token-stat-btn" data-stat="con" data-change="-1" data-combat-id="${safeId}">-</button>
            <span class="gmnotes-token-stat-value">
              <span class="gmnotes-token-stat-current">${item.con || 0}</span>/
              <span class="gmnotes-token-stat-max">${item.conMax || 0}</span>
            </span>
            <button class="gmnotes-token-stat-btn" data-stat="con" data-change="1" data-combat-id="${safeId}">+</button>
          </div>
        </div>
      </div>
    `;
  }

  renderConditions(item) {
    const conditions = item.conditions || [];
    const safeId = this.parent.escapeHtml(item.id);

    if (conditions.length === 0) {
      return `<button class="gmnotes-conditions-add" data-combat-id="${safeId}">+ Condição</button>`;
    }

    return `
      <div class="gmnotes-token-conditions" data-combat-id="${safeId}">
        ${conditions.map(emoji =>
          `<span class="gmnotes-condition" data-combat-id="${safeId}" data-condition="${emoji}">${emoji}</span>`
        ).join('')}
        <button class="gmnotes-conditions-add" data-combat-id="${safeId}">+</button>
      </div>
    `;
  }

  // ===== AÇÕES =====

  toggleTokenAction(tokenId) {
    const item = this.combatOrder.find(i => i.id === tokenId);
    if (!item) return;

    item.hasActed = !item.hasActed;
    this.parent.saveToStorage();

    const checkbox = document.querySelector(
      `.gmnotes-token-checkbox[data-token-id="${CSS.escape(tokenId)}"]`
    );
    if (checkbox) checkbox.checked = item.hasActed;

    this.parent.updateStatus(`${item.name} ${item.hasActed ? '✅ ação realizada' : '⏳ ação pendente'}`);
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

  // ===== MENU DE CONDIÇÕES =====

  setupConditionMenu() {
    document.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.gmnotes-conditions-add');
      if (addBtn) {
        e.stopPropagation();
        this.openConditionMenu(addBtn.dataset.combatId, addBtn);
        return;
      }

      const condition = e.target.closest('.gmnotes-condition');
      if (condition) {
        e.stopPropagation();
        this.toggleCondition(condition.dataset.combatId, condition.dataset.condition);
        return;
      }
    });
  }

  openConditionMenu(combatId, anchor) {
    // Fecha menu anterior, se houver
    this.closeConditionMenu();

    const menu = document.createElement('div');
    menu.className = 'gmnotes-condition-menu';
    menu.innerHTML = CONDITION_OPTIONS.map(emoji => `
      <button class="gmnotes-condition-option" data-condition="${emoji}">${emoji}</button>
    `).join('');

    // 🔧 CORREÇÃO PRINCIPAL: anexa ao <body>, não ao token
    document.body.appendChild(menu);

    // Posiciona como popover flutuante (fixed)
    menu.style.position = 'fixed';
    menu.style.zIndex = '9999';
    this.positionMenu(menu, anchor);

    // ----- Fechamento -----
    let outsideHandler = null;

    const close = () => {
      menu.remove();
      if (outsideHandler) {
        document.removeEventListener('click', outsideHandler);
        outsideHandler = null;
      }
      if (this._conditionMenuClose === close) {
        this._conditionMenuClose = null;
      }
    };

    this._conditionMenuClose = close;

    outsideHandler = (e) => {
      if (!menu.contains(e.target) && !anchor.contains(e.target)) {
        close();
      }
    };

    // Escolher uma opção fecha o menu
    menu.addEventListener('click', (e) => {
      const btn = e.target.closest('.gmnotes-condition-option');
      if (!btn) return;
      e.stopPropagation();
      this.toggleCondition(combatId, btn.dataset.condition);
      close();
    });

    // Registra o listener de "clique fora" depois do próximo tick,
    // para o clique que abriu o menu não o fechar imediatamente
    setTimeout(() => {
      if (this._conditionMenuClose === close) {
        document.addEventListener('click', outsideHandler);
      }
    }, 10);
  }

  closeConditionMenu() {
    if (typeof this._conditionMenuClose === 'function') {
      this._conditionMenuClose();
    }
  }

  positionMenu(menu, anchor) {
    const rect = anchor.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();

    let top = rect.bottom + 6;
    let left = rect.left;

    // Não deixa sair pela direita
    if (left + menuRect.width > window.innerWidth - 8) {
      left = window.innerWidth - menuRect.width - 8;
    }
    if (left < 8) left = 8;

    // Se não couber embaixo, coloca acima
    if (top + menuRect.height > window.innerHeight - 8) {
      top = Math.max(8, rect.top - menuRect.height - 6);
    }

    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
  }

  toggleCondition(combatId, emoji) {
    const item = this.combatOrder.find(i => i.id === combatId);
    if (!item) return;

    if (!item.conditions) item.conditions = [];

    const existingIndex = item.conditions.indexOf(emoji);
    if (existingIndex >= 0) {
      item.conditions.splice(existingIndex, 1);
    } else {
      item.conditions.push(emoji);
    }

    this.renderCombatOrder();
    this.parent.saveToStorage();
    this.parent.updateStatus('Condições atualizadas');
  }

  // ===== ARMAZENAMENTO =====

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
            conMax: npc.conMax || 0,
            color: this.npcColor,
            hasActed: item.hasActed || false,
            conditions: item.conditions || []
          };
        }
      }
      return {
        ...item,
        color: this.playerColor,
        hasActed: item.hasActed || false,
        conditions: item.conditions || []
      };
    });

    this.clearSelection();
    this.clearSwapMode();

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