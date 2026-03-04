// js/shield/gm-npcs.js
export class GMNPCs {
  constructor(parent) {
    this.parent = parent;
    this.npcs = [];
    this.filteredNpcs = null;
  }

  init() {
    this.setupNPCForm();
  }

  setupNPCForm() {
    const addBtn = document.getElementById('npc-add');
    const clearBtn = document.getElementById('npc-clear');
    const searchInput = document.querySelector('.gmnotes-search-input');

    addBtn?.addEventListener('click', () => this.addNPC());
    clearBtn?.addEventListener('click', () => this.clearNPCForm());
    searchInput?.addEventListener('input', (e) => this.searchNPCs(e.target.value));
  }

  getFormValues() {
    return {
      name: document.getElementById('npc-name')?.value || 'NPC sem nome',
      vit: parseInt(document.getElementById('npc-vit')?.value) || 10,
      con: parseInt(document.getElementById('npc-con')?.value) || 0,
      attributes: {
        f: Math.min(99, parseInt(document.getElementById('npc-f')?.value) || 10),
        v: Math.min(99, parseInt(document.getElementById('npc-v')?.value) || 10),
        d: Math.min(99, parseInt(document.getElementById('npc-d')?.value) || 10),
        a: Math.min(99, parseInt(document.getElementById('npc-a')?.value) || 10),
        i: Math.min(99, parseInt(document.getElementById('npc-i')?.value) || 10),
        s: Math.min(99, parseInt(document.getElementById('npc-s')?.value) || 10)
      },
      extra: document.getElementById('npc-extra')?.value || ''
    };
  }

