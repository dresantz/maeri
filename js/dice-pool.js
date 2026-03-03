/**
 * dice-pool.js - Lógica para pool de dados 3D individuais
 * Versão refatorada com prevenção de duplicação de eventos
 */

class DicePool {
  constructor() {
    // ===== CONSTANTES =====
    this.MAX_DICE = 6;
    this.HISTORY_LIMIT = 10;
    this.ANIMATION_DURATION = 1200;
    this.FEEDBACK_DURATION = 1500;
    this.REMOVE_FEEDBACK_DURATION = 500;
    
    // Estado dos dados
    this.diceCounts = {
      d2: 0,
      d3: 0,
      d6: 0
    };
    
    this.dicePool = [];
    this.history = [];
    this.isRolling = false;
    this.pendingResults = null;
    this.pendingTotal = null;
    
    // Controle de inicialização
    this.isSetup = false;
    this.abortController = null;
    this.animationStyles = new Set();
    
    // Configurações de rotação para cada face do dado
    this.faceRotations = {
      1: [-0.1, 0.3, -1],     // Face 1 - front
      2: [-0.1, 0.6, -0.4],   // Face 2 - up
      3: [-0.85, -0.42, 0.73], // Face 3 - left
      4: [-0.8, 0.3, -0.75],  // Face 4 - right
      5: [0.3, 0.45, 0.9],    // Face 5 - bottom
      6: [-0.16, 0.6, 0.18]   // Face 6 - back
    };

    // Configurações de rotação para D3
    this.d3FaceMappings = {
      1: 1,  // Face 1 → valor 1
      2: 1,  // Face 2 → valor 1
      3: 2,  // Face 3 → valor 2
      4: 2,  // Face 4 → valor 2
      5: 3,  // Face 5 → valor 3
      6: 3   // Face 6 → valor 3
    };

    this.d2FaceMappings = {
      1: 1,  // Face 1 → valor 1
      2: 1,  // Face 2 → valor 1
      3: 1,  // Face 3 → valor 1
      4: 2,  // Face 4 → valor 2
      5: 2,  // Face 5 → valor 2
      6: 2   // Face 6 → valor 2
    };
    
    // Rotação padrão - face 1
    this.defaultRotation = { 
      x: this.faceRotations[1][0], 
      y: this.faceRotations[1][1], 
      z: this.faceRotations[1][2] 
    };
    
    this.init();
  }
  
  // ===== INICIALIZAÇÃO =====
  
