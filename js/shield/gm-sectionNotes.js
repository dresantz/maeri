// js/shield/gm-sectionNotes.js
export class GMSectionNotes {
  constructor(parent) {
    this.parent = parent;
    this.sessions = [];
    this.currentSession = null;
    this.autoSaveTimer = null;
  }

  init() {
    this.setupNotes();
    this.renderSessions();
  }

  setupNotes() {
    const textarea = document.getElementById('gmnotes-textarea');
    const saveBtn = document.getElementById('gmnotes-save');
    const clearBtn = document.getElementById('gmnotes-clear');

    textarea?.addEventListener('input', () => this.triggerAutoSave());
    saveBtn?.addEventListener('click', () => this.saveNotes());
    clearBtn?.addEventListener('click', () => this.showClearConfirm());
  }

  triggerAutoSave() {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => this.saveNotes(true), 2000);
  }

  saveNotes(auto = false) {
    const textarea = document.getElementById('gmnotes-textarea');
    if (!textarea) return;

    if (this.currentSession) {
      const session = this.sessions.find(s => s.name === this.currentSession);
      if (session) session.content = textarea.value;
    } else {
      localStorage.setItem('gmnotes_draft', textarea.value);
    }
    
    this.parent.saveToStorage();
    this.parent.updateStatus(auto ? 'Salvo' : 'Notas salvas!');
  }

  saveCurrentSession() {
    if (!this.currentSession) return;
    
    const textarea = document.getElementById('gmnotes-textarea');
    if (!textarea) return;

    const session = this.sessions.find(s => s.name === this.currentSession);
    if (session) session.content = textarea.value;
  }

  showNewSessionModal() {
    this.removeExistingModals();

    const modal = this.createModal(`
      <h4>Nova Sessão</h4>
      <input type="text" class="gmnotes-session-modal-input" placeholder="Nome da sessão..." maxlength="50" autofocus>
      <div class="gmnotes-session-modal-error" style="color: #ff4444; font-size: 0.9rem; margin-bottom: 1rem; display: none;"></div>
      <div class="gmnotes-session-modal-actions">
        <button class="gmnotes-session-modal-create">Criar</button>
        <button class="gmnotes-session-modal-cancel">Cancelar</button>
      </div>
    `, 'gmnotes-session-modal');

    const input = modal.querySelector('.gmnotes-session-modal-input');
    const errorDiv = modal.querySelector('.gmnotes-session-modal-error');
    const createBtn = modal.querySelector('.gmnotes-session-modal-create');
    const cancelBtn = modal.querySelector('.gmnotes-session-modal-cancel');

    input?.focus();

    const createSession = () => {
      const name = input?.value.trim();
      if (!name) {
        modal.remove();
        return;
      }

      const sessionExists = this.sessions.some(s => s.name.toLowerCase() === name.toLowerCase());
      
      if (sessionExists) {
        errorDiv.textContent = `Já existe uma sessão com o nome "${name}"`;
        errorDiv.style.display = 'block';
        input.classList.add('error');
        input.focus();
        return;
      }

      this.createNewSession(name);
      modal.remove();
    };

    input?.addEventListener('input', () => {
      errorDiv.style.display = 'none';
      input.classList.remove('error');
    });

    createBtn?.addEventListener('click', createSession);
    cancelBtn?.addEventListener('click', () => modal.remove());
    
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        createSession();
      }
      if (e.key === 'Escape') {
        modal.remove();
      }
    });
  }

  createNewSession(name) {
    const textarea = document.getElementById('gmnotes-textarea');
    const currentContent = textarea?.value || '';
    
    this.saveCurrentSession();
    
    const hasDraftContent = currentContent.trim() !== '';
    const isFirstSession = this.sessions.length === 0;
    
    const newSession = {
      name,
      content: (isFirstSession && hasDraftContent) ? currentContent : '',
      date: new Date().toISOString()
    };
    
    if (isFirstSession && hasDraftContent) {
      localStorage.removeItem('gmnotes_draft');
      this.parent.updateStatus(`Notas migradas para "${name}"!`);
    }
    
    this.sessions.push(newSession);
    this.currentSession = name;
    
    if (!(isFirstSession && hasDraftContent)) {
      if (textarea) textarea.value = '';
    }
    
    this.renderSessions();
    this.parent.saveToStorage();
    
    if (!(isFirstSession && hasDraftContent)) {
      this.parent.updateStatus(`Sessão "${name}" criada!`);
    }
  }

  loadSession(sessionName) {
    const cleanName = sessionName.trim();
    const session = this.sessions.find(s => s.name === cleanName);
    if (!session) return;

    this.saveCurrentSession();
    
    this.currentSession = cleanName;
    const textarea = document.getElementById('gmnotes-textarea');
    if (textarea) {
      textarea.value = session.content || '';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    this.renderSessions();
    this.parent.updateStatus(`Sessão "${cleanName}" carregada`);
  }

  showDeleteConfirm(sessionName) {
    const cleanName = sessionName.trim();
    this.removeExistingModals();

    const modal = this.createModal(`
      <p>Excluir a sessão "${cleanName}"?</p>
      <div class="gmnotes-confirm-actions">
        <button class="gmnotes-confirm-yes">Sim</button>
        <button class="gmnotes-confirm-no">Cancelar</button>
      </div>
    `, 'gmnotes-confirm-modal');

    const yesBtn = modal.querySelector('.gmnotes-confirm-yes');
    const noBtn = modal.querySelector('.gmnotes-confirm-no');

    yesBtn?.addEventListener('click', () => {
      this.deleteSession(cleanName);
      modal.remove();
    });

    noBtn?.addEventListener('click', () => modal.remove());
  }

  deleteSession(sessionName) {
    if (this.currentSession === sessionName) {
      const textarea = document.getElementById('gmnotes-textarea');
      if (textarea) {
        localStorage.setItem('gmnotes_draft', textarea.value);
      }
      this.currentSession = null;
    }
    
    this.sessions = this.sessions.filter(s => s.name !== sessionName);
    
    if (this.sessions.length === 0) {
      const textarea = document.getElementById('gmnotes-textarea');
      if (textarea) {
        textarea.value = localStorage.getItem('gmnotes_draft') || '';
      }
    }
    
    this.renderSessions();
    this.parent.saveToStorage();
    this.parent.updateStatus('Sessão excluída!');
  }

  showClearConfirm() {
    this.removeExistingModals();

    const modal = this.createModal(`
      <p>Limpar todas as notas?</p>
      <div class="gmnotes-confirm-actions">
        <button class="gmnotes-confirm-yes">Sim</button>
        <button class="gmnotes-confirm-no">Cancelar</button>
      </div>
    `, 'gmnotes-confirm-modal');

    const yesBtn = modal.querySelector('.gmnotes-confirm-yes');
    const noBtn = modal.querySelector('.gmnotes-confirm-no');

    yesBtn?.addEventListener('click', () => {
      const textarea = document.getElementById('gmnotes-textarea');
      if (textarea) {
        textarea.value = '';
        this.saveNotes();
      }
      modal.remove();
    });

    noBtn?.addEventListener('click', () => modal.remove());
  }

  createModal(content, className) {
    const modalHtml = `
      <div class="${className}">
        <div class="${className}-content">
          ${content}
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    return document.querySelector(`.${className}:last-child`);
  }

  removeExistingModals() {
    document.querySelectorAll('.gmnotes-confirm-modal, .gmnotes-session-modal').forEach(m => m.remove());
  }

  renderSessions() {
    const container = document.querySelector('.gmnotes-sessions-list');
    if (!container) return;

    if (this.sessions.length === 0) {
      container.innerHTML = '<button class="gmnotes-session-item gmnotes-session-new">+ Nova Sessão</button>';
    } else {
      container.innerHTML = this.sessions.map(s => `
        <div class="gmnotes-session-wrapper">
          <button class="gmnotes-session-item ${s.name === this.currentSession ? 'active' : ''}">
            ${this.parent.escapeHtml(s.name)}
          </button>
          <button class="gmnotes-session-delete" title="Excluir sessão">🗑️</button>
        </div>
      `).join('') + '<button class="gmnotes-session-item gmnotes-session-new">+ Nova Sessão</button>';
    }

    this.attachSessionListeners(container);
  }

  attachSessionListeners(container) {
    // Listeners para carregar sessões
    container.querySelectorAll('.gmnotes-session-item:not(.gmnotes-session-new)').forEach(btn => {
      btn.addEventListener('click', () => this.loadSession(btn.textContent.trim()));
    });

    // Listeners para deletar sessões
    container.querySelectorAll('.gmnotes-session-delete').forEach((btn, index) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showDeleteConfirm(this.sessions[index].name);
      });
    });

    // Listener para nova sessão (com clonagem para evitar múltiplos listeners)
    const newBtn = container.querySelector('.gmnotes-session-new');
    if (newBtn) {
      const newBtnClone = newBtn.cloneNode(true);
      newBtn.parentNode?.replaceChild(newBtnClone, newBtn);
      newBtnClone.addEventListener('click', () => this.showNewSessionModal());
    }
  }

  loadFromStorage(data) {
    this.sessions = data.sessions || [];
    this.currentSession = data.currentSession || null;
    
    setTimeout(() => {
      const textarea = document.getElementById('gmnotes-textarea');
      if (!textarea) return;

      if (this.currentSession) {
        const session = this.sessions.find(s => s.name === this.currentSession);
        textarea.value = session?.content || '';
      } else {
        textarea.value = localStorage.getItem('gmnotes_draft') || '';
      }
      
      this.renderSessions();
    }, 50);
  }

  getData() {
    return {
      sessions: this.sessions,
      currentSession: this.currentSession
    };
  }
}