  addNPC() {
    const form = this.getFormValues();
    
    const npc = {
      id: `npc_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name: form.name,
      vitMax: form.vit,
      vitCurrent: form.vit,
      conMax: form.con,
      conCurrent: form.con,
      attributes: form.attributes,
      extra: form.extra,
      createdAt: new Date().toISOString()
    };

    this.npcs.push(npc);
    this.clearNPCForm();
    this.resetSearch();
    this.renderNPCs();
    this.parent.saveToStorage();
    this.parent.updateStatus('NPC adicionado!');
  }

  clearNPCForm() {
    const defaults = {
      name: '',
      vit: '8',
      con: '8',
      f: '2',
      v: '2',
      d: '2',
      a: '2',
      i: '2',
      s: '2',
      extra: ''
    };

    document.getElementById('npc-name').value = defaults.name;
    document.getElementById('npc-vit').value = defaults.vit;
    document.getElementById('npc-con').value = defaults.con;
    document.getElementById('npc-f').value = defaults.f;
    document.getElementById('npc-v').value = defaults.v;
    document.getElementById('npc-d').value = defaults.d;
    document.getElementById('npc-a').value = defaults.a;
    document.getElementById('npc-i').value = defaults.i;
    document.getElementById('npc-s').value = defaults.s;
    document.getElementById('npc-extra').value = defaults.extra;
  }

  resetSearch() {
    this.filteredNpcs = null;
    const searchInput = document.querySelector('.gmnotes-search-input');
    if (searchInput) searchInput.value = '';
  }

  isInCombat(npcId) {
    return this.parent.combat?.combatOrder?.some(item => item.id === npcId) || false;
  }

  renderNPCs() {
    const container = document.getElementById('npc-list');
    if (!container) return;

    const npcsToRender = this.filteredNpcs || this.npcs;

    if (npcsToRender.length === 0) {
      container.innerHTML = '<div class="gmnotes-empty-state">Nenhum NPC criado</div>';
      return;
    }

    container.innerHTML = npcsToRender.map(npc => this.renderNPCItem(npc)).join('');
  }

  renderNPCItem(npc) {
    const inCombat = this.isInCombat(npc.id);
    const combatButtonClass = inCombat ? 'gmnotes-npc-btn combat-added' : 'gmnotes-npc-btn';
    const combatTitle = inCombat ? 'Já está no combate' : 'Adicionar ao Combate';
    
    return `
      <div class="gmnotes-npc-item" data-npc-id="${npc.id}">
        <div class="gmnotes-npc-header">
          <span class="gmnotes-npc-name">${this.parent.escapeHtml(npc.name)}</span>
          <div class="gmnotes-npc-actions">
            <button class="${combatButtonClass}" 
                    onclick="gmNotes.toggleNPCInCombat('${npc.id}', this)" 
                    title="${combatTitle}">⚔️</button>
            <button class="gmnotes-npc-btn" 
                    onclick="gmNotes.editNPC('${npc.id}')" 
                    title="Editar">✏️</button>
            <button class="gmnotes-npc-btn" 
                    onclick="gmNotes.duplicateNPC('${npc.id}')" 
                    title="Duplicar">📋</button>
            <button class="gmnotes-npc-btn" 
                    onclick="gmNotes.deleteNPC('${npc.id}')" 
                    title="Remover">🗑️</button>
          </div>
        </div>
        
        <div class="gmnotes-npc-stats">
          ${this.renderStatControl('Vit', npc.vitCurrent, npc.vitMax, npc.id)}
          ${this.renderStatControl('Con', npc.conCurrent, npc.conMax, npc.id)}
        </div>

        <div class="gmnotes-npc-attributes">
          ${Object.entries(npc.attributes).map(([key, value]) => 
            `<span class="gmnotes-attr">${key.toUpperCase()} ${value}</span>`
          ).join('')}
        </div>

        ${npc.extra ? this.renderExtra(npc.extra) : ''}
      </div>
    `;
  }

  renderStatControl(label, current, max, npcId) {
    const adjustFn = label === 'Vit' ? 'adjustVit' : 'adjustCon';
    
    return `
      <div class="gmnotes-stat-group">
        <span class="gmnotes-stat-label">${label}:</span>
        <div class="gmnotes-stat-control">
          <button class="gmnotes-stat-btn" 
                  onclick="gmNotes.${adjustFn}('${npcId}', -1)">-</button>
          <span class="gmnotes-stat-value">${current}/${max}</span>
          <button class="gmnotes-stat-btn" 
                  onclick="gmNotes.${adjustFn}('${npcId}', 1)">+</button>
        </div>
      </div>
    `;
  }

  renderExtra(extra) {
    return `
      <div class="gmnotes-npc-extra">
        <span class="gmnotes-extra-label">Extra:</span>
        <span class="gmnotes-extra-text">${this.parent.escapeHtml(extra)}</span>
      </div>
    `;
  }

  adjustVit(npcId, change) {
    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) return;
    
    npc.vitCurrent = Math.max(0, Math.min(npc.vitMax, npc.vitCurrent + change));
    this.renderNPCs();
    this.parent.combat?.adjustCombatVit(npcId, change);
    this.parent.saveToStorage();
  }

  adjustCon(npcId, change) {
    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) return;
    
    npc.conCurrent = Math.max(0, Math.min(npc.conMax, npc.conCurrent + change));
    this.renderNPCs();
    this.parent.combat?.adjustCombatCon(npcId, change);
    this.parent.saveToStorage();
  }

  editNPC(npcId) {
    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) return;

    document.getElementById('npc-name').value = npc.name;
    document.getElementById('npc-vit').value = npc.vitMax;
    document.getElementById('npc-con').value = npc.conMax;
    document.getElementById('npc-f').value = npc.attributes.f;
    document.getElementById('npc-v').value = npc.attributes.v;
    document.getElementById('npc-d').value = npc.attributes.d;
    document.getElementById('npc-a').value = npc.attributes.a;
    document.getElementById('npc-i').value = npc.attributes.i;
    document.getElementById('npc-s').value = npc.attributes.s;
    document.getElementById('npc-extra').value = npc.extra || '';

    this.deleteNPC(npcId, false);
    this.parent.switchTab('npcs');
  }

  duplicateNPC(npcId) {
    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) return;
    
    const duplicate = JSON.parse(JSON.stringify(npc));
    duplicate.id = `npc_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    duplicate.name = `${npc.name} (Cópia)`;
    
    this.npcs.push(duplicate);
    this.renderNPCs();
    this.parent.saveToStorage();
    this.parent.updateStatus('NPC duplicado!');
  }
  
  deleteNPC(npcId, render = true) {
    const wasInCombat = this.isInCombat(npcId);
    
    this.npcs = this.npcs.filter(n => n.id !== npcId);
    
    if (this.parent.combat && wasInCombat) {
      this.parent.combat.removeFromCombatById(npcId);
    }
    
    if (!render) return;
    
    this.renderNPCs();
    this.parent.combat?.renderCombatOrder();
    this.parent.saveToStorage();
    this.parent.updateStatus('NPC removido');
  }

  searchNPCs(query) {
    const searchTerm = query?.trim().toLowerCase();
    
    if (!searchTerm) {
      this.filteredNpcs = null;
    } else {
      this.filteredNpcs = this.npcs.filter(npc => 
        npc.name.toLowerCase().includes(searchTerm) ||
        (npc.extra && npc.extra.toLowerCase().includes(searchTerm))
      );
    }
    
    this.renderNPCs();
  }

  loadFromStorage(data) {
    this.npcs = data?.npcs || [];
    this.filteredNpcs = null;
    
    if (document.getElementById('npc-list')) {
      this.renderNPCs();
    }
  }

  getData() {
    return this.npcs;
  }
}