  init() {
    const initCallback = () => this.setupEventListeners();
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initCallback);
    } else {
      this.setupEventListeners();
    }
    
    document.addEventListener('modals:loaded', initCallback);
  }
  
  // ===== SETUP DE EVENTOS (CORRIGIDO) =====
  
  setupEventListeners() {
    if (!this.checkElements()) return;
    
    // Se já configurou, não configura de novo
    if (this.isSetup) {
      return;
    }
    
    // Cancela listeners anteriores se existirem
    if (this.abortController) {
      this.abortController.abort();
    }
    
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    
    this.setupDiceButtons(signal);
    this.setupControlButtons(signal);
    
    this.isSetup = true;
  }
  
  setupDiceButtons(signal) {
    document.querySelectorAll('.dice-btn[data-sides]').forEach(btn => {
      const button = btn.tagName === 'BUTTON' ? btn : btn.querySelector('button');
      if (!button) return;
      
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const sides = parseInt(btn.dataset.sides);
        this.addDiceToPool(sides);
      }, { signal });
    });
  }
  
  setupControlButtons(signal) {
    const rollBtn = document.getElementById('roll-button');
    const clearAllBtn = document.getElementById('clear-all');
    const clearHistoryBtn = document.getElementById('clear-history');

    if (rollBtn) {
      rollBtn.addEventListener('click', () => this.rollDice(), { signal });
    }

    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => this.clearPool(), { signal });
    }

    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => this.clearHistory(), { signal });
    }
  }
  
  // ===== VALIDAÇÕES =====
  
  checkElements() {
    const elements = [
      'dice-pool',
      'result-output',
      'total-output',
      'history-output'
    ];
    
    return elements.every(id => document.getElementById(id));
  }
  
  // ===== GERENCIAMENTO DO POOL =====
  
  addDiceToPool(sides) {
    // Verifica se já atingiu o limite de dados
    if (this.dicePool.length >= this.MAX_DICE) {
      this.showLimitFeedback(sides);
      return;
    }
  
    // Atualiza contadores
    switch(sides) {
      case 2:
        this.diceCounts.d2++;
        break;
      case 3:
        this.diceCounts.d3++;
        break;
      case 6:
        this.diceCounts.d6++;
        break;
      default:
        return;
    }
  
    const newDice = {
      sides: sides,
      value: null,
      id: this.generateDiceId(),
      rotation: { ...this.defaultRotation }
    };
  
    this.dicePool.push(newDice);
    this.updateCounters();
    this.renderPool();
  }
  
  generateDiceId() {
    return 'dice-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
  
  removeDiceFromPool(id) {
    const index = this.dicePool.findIndex(dice => dice.id === id);
    if (index === -1) return;
    
    const dice = this.dicePool[index];
    
    switch(dice.sides) {
      case 2:
        this.diceCounts.d2--;
        break;
      case 3:
        this.diceCounts.d3--;
        break;
      case 6:
        this.diceCounts.d6--;
        break;
    }
    
    this.dicePool.splice(index, 1);
    this.updateCounters();
    this.renderPool();
  }
  
  clearPool() {
    this.dicePool = [];
    this.diceCounts = { d2: 0, d3: 0, d6: 0 };
    this.updateCounters();
    this.renderPool();
    
    this.updateDisplay('—', '—');
  }
  
  // ===== FEEDBACK VISUAL =====
  
  showLimitFeedback(sides) {
    // Feedback no pool
    const poolContainer = document.getElementById('dice-pool');
    if (poolContainer) {
      this.applyTemporaryStyle(poolContainer, {
        backgroundColor: 'rgba(255, 68, 68, 0.3)',
        outline: '2px solid #ff4444',
        transition: 'background-color 0.3s ease'
      }, this.REMOVE_FEEDBACK_DURATION);
    }
    
    // Feedback no botão
    const btn = document.querySelector(`.dice-btn[data-sides="${sides}"] button`);
    if (btn) {
      this.applyTemporaryStyle(btn, {
        backgroundColor: '#ff4444',
        color: 'white',
        borderColor: '#ff4444',
        transition: 'all 0.3s ease'
      }, this.REMOVE_FEEDBACK_DURATION);
    }
  }
  
  applyTemporaryStyle(element, styles, duration) {
    const originalStyles = {};
    
    Object.keys(styles).forEach(prop => {
      originalStyles[prop] = element.style[prop];
      element.style[prop] = styles[prop];
    });
    
    setTimeout(() => {
      Object.keys(styles).forEach(prop => {
        element.style[prop] = originalStyles[prop];
      });
    }, duration);
  }
  
  // ===== RENDERIZAÇÃO =====
  
  updateCounters() {
    const countD2 = document.getElementById('count-d2');
    const countD3 = document.getElementById('count-d3');
    const countD6 = document.getElementById('count-d6');
    
    if (countD2) countD2.textContent = this.diceCounts.d2;
    if (countD3) countD3.textContent = this.diceCounts.d3;
    if (countD6) countD6.textContent = this.diceCounts.d6;
  }
  
  updateDisplay(result, total) {
    const resultEl = document.getElementById('result-output');
    const totalEl = document.getElementById('total-output');
    
    if (resultEl) resultEl.textContent = result;
    if (totalEl) totalEl.textContent = total;
  }
  
  renderPool() {
    const poolContainer = document.getElementById('dice-pool');
    if (!poolContainer) return;
    
    poolContainer.innerHTML = '';
    
    if (this.dicePool.length === 0) {
      poolContainer.innerHTML = '<p class="empty-pool">Nenhum dado no pool</p>';
      return;
    }
    
    this.dicePool.forEach(dice => {
      const diceElement = this.createDiceElement(dice);
      poolContainer.appendChild(diceElement);
      this.setupDiceEventListeners(diceElement, dice);
    });
  }
  
  createDiceElement(dice) {
    const diceElement = document.createElement('div');
    diceElement.className = 'pool-dice-3d';
    diceElement.dataset.id = dice.id;
    
    const transformStyle = this.getDiceTransformStyle(dice);
    const diceClass = this.getDiceClass(dice.sides);
    
    diceElement.innerHTML = `
      <div class="dice-3d ${diceClass}" id="${dice.id}" data-value="${dice.value || ''}" style="transform: ${transformStyle};">
        <div class="dice-face-3d front"></div>
        <div class="dice-face-3d up"></div>
        <div class="dice-face-3d left"></div>
        <div class="dice-face-3d right"></div>
        <div class="dice-face-3d bottom"></div>
        <div class="dice-face-3d back"></div>
      </div>
      <div class="dice-info" style="position: relative; z-index: 10;">
        <span class="dice-sides">D${dice.sides}</span>
        ${dice.value ? `<span class="dice-value-badge">${dice.value}</span>` : ''}
      </div>
      <button class="remove-dice-3d" aria-label="Remover dado">✕</button>
    `;
    
    return diceElement;
  }
  
  getDiceTransformStyle(dice) {
    if (!dice.value) {
      return `rotate3d(${dice.rotation.x}, ${dice.rotation.y}, ${dice.rotation.z}, 180deg)`;
    }
    
    const faceToShow = this.getFaceToShow(dice);
    const rot = this.faceRotations[faceToShow];
    return `rotate3d(${rot[0]}, ${rot[1]}, ${rot[2]}, 180deg)`;
  }
  
  getDiceClass(sides) {
    if (sides === 3) return 'd3';
    if (sides === 2) return 'd2';
    return '';
  }
  
  getFaceToShow(dice) {
    if (!dice.value) return 1;
    
    if (dice.sides === 6) {
      return dice.value;
    }
    
    const mapping = dice.sides === 3 ? this.d3FaceMappings : this.d2FaceMappings;
    const possibleFaces = Object.keys(mapping)
      .filter(face => mapping[face] === dice.value)
      .map(Number);
    
    const randomIndex = Math.floor(Math.random() * possibleFaces.length);
    return possibleFaces[randomIndex];
  }
  
  setupDiceEventListeners(diceElement, dice) {
    // Selecionar dado
    diceElement.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-dice-3d')) return;
      
      document.querySelectorAll('.pool-dice-3d').forEach(el => {
        el.classList.remove('selected');
      });
      
      diceElement.classList.add('selected');
    });
    
    // Remover dado
    diceElement.querySelector('.remove-dice-3d').addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeDiceFromPool(dice.id);
    });
  }
  
  // ===== ROLAGEM DE DADOS =====
  
  rollDice() {
    if (this.dicePool.length === 0) {
      this.showEmptyPoolWarning();
      return;
    }
    
    if (this.isRolling) return;
    
    this.startRoll();
    
    const results = this.dicePool.map(dice => {
      dice.value = this.rollSingleDice(dice.sides);
      return dice.value;
    });
    
    this.pendingResults = results;
    this.pendingTotal = results.reduce((sum, val) => sum + val, 0);
    
    this.updateDisplay('—', '—');
    this.animateAllDice();
  }
  
  rollSingleDice(sides) {
    if (sides === 6) return Math.floor(Math.random() * 6) + 1;
    if (sides === 3) return Math.floor(Math.random() * 3) + 1;
    if (sides === 2) return Math.floor(Math.random() * 2) + 1;
    return Math.floor(Math.random() * sides) + 1;
  }
  
  startRoll() {
    this.isRolling = true;
    this.setButtonsDisabled(true);
  }
  
  showEmptyPoolWarning() {
    const poolContainer = document.getElementById('dice-pool');
    if (!poolContainer) return;
    
    const originalContent = poolContainer.innerHTML;
    poolContainer.innerHTML = '<p class="empty-pool warning">Adicione dados ao pool primeiro!</p>';
    
    setTimeout(() => {
      this.renderPool();
    }, this.FEEDBACK_DURATION);
  }
  
  animateAllDice() {
    const diceToAnimate = this.dicePool.filter(d => [2, 3, 6].includes(d.sides));
    
    if (diceToAnimate.length === 0) {
      this.finishRoll();
      return;
    }
    
    let animatedCount = 0;
    diceToAnimate.forEach(dice => {
      this.animateSingleDice(dice.id, dice.value, dice.sides, () => {
        animatedCount++;
        if (animatedCount === diceToAnimate.length) {
          this.finishRoll();
        }
      });
    });
  }
  
  animateSingleDice(diceId, finalValue, sides, callback) {
    const diceElement = document.getElementById(diceId);
    if (!diceElement) {
      callback();
      return;
    }

    const poolDice = diceElement.closest('.pool-dice-3d');
    const diceInfo = poolDice.querySelector('.dice-info');
    
    if (diceInfo) diceInfo.style.opacity = '0';
    
    const faceToShow = this.getFaceFromValue(sides, finalValue);
    const finalRotation = this.faceRotations[faceToShow];
    const animationName = this.createAnimation(finalRotation);
    
    diceElement.style.animation = 'none';
    void diceElement.offsetWidth;
    diceElement.style.animation = `${animationName} 1.2s cubic-bezier(0.25, 0.1, 0.15, 1) forwards`;
    
    setTimeout(() => {
      diceElement.style.animation = '';
      diceElement.style.transform = `rotate3d(${finalRotation[0]}, ${finalRotation[1]}, ${finalRotation[2]}, 180deg)`;
      
      this.removeAnimation(animationName);
      
      if (diceInfo) {
        diceInfo.style.opacity = '1';
        diceInfo.style.zIndex = '20';
      }
      
      callback();
    }, this.ANIMATION_DURATION);
  }
  
  getFaceFromValue(sides, value) {
    if (sides === 6) return value;
    
    const mapping = sides === 3 ? this.d3FaceMappings : this.d2FaceMappings;
    const possibleFaces = Object.keys(mapping)
      .filter(face => mapping[face] === value)
      .map(Number);
    
    const randomIndex = Math.floor(Math.random() * possibleFaces.length);
    return possibleFaces[randomIndex];
  }
  
  createAnimation(finalRotation) {
    const animationName = `rollTo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const keyframes = [
      { x: 0.5, y: 0.8, z: 0.7, deg: 270 },
      { x: 0.9, y: 0.7, z: 0.1, deg: 360 },
      { x: 0.6, y: 1.0, z: 0.5, deg: 450 },
      { x: 0.7, y: 1.1, z: 0.5, deg: 540 },
      { x: 0.1, y: 0.9, z: 0.7, deg: 630 },
      { x: 1.0, y: 0.1, z: 0.9, deg: 720 },
      { x: 0.7, y: 1.0, z: 0.1, deg: 810 },
      { x: 0.8, y: 0.2, z: 0.6, deg: 900 },
      { x: 0.9, y: 0.1, z: 0.7, deg: 990 }
    ];
    
    let keyframesText = `0% { transform: rotate3d(${this.defaultRotation.x}, ${this.defaultRotation.y}, ${this.defaultRotation.z}, 180deg); }\n`;
    
    keyframes.forEach((frame, index) => {
      const percent = (index + 1) * 10;
      keyframesText += `${percent}% { transform: rotate3d(${frame.x}, ${frame.y}, ${frame.z}, ${frame.deg}deg); }\n`;
    });
    
    keyframesText += `100% { transform: rotate3d(${finalRotation[0]}, ${finalRotation[1]}, ${finalRotation[2]}, 180deg); }`;
    
    const style = document.createElement('style');
    style.textContent = `@keyframes ${animationName} { ${keyframesText} }`;
    style.id = animationName;
    
    document.head.appendChild(style);
    this.animationStyles.add(animationName);
    
    return animationName;
  }
  
  removeAnimation(animationName) {
    const style = document.getElementById(animationName);
    if (style) {
      document.head.removeChild(style);
      this.animationStyles.delete(animationName);
    }
  }
  
  finishRoll() {
    this.updateDisplay(
      this.pendingResults.join(' + '),
      this.pendingTotal
    );
    
    this.addToHistory();
    this.renderPool();
    
    this.isRolling = false;
    this.setButtonsDisabled(false);
    this.pendingResults = null;
    this.pendingTotal = null;
  }
  
  // ===== HISTÓRICO =====
  
  addToHistory() {
    const timestamp = new Date().toLocaleTimeString();
    const historyItem = `[${timestamp}] ${this.pendingResults.join(' + ')} = ${this.pendingTotal}`;
    
    this.history.unshift(historyItem);
    
    if (this.history.length > this.HISTORY_LIMIT) {
      this.history.pop();
    }
    
    this.updateHistory();
  }
  
  updateHistory() {
    const historyList = document.getElementById('history-output');
    if (!historyList) return;
    
    historyList.innerHTML = this.history.map(item => `<li>${item}</li>`).join('');
  }
  
  clearHistory() {
    this.history = [];
    this.updateHistory();
  }
  
  // ===== CONTROLES DE UI =====
  
  setButtonsDisabled(disabled) {
    const rollBtn = document.getElementById('roll-button');
    const clearBtn = document.getElementById('clear-all');
    const diceButtons = document.querySelectorAll('.dice-btn button');
    
    if (rollBtn) rollBtn.disabled = disabled;
    if (clearBtn) clearBtn.disabled = disabled;
    
    diceButtons.forEach(btn => {
      btn.disabled = disabled;
    });
  }
  
  // ===== CLEANUP =====
  
  destroy() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    
    this.animationStyles.forEach(name => this.removeAnimation(name));
    this.animationStyles.clear();
    this.isSetup = false;
  }
}

// Inicializa o DicePool
const dicePool = new DicePool();

// Cleanup ao descarregar a página
window.addEventListener('beforeunload', () => {
  dicePool.destroy();
});

export default dicePool;