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
  const AUTO_SAVE_DELAY = 500;
  const FEEDBACK_DURATION = 3000;
  
  // ===== ESTADO =====
  let isSheetOpen = false;
  let currentPanel = 'complemento';
  let saveTimeout = null;
  
  // ===== HELPERS =====
  
  function getModal() {
    return document.getElementById('sheet-modal');
  }
  
  function getOverlay() {
    return document.getElementById('sheet-overlay');
  }
  
  function getValue(id, defaultValue = '') {
    const el = document.getElementById(id);
    return el ? el.value : defaultValue;
  }
  
  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) {
      el.value = value;
    }
  }
  
  function scrollModalToBottom() {
    const modal = getModal();
    if (!modal) return;
    
    const scrollable = modal.querySelector('.sheet-content');
    if (scrollable) {
      requestAnimationFrame(() => {
        scrollable.scrollTo({
          top: scrollable.scrollHeight,
          behavior: 'smooth'
        });
      });
    }
  }
  
  function showFeedback(message, type = 'success', elementId = 'import-feedback') {
    const feedback = document.getElementById(elementId);
    if (!feedback) return;
    
    const baseClass = elementId === 'import-feedback' ? 'import-feedback' : 'save-feedback';
    feedback.textContent = message;
    feedback.className = `${baseClass} ${type}`;
    feedback.hidden = false;
    
    // ✨ Rola o modal até a parte inferior
    scrollModalToBottom();
    
    setTimeout(() => {
      feedback.hidden = true;
    }, FEEDBACK_DURATION);
  }
  
  function removeExistingDialog() {
    document.querySelector('.dialog-overlay')?.remove();
  }
  
  // ===== COLETA E PREENCHIMENTO =====
  
  function getCurrentSheetData() {
    return {
      name: getValue('char-name'),
      level: getValue('char-level', '1'),
      
      attributes: {
        f: getValue('attr-f'),
        v: getValue('attr-v'),
        d: getValue('attr-d'),
        s: getValue('attr-s'),
        i: getValue('attr-i'),
        a: getValue('attr-a')
      },
      
      vit: {
        current: getValue('vit-current', '0'),
        total: getValue('vit-total', '0')
      },
      con: {
        current: getValue('con-current', '0'),
        total: getValue('con-total', '0')
      },
      
      notas: getValue('notas'),
      
      complemento: {
        ser: getValue('ser'),
        estudos: getValue('estudos'),
        conhecimentos: getValue('conhecimentos'),
        classes: getValue('classes'),
        xp: {
          m: getValue('xpm', '0'),
          l: getValue('xpl', '0'),
          p: getValue('xpp', '0')
        }
      },
      
      narrativa: {
        arquetipo: getValue('arquetipo'),
        motivacao: getValue('motivacao'),
        disposicao: getValue('disposicao'),
        segredos: getValue('segredo'),
        historia: getValue('historia'),
        contatos: getValue('contatos')
      },
      
      itens: {
        fo: getValue('fo', '0'),
        dp: getValue('dp', '0'),
        tc: getValue('tc', '0'),
        pesoFx2: getValue('peso-fx2', '0'),
        pesoFx4: getValue('peso-fx4', '0'),
        pesoTotal: getValue('peso-total', '0'),
        lista: getValue('itens-lista')
      }
    };
  }
  
  function populateSheetFields(data) {
    if (!data) return;
    
    const mappings = [
      ['char-name', data.name],
      ['char-level', data.level],
      ['attr-f', data.attributes?.f],
      ['attr-v', data.attributes?.v],
      ['attr-d', data.attributes?.d],
      ['attr-s', data.attributes?.s],
      ['attr-i', data.attributes?.i],
      ['attr-a', data.attributes?.a],
      ['vit-current', data.vit?.current],
      ['vit-total', data.vit?.total],
      ['con-current', data.con?.current],
      ['con-total', data.con?.total],
      ['notas', data.notas],
      ['ser', data.complemento?.ser],
      ['estudos', data.complemento?.estudos],
      ['conhecimentos', data.complemento?.conhecimentos],
      ['classes', data.complemento?.classes],
      ['xpm', data.complemento?.xp?.m],
      ['xpl', data.complemento?.xp?.l],
      ['xpp', data.complemento?.xp?.p],
      ['arquetipo', data.narrativa?.arquetipo],
      ['motivacao', data.narrativa?.motivacao],
      ['disposicao', data.narrativa?.disposicao],
      ['segredo', data.narrativa?.segredos],
      ['historia', data.narrativa?.historia],
      ['contatos', data.narrativa?.contatos],
      ['fo', data.itens?.fo],
      ['dp', data.itens?.dp],
      ['tc', data.itens?.tc],
      ['peso-fx2', data.itens?.pesoFx2],
      ['peso-fx4', data.itens?.pesoFx4],
      ['peso-total', data.itens?.pesoTotal],
      ['itens-lista', data.itens?.lista]
    ];
    
    mappings.forEach(([id, value]) => setValue(id, value));
  }
  
  // ===== PERSISTÊNCIA =====
  
  function saveSheetData() {
    const data = getCurrentSheetData();
    localStorage.setItem(STORAGE_KEYS.SHEET, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('sheet:saved', { detail: data }));
    return data;
  }
  
  function loadSheetData() {
    const saved = localStorage.getItem(STORAGE_KEYS.SHEET);
    if (!saved) return;
    
    try {
      populateSheetFields(JSON.parse(saved));
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    }
  }
  
  function handleSheetInput() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveSheetData, AUTO_SAVE_DELAY);
  }
  
  // ===== CONTROLE DO MODAL =====
  
  function switchPanel(panelId) {
    currentPanel = panelId;
    
    PANELS.forEach(id => {
      const panel = document.getElementById(`panel-${id}`);
      const tab = document.getElementById(`tab-${id}`);
      
      if (panel) panel.hidden = id !== panelId;
      if (tab) tab.setAttribute('aria-expanded', id === panelId ? 'true' : 'false');
    });
  }
  
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
    modal.addEventListener('input', handleSheetInput);
    
    window.dispatchEvent(new CustomEvent('sheet:opened'));
  }
  
  function closeSheet() {
    const modal = getModal();
    const overlay = getOverlay();
    
    if (!isSheetOpen || !modal || !overlay) return;
    
    saveSheetData();
    
    isSheetOpen = false;
    modal.classList.remove('active');
    overlay.classList.remove('active');
    document.body.classList.remove('no-scroll');
    
    modal.removeEventListener('input', handleSheetInput);
    clearTimeout(saveTimeout);
    
    window.dispatchEvent(new CustomEvent('sheet:closed'));
  }
  
  // ===== LIMPAR FICHA =====
  
  function resetNumericField(id, defaultValue) {
    setValue(id, defaultValue);
  }
  
  function clearSheet() {
    const modal = getModal();
    if (!modal) return;
    
    modal.querySelectorAll('input[type="text"], textarea').forEach(el => el.value = '');
    
    resetNumericField('char-level', '1');
    resetNumericField('vit-current', '0');
    resetNumericField('vit-total', '0');
    resetNumericField('con-current', '0');
    resetNumericField('con-total', '0');
    resetNumericField('xpm', '0');
    resetNumericField('xpl', '0');
    resetNumericField('xpp', '0');
    resetNumericField('fo', '0');
    resetNumericField('dp', '0');
    resetNumericField('tc', '0');
    resetNumericField('peso-fx2', '0');
    resetNumericField('peso-fx4', '0');
    resetNumericField('peso-total', '0');
    
    ['f', 'v', 'd', 's', 'i', 'a'].forEach(attr => {
      resetNumericField(`attr-${attr}`, '2');
    });
    
    localStorage.removeItem(STORAGE_KEYS.SHEET);
    
    const confirmBox = document.getElementById('clear-confirmation');
    if (confirmBox) confirmBox.hidden = true;
    
    showFeedback('Ficha limpa com sucesso', 'success', 'import-feedback');
    window.dispatchEvent(new CustomEvent('sheet:cleared'));
  }
  
  // ===== EXPORTAÇÃO/IMPORTAÇÃO =====
  
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
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showFeedback('Ficha exportada com sucesso!', 'success', 'import-feedback');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      showFeedback('Erro ao exportar ficha', 'error', 'import-feedback');
    }
  }
  
  function validateImportedData(data) {
    if (!data || typeof data !== 'object') return false;
    const sheetData = data.data || data;
    return (
      sheetData.name !== undefined ||
      sheetData.level !== undefined ||
      sheetData.attributes !== undefined ||
      sheetData.vit !== undefined ||
      sheetData.con !== undefined
    );
  }
  
  function applyImportedData(importedData) {
    const sheetData = importedData.data || importedData;
    populateSheetFields(sheetData);
    saveSheetData();
    
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
    
    showFeedback('Ficha importada com sucesso!', 'success', 'import-feedback');
  }
  
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
    
    dialog.querySelector('.dialog-button--save').addEventListener('click', () => {
      applyImportedData(importedData);
      overlay.remove();
    });
    
    dialog.querySelector('.dialog-button--cancel').addEventListener('click', () => {
      overlay.remove();
    });
  }
  
  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.json')) {
      showFeedback('Arquivo deve ser .json', 'error', 'import-feedback');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        if (!validateImportedData(importedData)) {
          showFeedback('Arquivo inválido ou corrompido', 'error', 'import-feedback');
          return;
        }
        
        confirmImport(importedData);
      } catch (error) {
        console.error('Erro ao importar:', error);
        showFeedback('Erro ao ler arquivo', 'error', 'import-feedback');
      }
      
      event.target.value = '';
    };
    
    reader.readAsText(file);
  }
  
  // ===== ÁREA DO JOGADOR =====
  
  function saveToPlayerArea() {
    const modal = getModal();
    if (!modal) return;
    
    saveSheetData();
    
    const characters = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHARACTERS) || '{}');
    if (Object.keys(characters).length >= 3) {
      showFeedback('Área do Jogador cheia! Remova um personagem.', 'error', 'save-feedback');
      return;
    }
    
    const currentData = getCurrentSheetData();
    const characterId = 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const character = {
      id: characterId,
      name: currentData.name || 'Personagem sem nome',
      lastModified: new Date().toISOString(),
      data: currentData
    };
    
    characters[characterId] = character;
    localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(characters));
    
    showFeedback('✅ Ficha Salva na Área do Jogador', 'success', 'save-feedback');
    window.dispatchEvent(new CustomEvent('characters-updated'));
  }
  
  // ===== INICIALIZAÇÃO =====
  
  function init() {
    const modal = getModal();
    const sheetBtn = document.getElementById('sheet-button');
    
    if (!modal || !sheetBtn) return;
    
    sheetBtn.addEventListener('click', openSheet);
    document.getElementById('sheet-close')?.addEventListener('click', closeSheet);
    getOverlay()?.addEventListener('click', closeSheet);
    
    // Abas
    const tabs = {
      'tab-complemento': 'complemento',
      'tab-narrativa': 'narrativa',
      'tab-itens': 'itens'
    };
    
    Object.entries(tabs).forEach(([tabId, panelId]) => {
      document.getElementById(tabId)?.addEventListener('click', () => switchPanel(panelId));
    });
    
    // Toggle das Notas
    const notesToggle = document.getElementById('sheet-notes-toggle');
    const notesContent = document.getElementById('sheet-notes-content');
    if (notesToggle && notesContent) {
      notesToggle.addEventListener('click', () => {
        const isExpanded = notesToggle.getAttribute('aria-expanded') === 'true';
        notesContent.hidden = isExpanded;
        notesToggle.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
        notesToggle.textContent = isExpanded ? '+ Notas' : '− Notas';
      });
    }
    
    // Limpar ficha
    const clearBtn = document.getElementById('clear-sheet-button');
    const confirmBtn = document.getElementById('confirm-clear-sheet');
    const cancelBtn = document.getElementById('cancel-clear-sheet');
    const confirmBox = document.getElementById('clear-confirmation');
    
    if (clearBtn && confirmBtn && cancelBtn && confirmBox) {
      clearBtn.addEventListener('click', () => {
        confirmBox.hidden = false;
        scrollModalToBottom(); // 🆕 rola até a confirmação
      });
      
      cancelBtn.addEventListener('click', () => confirmBox.hidden = true);
      confirmBtn.addEventListener('click', clearSheet);
    }
    
    // Exportar/Importar
    document.getElementById('export-sheet')?.addEventListener('click', exportCharacterSheet);
    
    const importBtn = document.getElementById('import-sheet');
    const importFile = document.getElementById('import-file');
    
    if (importBtn && importFile) {
      importBtn.addEventListener('click', () => importFile.click());
      importFile.addEventListener('change', handleFileSelect);
    }
    
    document.getElementById('save-to-player-area')?.addEventListener('click', saveToPlayerArea);
    
    // Botões rápidos: Magias e Dados
    const toSpellsBtn = document.getElementById('sheet-to-spells');
    const toDiceBtn = document.getElementById('sheet-to-dice');
    
    if (toSpellsBtn) {
      toSpellsBtn.addEventListener('click', () => {
        closeSheet();
        document.getElementById('spells-button')?.click();
      });
    }
    
    if (toDiceBtn) {
      toDiceBtn.addEventListener('click', () => {
        closeSheet();
        document.getElementById('dice-toggle')?.click();
      });
    }
    
    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isSheetOpen) closeSheet();
    });
  }
  
  // ===== API PÚBLICA =====
  return {
    init,
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

function initializeSheet() {
  if (document.getElementById('sheet-modal')) {
    SheetManager.init();
  } else {
    document.addEventListener('modals:loaded', SheetManager.init);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSheet);
} else {
  initializeSheet();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SheetManager;
}