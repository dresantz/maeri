/**
 * sheet.js - Controle da ficha de personagem
 */

const SheetManager = (function() {
  'use strict';
  
  // ===== CONSTANTES =====
  const STORAGE_KEYS = {
    SHEET: 'maeri-sheet',
    CHARACTERS: 'maeri-characters',
    ACTIVE_CHARACTER: 'maeri-active-character'
  };
  
  const PANELS = ['complemento', 'narrativa', 'itens'];
  const AUTO_SAVE_DELAY = 500; // ms
  const FEEDBACK_DURATION = 3000; // ms
  
  // ===== ESTADO PRIVADO =====
  let isSheetOpen = false;
  let currentPanel = 'complemento';
  let saveTimeout = null;
  
  // ===== UTILITÁRIOS =====
  
  /**
   * Retorna o elemento modal da ficha
   */
  function getModal() {
    return document.getElementById('sheet-modal');
  }
  
  /**
   * Retorna o overlay da ficha
   */
  function getOverlay() {
    return document.getElementById('sheet-overlay');
  }
  
  /**
   * Define valor de um campo com segurança
   */
  function setFieldValue(selector, value) {
    const modal = getModal();
    if (!modal) return;
    
    const field = modal.querySelector(selector);
    if (field && value !== undefined && value !== null) {
      field.value = value;
    }
  }
  
  /**
   * Escapa HTML para prevenir XSS
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /* Mostra feedback temporário ao usuário */
  function showFeedback(message, type = 'success') {
    // Tenta encontrar qualquer feedback disponível
    const feedback = document.getElementById('import-feedback') || 
                     document.getElementById('save-feedback');
    
    if (!feedback) {
      return;
    }
    
    feedback.textContent = message;
    feedback.className = `feedback ${type}`;
    feedback.hidden = false;
    
    setTimeout(() => {
      feedback.hidden = true;
    }, FEEDBACK_DURATION);
  }
  
  /**
   * Remove overlay de diálogo existente
   */
  function removeExistingDialog() {
    const existingOverlay = document.querySelector('.dialog-overlay');
    if (existingOverlay) {
      document.body.removeChild(existingOverlay);
    }
  }
  
  // ===== COLETA DE DADOS =====
  
  /**
   * Coleta todos os dados atuais da ficha
   */
  function getCurrentSheetData() {
    const modal = getModal();
    if (!modal) return {};
    
    return {
      // Cabeçalho
      name: modal.querySelector('#char-name')?.value || '',
      level: modal.querySelector('#char-level')?.value || '1',
      
      // Atributos
      attributes: {
        f: modal.querySelector('#attr-f')?.value || '',
        v: modal.querySelector('#attr-v')?.value || '',
        d: modal.querySelector('#attr-d')?.value || '',
        s: modal.querySelector('#attr-s')?.value || '',
        i: modal.querySelector('#attr-i')?.value || '',
        a: modal.querySelector('#attr-a')?.value || ''
      },
      
      // Status Vitais
      vit: {
        current: modal.querySelector('#vit-current')?.value || '0',
        total: modal.querySelector('#vit-total')?.value || '0'
      },
      con: {
        current: modal.querySelector('#con-current')?.value || '0',
        total: modal.querySelector('#con-total')?.value || '0'
      },
      
      // Notas
      notas: modal.querySelector('#notas')?.value || '',
      
      // Painel Complemento
      complemento: {
        ser: modal.querySelector('#ser')?.value || '',
        estudos: modal.querySelector('#estudos')?.value || '',
        tecnicas: modal.querySelector('#tecnicas')?.value || '',
        magias: modal.querySelector('#magias')?.value || '',
        xp: {
          m: modal.querySelector('#xpm')?.value || '0',
          l: modal.querySelector('#xpl')?.value || '0',
          p: modal.querySelector('#xpp')?.value || '0'
        }
      },
      
      // Painel Narrativa
      narrativa: {
        arquetipo: modal.querySelector('#arquetipo')?.value || '',
        motivacao: modal.querySelector('#motivacao')?.value || '',
        disposicao: modal.querySelector('#disposicao')?.value || '',
        historia: modal.querySelector('#historia')?.value || '',
        contatos: modal.querySelector('#contatos')?.value || ''
      },
      
      // Painel Itens
      itens: {
        fo: modal.querySelector('#fo')?.value || '0',
        dp: modal.querySelector('#dp')?.value || '0',
        tc: modal.querySelector('#tc')?.value || '0',
        pesoFx2: modal.querySelector('#peso-fx2')?.value || '0',
        pesoFx4: modal.querySelector('#peso-fx4')?.value || '0',
        pesoTotal: modal.querySelector('#peso-total')?.value || '0',
        lista: modal.querySelector('#itens-lista')?.value || ''
      }
    };
  }
  
  // ===== POPULATE FIELDS =====
  
  /**
   * Preenche os campos da ficha com os dados fornecidos
   */
  function populateSheetFields(data) {
    if (!data) return;
    
    // Cabeçalho
    setFieldValue('#char-name', data.name);
    setFieldValue('#char-level', data.level);
    
    // Atributos
    if (data.attributes) {
      setFieldValue('#attr-f', data.attributes.f);
      setFieldValue('#attr-v', data.attributes.v);
      setFieldValue('#attr-d', data.attributes.d);
      setFieldValue('#attr-s', data.attributes.s);
      setFieldValue('#attr-i', data.attributes.i);
      setFieldValue('#attr-a', data.attributes.a);
    }
    
    // Status Vitais
    if (data.vit) {
      setFieldValue('#vit-current', data.vit.current);
      setFieldValue('#vit-total', data.vit.total);
    }
    if (data.con) {
      setFieldValue('#con-current', data.con.current);
      setFieldValue('#con-total', data.con.total);
    }
    
    // Notas
    setFieldValue('#notas', data.notas);
    
    // Painel Complemento
    if (data.complemento) {
      setFieldValue('#ser', data.complemento.ser);
      setFieldValue('#estudos', data.complemento.estudos);
      setFieldValue('#tecnicas', data.complemento.tecnicas);
      setFieldValue('#magias', data.complemento.magias);
      
      if (data.complemento.xp) {
        setFieldValue('#xpm', data.complemento.xp.m);
        setFieldValue('#xpl', data.complemento.xp.l);
        setFieldValue('#xpp', data.complemento.xp.p);
      }
    }
    
    // Painel Narrativa
    if (data.narrativa) {
      setFieldValue('#arquetipo', data.narrativa.arquetipo);
      setFieldValue('#motivacao', data.narrativa.motivacao);
      setFieldValue('#disposicao', data.narrativa.disposicao);
      setFieldValue('#historia', data.narrativa.historia);
      setFieldValue('#contatos', data.narrativa.contatos);
    }
    
    // Painel Itens
    if (data.itens) {
      setFieldValue('#fo', data.itens.fo);
      setFieldValue('#dp', data.itens.dp);
      setFieldValue('#tc', data.itens.tc);
      setFieldValue('#peso-fx2', data.itens.pesoFx2);
      setFieldValue('#peso-fx4', data.itens.pesoFx4);
      setFieldValue('#peso-total', data.itens.pesoTotal);
      setFieldValue('#itens-lista', data.itens.lista);
    }
  }
  
  // ===== PERSISTÊNCIA =====
  
  /**
   * Salva os dados atuais no localStorage
   */
  function saveSheetData() {
    const data = getCurrentSheetData();
    localStorage.setItem(STORAGE_KEYS.SHEET, JSON.stringify(data));
    
    // Disparar evento para outros componentes
    window.dispatchEvent(new CustomEvent('sheet:saved', { detail: data }));
  }
  
  /**
   * Carrega os dados salvos do localStorage
   */
  function loadSheetData() {
    const saved = localStorage.getItem(STORAGE_KEYS.SHEET);
    if (!saved) return;
    
    try {
      const data = JSON.parse(saved);
      populateSheetFields(data);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    }
  }
  
  // ===== AUTO-SAVE =====
  
  /**
   * Handler para auto-save com debounce
   */
  function handleSheetInput() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveSheetData, AUTO_SAVE_DELAY);
  }
  
  // ===== CONTROLE DO MODAL =====
  
  /**
   * Alterna entre os painéis da ficha
   */
  function switchPanel(panelId) {
    const modal = getModal();
    if (!modal) return;
    
    currentPanel = panelId;
    
    PANELS.forEach(id => {
      const panel = modal.querySelector(`#panel-${id}`);
      const tab = modal.querySelector(`#tab-${id}`);
      
      if (panel) panel.hidden = (id !== panelId);
      if (tab) tab.setAttribute('aria-expanded', (id === panelId) ? 'true' : 'false');
    });
  }
  
  /**
   * Abre o modal da ficha
   */
  function openSheet() {
    const modal = getModal();
    const overlay = getOverlay();
    
    if (isSheetOpen || !modal || !overlay) return;
    
    isSheetOpen = true;
    modal.classList.add('active');
    overlay.classList.add('active');
    document.body.classList.add('no-scroll');
    
    loadSheetData();
    switchPanel(currentPanel);
    
    // Adicionar listener de input com debounce
    modal.addEventListener('input', handleSheetInput);
    
    // Disparar evento
    window.dispatchEvent(new CustomEvent('sheet:opened'));
  }
  
  /**
   * Fecha o modal da ficha
   */
  function closeSheet() {
    const modal = getModal();
    const overlay = getOverlay();
    
    if (!isSheetOpen || !modal || !overlay) return;
    
    // Salvar antes de fechar
    saveSheetData();
    
    isSheetOpen = false;
    modal.classList.remove('active');
    overlay.classList.remove('active');
    document.body.classList.remove('no-scroll');
    
    // Remover listener
    modal.removeEventListener('input', handleSheetInput);
    clearTimeout(saveTimeout);
    
    // Disparar evento
    window.dispatchEvent(new CustomEvent('sheet:closed'));
  }
  
  // ===== LIMPAR FICHA =====
  
  /**
   * Limpa todos os campos da ficha
   */
  function clearSheet() {
    const modal = getModal();
    if (!modal) return;
    
    const allInputs = modal.querySelectorAll('input, textarea');
    allInputs.forEach(input => {
      if (input.type === 'number') {
        if (input.id.startsWith('attr-')) {
          input.value = '2';
        } else if (input.id === 'char-level') {
          input.value = '1';
        } else if (input.id === 'vit-total' || input.id === 'con-total') {
          input.value = '0';
        } else {
          input.value = '0';
        }
      } else {
        input.value = '';
      }
    });
    
    localStorage.removeItem(STORAGE_KEYS.SHEET);
    
    const confirmBox = document.getElementById('clear-confirmation');
    if (confirmBox) confirmBox.hidden = true;
    
    showFeedback('Ficha limpa com sucesso');
    
    // Disparar evento
    window.dispatchEvent(new CustomEvent('sheet:cleared'));
  }
  
  // ===== EXPORTAR/IMPORTAR =====
  
  /**
   * Exporta a ficha como arquivo JSON
   */
  function exportCharacterSheet() {
    try {
      const currentData = getCurrentSheetData();
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        app: 'Maeri RPG',
        data: currentData
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = currentData.name?.trim() 
        ? `${currentData.name.replace(/[^a-zA-Z0-9]/g, '_')}_maeri.json`
        : 'personagem_maeri.json';
      
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showFeedback('Ficha exportada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      showFeedback('Erro ao exportar ficha', 'error');
    }
  }
  
  /**
   * Valida dados importados
   */
  function validateImportedData(data) {
    if (!data || typeof data !== 'object') return false;
    
    // Se tiver metadados, verificar se tem data
    if (data.data) {
      return data.data && typeof data.data === 'object';
    }
    
    // Validação básica dos campos essenciais
    return (
      data.name !== undefined ||
      data.level !== undefined ||
      data.attributes !== undefined ||
      data.vit !== undefined ||
      data.con !== undefined
    );
  }
  
  /**
   * Aplica dados importados à ficha
   */
  function applyImportedData(importedData) {
    const sheetData = importedData.data || importedData;
    populateSheetFields(sheetData);
    saveSheetData();
    
    // Atualizar na área do jogador se houver personagem ativo
    const activeCharId = localStorage.getItem(STORAGE_KEYS.ACTIVE_CHARACTER);
    if (activeCharId) {
      const characters = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHARACTERS) || '{}');
      if (characters[activeCharId]) {
        characters[activeCharId].data = getCurrentSheetData();
        characters[activeCharId].lastModified = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(characters));
        window.dispatchEvent(new CustomEvent('characters-updated'));
      }
    }
    
    showFeedback('Ficha importada com sucesso!', 'success');
  }
  
  /**
   * Cria diálogo de confirmação para importação
   */
  function confirmImport(importedData) {
    removeExistingDialog();
    
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = 'dialog-box';
    dialog.innerHTML = `
      <h3 class="dialog-title">Importar Ficha</h3>
      <p class="dialog-message">
        Deseja substituir a ficha atual pelos dados importados?
        ${importedData.name ? `<br><br><strong>Personagem: ${escapeHtml(importedData.name)}</strong>` : ''}
      </p>
      <div class="dialog-actions">
        <button class="dialog-button dialog-button--save">Importar</button>
        <button class="dialog-button dialog-button--cancel">Cancelar</button>
      </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    const importBtn = dialog.querySelector('.dialog-button--save');
    const cancelBtn = dialog.querySelector('.dialog-button--cancel');
    
    importBtn.addEventListener('click', () => {
      applyImportedData(importedData);
      document.body.removeChild(overlay);
    });
    
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
  }
  
  /**
   * Handler para seleção de arquivo de importação
   */
  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.json')) {
      showFeedback('Arquivo deve ser .json', 'error');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const importedData = JSON.parse(content);
        
        if (!validateImportedData(importedData)) {
          showFeedback('Arquivo inválido ou corrompido', 'error');
          return;
        }
        
        confirmImport(importedData);
      } catch (error) {
        console.error('Erro ao importar:', error);
        showFeedback('Erro ao ler arquivo', 'error');
      }
      
      // Limpar input para permitir importar o mesmo arquivo novamente
      event.target.value = '';
    };
    
    reader.readAsText(file);
  }
  
  // ===== ÁREA DO JOGADOR =====
  
  /**
   * Salva a ficha atual na área do jogador
   */
  function saveToPlayerArea() {
    const modal = getModal();
    if (!modal) return;
    
    // Primeiro, salva o auto-save normal
    saveSheetData();
    
    // Carregar personagens existentes
    const characters = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHARACTERS) || '{}');
    const characterCount = Object.keys(characters).length;
    
    // Verificar se já tem 3 personagens
    if (characterCount >= 3) {
      showFeedback('Área do Jogador cheia! Remova um personagem.', 'error');
      return;
    }
    
    // Coletar dados atuais da ficha
    const currentData = getCurrentSheetData();
    
    // Gerar ID único para o personagem
    const characterId = 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    
    // Criar objeto do personagem
    const character = {
      id: characterId,
      name: currentData.name || 'Personagem sem nome',
      lastModified: new Date().toISOString(),
      data: currentData
    };
    
    // Salvar no localStorage
    characters[characterId] = character;
    localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(characters));
    
    showFeedback('✅ Ficha Salva na Área do Jogador');
    
    // Notificar outros componentes
    window.dispatchEvent(new CustomEvent('characters-updated'));
  }
  
  // ===== INICIALIZAÇÃO =====
  
  /**
   * Configura todos os event listeners
   */
  function init() {
    const modal = getModal();
    const sheetBtn = document.getElementById('sheet-button');
    const sheetClose = document.getElementById('sheet-close');
    const sheetOverlay = getOverlay();
    
    if (!modal || !sheetBtn) return;
    
    // Botões de abrir/fechar
    sheetBtn.addEventListener('click', openSheet);
    if (sheetClose) sheetClose.addEventListener('click', closeSheet);
    if (sheetOverlay) sheetOverlay.addEventListener('click', closeSheet);
    
    // Botões das abas
    const tabComplemento = modal.querySelector('#tab-complemento');
    const tabNarrativa = modal.querySelector('#tab-narrativa');
    const tabItens = modal.querySelector('#tab-itens');
    
    if (tabComplemento) {
      tabComplemento.addEventListener('click', () => switchPanel('complemento'));
    }
    if (tabNarrativa) {
      tabNarrativa.addEventListener('click', () => switchPanel('narrativa'));
    }
    if (tabItens) {
      tabItens.addEventListener('click', () => switchPanel('itens'));
    }
    
    // Sistema de limpar ficha
    const clearBtn = document.getElementById('clear-sheet-button');
    const confirmBtn = document.getElementById('confirm-clear-sheet');
    const cancelBtn = document.getElementById('cancel-clear-sheet');
    const confirmBox = document.getElementById('clear-confirmation');
    
    if (clearBtn && confirmBtn && cancelBtn && confirmBox) {
      clearBtn.addEventListener('click', () => confirmBox.hidden = false);
      cancelBtn.addEventListener('click', () => confirmBox.hidden = true);
      confirmBtn.addEventListener('click', clearSheet);
    }
    
    // Botões Exportar/Importar
    const exportBtn = document.getElementById('export-sheet');
    const importBtn = document.getElementById('import-sheet');
    const importFile = document.getElementById('import-file');
    const saveToAreaBtn = document.getElementById('save-to-player-area');
    
    if (exportBtn) {
      exportBtn.addEventListener('click', exportCharacterSheet);
    }
    
    if (importBtn && importFile) {
      importBtn.addEventListener('click', () => importFile.click());
    }
    
    if (importFile) {
      importFile.addEventListener('change', handleFileSelect);
    }
    
    if (saveToAreaBtn) {
      saveToAreaBtn.addEventListener('click', saveToPlayerArea);
    }
    
    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isSheetOpen) {
        closeSheet();
      }
    });
  }
  
  // ===== API PÚBLICA =====
  return {
    init: init,
    open: openSheet,
    close: closeSheet,
    save: saveSheetData,
    load: loadSheetData,
    clear: clearSheet,
    export: exportCharacterSheet,
    getData: getCurrentSheetData
  };
})();

// ===== INICIALIZAÇÃO AUTOMÁTICA =====

/**
 * Inicializa o SheetManager quando os modais estiverem carregados
 */
function initializeSheet() {
  if (document.getElementById('sheet-modal')) {
    SheetManager.init();
  } else {
    document.addEventListener('modals:loaded', SheetManager.init);
  }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSheet);
} else {
  initializeSheet();
}

// Exportar para uso em outros módulos (se estiver usando módulos ES)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SheetManager;
}