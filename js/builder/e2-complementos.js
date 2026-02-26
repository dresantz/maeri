// =========================
// Maeri RPG - Etapa 2: Complementos
// Gerencia a seleção do tipo de ser do personagem, estudos, técnicas marciais e estudos mágicos
// =========================

class ComplementosManager {
  constructor(previewElement) {
    this.previewElement = previewElement;
    this.seresData = null;
    this.estudosData = null;
    this.tecnicasData = null;
    this.magiasData = null;
    this.selectedSer = null;
    this.selectedEstudo = null;
    this.selectedTecnica = null;
    this.selectedMagia = null;
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

        <!-- Seção de Técnicas Marciais -->
        <div class="tecnicas-section" id="tecnicas-section">
          <p class="tecnicas-subtitle">Técnicas Marciais</p>
          
          <div class="tecnicas-buttons" id="tecnicas-buttons-container">
            <button class="tecnica-button loading" disabled>Carregando técnicas...</button>
          </div>
          
          <div class="tecnica-details" id="tecnica-details-container" style="display: none;">
            <h3 class="tecnica-title"></h3>
            <div class="tecnica-descricao"></div>
          </div>
        </div>

        <!-- Seção de Estudos Mágicos -->
        <div class="magias-section" id="magias-section">
          <p class="magias-subtitle">Estudos Mágicos</p>
          
          <div class="magias-buttons" id="magias-buttons-container">
            <button class="magia-button loading" disabled>Carregando estudos mágicos...</button>
          </div>
          
          <div class="magia-details" id="magia-details-container" style="display: none;">
            <h3 class="magia-title"></h3>
            <div class="magia-descricao"></div>
            <div class="magia-efeitos">
              <h4>Efeitos Menores</h4>
              <div class="efeitos-list"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Carrega todos os dados
    this.loadSeresData();
    this.loadEstudosData();
    this.loadTecnicasData();
    this.loadMagiasData();
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
      if (item.estudos_item) {
        // Filtra regras gerais
        const isRegraGeral = 
          item.estudos_item.includes('custo') ||
          item.estudos_item.includes('xpm') ||
          item.estudos_item.includes('teste') ||
          item.estudos_item.includes('Fonte') ||
          item.estudos_item.includes('repouso') ||
          item.estudos_item.match(/^Ao custo/i);
        
        if (!isRegraGeral) {
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
        currentEstudo.conhecimentos.push(item.text);
      }
    });
    
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

  // ===== TÉCNICAS MARCIAIS =====
  async loadTecnicasData() {
    try {
      const response = await fetch('../../data/rulebook/05-circulo-social-comercio.json');
      const data = await response.json();
      
      const tecnicasSection = data.sections.find(s => s.id === 'tecnicas-marcais');
      const listaTecnicas = tecnicasSection.content.find(c => c.type === 'list' && c.id === 'tec_item');
      
      this.processarTecnicas(listaTecnicas.items);
      this.renderTecnicasButtons();
    } catch (error) {
      console.error('Erro ao carregar dados das técnicas marciais:', error);
      const container = document.getElementById('tecnicas-buttons-container');
      if (container) {
        container.innerHTML = '<button class="tecnica-button error" disabled>Erro ao carregar técnicas</button>';
      }
    }
  }

  processarTecnicas(items) {
    this.tecnicasData = items.map(item => {
      const firstDotIndex = item.indexOf('.');
      const titulo = item.substring(0, firstDotIndex).trim();
      const descricao = item.substring(firstDotIndex + 1).trim();
      
      return {
        titulo: titulo,
        descricao: descricao
      };
    });
  }

  renderTecnicasButtons() {
    const container = document.getElementById('tecnicas-buttons-container');
    if (!container || !this.tecnicasData) return;
    
    let buttonsHtml = '';
    this.tecnicasData.forEach((tecnica, index) => {
      buttonsHtml += `
        <button class="tecnica-button" data-tecnica-index="${index}">
          ${tecnica.titulo}
        </button>
      `;
    });
    
    container.innerHTML = buttonsHtml;
    
    container.querySelectorAll('.tecnica-button').forEach(button => {
      button.addEventListener('click', () => this.selectTecnica(button.dataset.tecnicaIndex));
    });
  }

  selectTecnica(index) {
    const detailsContainer = document.getElementById('tecnica-details-container');
    const selectedButton = document.querySelector(`[data-tecnica-index="${index}"]`);
    
    const isSameTecnica = this.selectedTecnica && this.selectedTecnica.index === index;
    
    if (isSameTecnica) {
      detailsContainer.classList.add('closing');
      
      setTimeout(() => {
        detailsContainer.style.display = 'none';
        detailsContainer.classList.remove('closing');
      }, 300);
      
      this.selectedTecnica = null;
      
      document.querySelectorAll('.tecnica-button').forEach(btn => {
        btn.classList.remove('selected');
      });
      
      return;
    }
    
    document.querySelectorAll('.tecnica-button').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    if (selectedButton) {
      selectedButton.classList.add('selected');
    }
    
    this.selectedTecnica = {
      index: index,
      data: this.tecnicasData[index]
    };
    
    this.renderTecnicaDetails();
  }

