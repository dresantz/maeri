// =========================
// Maeri RPG - Etapa 2: Complementos
// Gerencia a seleção do tipo de ser do personagem e estudos
// =========================

class ComplementosManager {
  constructor(previewElement) {
    this.previewElement = previewElement;
    this.seresData = null;
    this.estudosData = null;
    this.selectedSer = null;
    this.selectedEstudo = null;
  }

  render() {
    if (!this.previewElement) return;
    
    this.previewElement.innerHTML = `
      <div class="complementos-container">
        <!-- Seção de Seres -->
        <p class="complementos-intro">Escolha o tipo de ser do personagem:</p>
        
        <div class="seres-buttons" id="seres-buttons-container">
          <button class="ser-button loading" disabled>Carregando seres...</button>
        </div>
        
        <div class="ser-details" id="ser-details-container" style="display: none;">
          <h3 class="ser-title"></h3>
          <div class="ser-caracteristicas"></div>
          <div class="ser-descricao"></div>
        </div>

        <!-- Seção de Estudos -->
        <div class="estudos-section" id="estudos-section">
          <p class="estudos-intro">Escolha onde gastar Aspectos</p>
          <p class="estudos-subtitle">Estudos</p>
          
          <div class="estudos-buttons" id="estudos-buttons-container">
            <button class="estudo-button loading" disabled>Carregando estudos...</button>
          </div>
          
          <div class="estudo-details" id="estudo-details-container" style="display: none;">
            <h3 class="estudo-title"></h3>
            <div class="estudo-descricao"></div>
            <div class="estudo-conhecimentos">
              <h4>Conhecimentos</h4>
              <div class="conhecimentos-list"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Carrega os dados dos seres e estudos
    this.loadSeresData();
    this.loadEstudosData();
  }

  // ===== SERES =====
  async loadSeresData() {
    try {
      const response = await fetch('../../data/rulebook/06-seres.json');
      const data = await response.json();
      
      this.seresData = data.sections.filter(section => 
        section.id !== 'o-que-sao-seres' && 
        section.id !== 'introducao'
      );
      
      this.renderSeresButtons();
    } catch (error) {
      console.error('Erro ao carregar dados dos seres:', error);
      const container = document.getElementById('seres-buttons-container');
      if (container) {
        container.innerHTML = '<button class="ser-button error" disabled>Erro ao carregar seres</button>';
      }
    }
  }

  renderSeresButtons() {
    const container = document.getElementById('seres-buttons-container');
    if (!container || !this.seresData) return;
    
    let buttonsHtml = '';
    this.seresData.forEach(ser => {
      buttonsHtml += `
        <button class="ser-button" data-ser-id="${ser.id}">
          ${ser.title}
        </button>
      `;
    });
    
    container.innerHTML = buttonsHtml;
    
    container.querySelectorAll('.ser-button').forEach(button => {
      button.addEventListener('click', () => this.selectSer(button.dataset.serId));
    });
  }

  selectSer(serId) {
    const detailsContainer = document.getElementById('ser-details-container');
    const selectedButton = document.querySelector(`[data-ser-id="${serId}"]`);
    
    const isSameSer = this.selectedSer && this.selectedSer.id === serId;
    
    if (isSameSer) {
      detailsContainer.classList.add('closing');
      
      setTimeout(() => {
        detailsContainer.style.display = 'none';
        detailsContainer.classList.remove('closing');
      }, 300);
      
      this.selectedSer = null;
      
      document.querySelectorAll('.ser-button').forEach(btn => {
        btn.classList.remove('selected');
      });
      
      return;
    }
    
    document.querySelectorAll('.ser-button').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    if (selectedButton) {
      selectedButton.classList.add('selected');
    }
    
    this.selectedSer = this.seresData.find(ser => ser.id === serId);
    this.renderSerDetails();
  }

  renderSerDetails() {
    if (!this.selectedSer) return;
    
    const detailsContainer = document.getElementById('ser-details-container');
    const titleElement = detailsContainer.querySelector('.ser-title');
    const caracteristicasElement = detailsContainer.querySelector('.ser-caracteristicas');
    const descricaoElement = detailsContainer.querySelector('.ser-descricao');
    
    const caracteristicasList = this.selectedSer.content.filter(item => item.id === 'seres_item');
    const descricao = this.selectedSer.content.find(item => item.item_descrip);
    
    titleElement.textContent = this.selectedSer.title;
    
    if (caracteristicasList.length > 0) {
      let caracteristicasHtml = '<h4>Características</h4>';
      
      caracteristicasList.forEach(item => {
        const textParts = item.text.split('. ');
        const titulo = textParts.length > 1 ? textParts[0] : 'Característica';
        const descricaoChar = textParts.length > 1 ? textParts.slice(1).join('. ') : item.text;
        
        caracteristicasHtml += `
          <div class="caracteristica-item">
            <strong>${titulo}:</strong> ${descricaoChar}
          </div>
        `;
      });
      
      caracteristicasElement.innerHTML = caracteristicasHtml;
    } else {
      caracteristicasElement.innerHTML = '';
    }
    
    if (descricao) {
      descricaoElement.innerHTML = `
        <h4>Descrição</h4>
        <p>${descricao.item_descrip || descricao.text}</p>
      `;
    } else {
      descricaoElement.innerHTML = '';
    }
    
    detailsContainer.style.display = 'block';
  }

  // ===== ESTUDOS =====
  async loadEstudosData() {
    try {
      const response = await fetch('../../data/rulebook/02-personagem.json');
      const data = await response.json();
      
      // Encontra a seção de Estudo e Conhecimento
      const estudosSection = data.sections.find(s => s.id === 'estudo-e-conhecimento');
      this.processarEstudos(estudosSection.content);
      
      this.renderEstudosButtons();
    } catch (error) {
      console.error('Erro ao carregar dados dos estudos:', error);
      const container = document.getElementById('estudos-buttons-container');
      if (container) {
        container.innerHTML = '<button class="estudo-button error" disabled>Erro ao carregar estudos</button>';
      }
    }
  }

    processarEstudos(content) {
    this.estudosData = [];
    let currentEstudo = null;
    
    content.forEach(item => {
        // Verifica se é um estudo válido (estudos_item existe e é curto)
        if (item.estudos_item) {
        // Filtra itens que são muito longos (regras gerais) ou contêm palavras-chave
        const isRegraGeral = 
            item.estudos_item.length > 30 || // Nomes de estudos são curtos
            item.estudos_item.includes('custo') ||
            item.estudos_item.includes('xpm') ||
            item.estudos_item.includes('teste') ||
            item.estudos_item.includes('Fonte') ||
            item.estudos_item.includes('repouso');
        
        if (!isRegraGeral) {
            // É um novo estudo válido
            if (currentEstudo) {
            this.estudosData.push(currentEstudo);
            }
            
            currentEstudo = {
            nome: item.estudos_item,
            descricao: item.text,
            conhecimentos: []
            };
        }
        } else if (item.id === 'estudos_item' && currentEstudo) {
        // É um conhecimento do estudo atual
        currentEstudo.conhecimentos.push(item.text);
        }
    });
    
    // Adiciona o último estudo
    if (currentEstudo) {
        this.estudosData.push(currentEstudo);
    }
    }

  renderEstudosButtons() {
    const container = document.getElementById('estudos-buttons-container');
    if (!container || !this.estudosData) return;
    
    let buttonsHtml = '';
    this.estudosData.forEach((estudo, index) => {
      buttonsHtml += `
        <button class="estudo-button" data-estudo-index="${index}">
          ${estudo.nome}
        </button>
      `;
    });
    
    container.innerHTML = buttonsHtml;
    
    container.querySelectorAll('.estudo-button').forEach(button => {
      button.addEventListener('click', () => this.selectEstudo(button.dataset.estudoIndex));
    });
  }

  selectEstudo(index) {
    const detailsContainer = document.getElementById('estudo-details-container');
    const selectedButton = document.querySelector(`[data-estudo-index="${index}"]`);
    
    const isSameEstudo = this.selectedEstudo && this.selectedEstudo.index === index;
    
    if (isSameEstudo) {
      detailsContainer.classList.add('closing');
      
      setTimeout(() => {
        detailsContainer.style.display = 'none';
        detailsContainer.classList.remove('closing');
      }, 300);
      
      this.selectedEstudo = null;
      
      document.querySelectorAll('.estudo-button').forEach(btn => {
        btn.classList.remove('selected');
      });
      
      return;
    }
    
    document.querySelectorAll('.estudo-button').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    if (selectedButton) {
      selectedButton.classList.add('selected');
    }
    
    this.selectedEstudo = {
      index: index,
      data: this.estudosData[index]
    };
    
    this.renderEstudoDetails();
  }

  renderEstudoDetails() {
    if (!this.selectedEstudo) return;
    
    const detailsContainer = document.getElementById('estudo-details-container');
    const titleElement = detailsContainer.querySelector('.estudo-title');
    const descricaoElement = detailsContainer.querySelector('.estudo-descricao');
    const conhecimentosList = detailsContainer.querySelector('.conhecimentos-list');
    
    const estudo = this.selectedEstudo.data;
    
    titleElement.textContent = estudo.nome;
    descricaoElement.innerHTML = `<p>${estudo.descricao}</p>`;
    
    let conhecimentosHtml = '';
    estudo.conhecimentos.forEach(conhecimento => {
      // Extrai o título do conhecimento (antes do ponto)
      const textParts = conhecimento.split('. ');
      const titulo = textParts.length > 1 ? textParts[0] : 'Conhecimento';
      const descricao = textParts.length > 1 ? textParts.slice(1).join('. ') : conhecimento;
      
      conhecimentosHtml += `
        <div class="conhecimento-item">
          <strong>${titulo}:</strong> ${descricao}
        </div>
      `;
    });
    
    conhecimentosList.innerHTML = conhecimentosHtml;
    detailsContainer.style.display = 'block';
  }
}

export default ComplementosManager;