  renderTecnicaDetails() {
    if (!this.selectedTecnica) return;
    
    const detailsContainer = document.getElementById('tecnica-details-container');
    const titleElement = detailsContainer.querySelector('.tecnica-title');
    const descricaoElement = detailsContainer.querySelector('.tecnica-descricao');
    
    const tecnica = this.selectedTecnica.data;
    
    titleElement.textContent = tecnica.titulo;
    descricaoElement.innerHTML = `<p>${tecnica.descricao}</p>`;
    
    detailsContainer.style.display = 'block';
  }

  // ===== ESTUDOS MÁGICOS =====
  async loadMagiasData() {
    try {
      const response = await fetch('../../data/rulebook/04-magia.json');
      const data = await response.json();
      
      // Lista de IDs dos Estudos Mágicos válidos
      const estudosMagicosValidos = [
        'neofita',
        'bruxaria',
        'divinacao',
        'feiticaria'
      ];
      
      // Filtra apenas as seções que são estudos mágicos
      this.magiasData = data.sections.filter(section => 
        estudosMagicosValidos.includes(section.id)
      );
      
      this.renderMagiasButtons();
    } catch (error) {
      console.error('Erro ao carregar dados dos estudos mágicos:', error);
      const container = document.getElementById('magias-buttons-container');
      if (container) {
        container.innerHTML = '<button class="magia-button error" disabled>Erro ao carregar estudos mágicos</button>';
      }
    }
  }

  renderMagiasButtons() {
    const container = document.getElementById('magias-buttons-container');
    if (!container || !this.magiasData) return;
    
    let buttonsHtml = '';
    this.magiasData.forEach((magia, index) => {
      buttonsHtml += `
        <button class="magia-button" data-magia-index="${index}">
          ${magia.title}
        </button>
      `;
    });
    
    container.innerHTML = buttonsHtml;
    
    container.querySelectorAll('.magia-button').forEach(button => {
      button.addEventListener('click', () => this.selectMagia(button.dataset.magiaIndex));
    });
  }

  selectMagia(index) {
    const detailsContainer = document.getElementById('magia-details-container');
    const selectedButton = document.querySelector(`[data-magia-index="${index}"]`);
    
    const isSameMagia = this.selectedMagia && this.selectedMagia.index === index;
    
    if (isSameMagia) {
      detailsContainer.classList.add('closing');
      
      setTimeout(() => {
        detailsContainer.style.display = 'none';
        detailsContainer.classList.remove('closing');
      }, 300);
      
      this.selectedMagia = null;
      
      document.querySelectorAll('.magia-button').forEach(btn => {
        btn.classList.remove('selected');
      });
      
      return;
    }
    
    document.querySelectorAll('.magia-button').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    if (selectedButton) {
      selectedButton.classList.add('selected');
    }
    
    this.selectedMagia = {
      index: index,
      data: this.magiasData[index]
    };
    
    this.renderMagiaDetails();
  }

  renderMagiaDetails() {
    if (!this.selectedMagia) return;
    
    const detailsContainer = document.getElementById('magia-details-container');
    const titleElement = detailsContainer.querySelector('.magia-title');
    const descricaoElement = detailsContainer.querySelector('.magia-descricao');
    const efeitosList = detailsContainer.querySelector('.efeitos-list');
    
    const magia = this.selectedMagia.data;
    
    titleElement.textContent = magia.title;
    
    // Coleta todos os parágrafos de descrição (antes da lista de efeitos)
    const descricaoParagrafos = [];
    const efeitos = [];
    let encontrouEfeitos = false;
    
    magia.content.forEach(item => {
      if (item.type === 'paragraph' && !encontrouEfeitos) {
        if (item.text.includes('Efeitos Menores')) {
          encontrouEfeitos = true;
        } else {
          descricaoParagrafos.push(`<p>${item.text}</p>`);
        }
      } else if (item.type === 'list' && item.items) {
        efeitos.push(...item.items);
      }
    });
    
    descricaoElement.innerHTML = descricaoParagrafos.join('');
    
    let efeitosHtml = '';
    efeitos.forEach(efeito => {
      efeitosHtml += `
        <div class="efeito-item">
          ${efeito}
        </div>
      `;
    });
    
    efeitosList.innerHTML = efeitosHtml;
    detailsContainer.style.display = 'block';
  }
}

export default ComplementosManager;