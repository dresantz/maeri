// =========================
// Maeri RPG - Etapa 2: Complementos
// Gerencia a seleção do tipo de ser do personagem
// =========================

class ComplementosManager {
  constructor(previewElement) {
    this.previewElement = previewElement;
    this.seresData = null;
    this.selectedSer = null;
  }

  render() {
    if (!this.previewElement) return;
    
    this.previewElement.innerHTML = `
      <div class="complementos-container">
        <p class="complementos-intro">Escolha o tipo de ser do personagem:</p>
        
        <div class="seres-buttons" id="seres-buttons-container">
          <button class="ser-button loading" disabled>Carregando seres...</button>
        </div>
        
        <div class="ser-details" id="ser-details-container" style="display: none;">
          <h3 class="ser-title"></h3>
          <div class="ser-caracteristicas"></div>
          <div class="ser-descricao"></div>
        </div>
      </div>
    `;
    
    // Carrega os dados dos seres
    this.loadSeresData();
  }

  async loadSeresData() {
    try {
      const response = await fetch('../../data/rulebook/06-seres.json');
      const data = await response.json();
      
      // Filtra apenas as seções que são seres jogáveis (ignora a seção "O que são Seres")
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
    
    // Adiciona eventos aos botões
    container.querySelectorAll('.ser-button').forEach(button => {
      button.addEventListener('click', () => this.selectSer(button.dataset.serId));
    });
  }

    selectSer(serId) {
    const detailsContainer = document.getElementById('ser-details-container');
    const selectedButton = document.querySelector(`[data-ser-id="${serId}"]`);
    
    // Verifica se o ser clicado já está selecionado
    const isSameSer = this.selectedSer && this.selectedSer.id === serId;
    
    if (isSameSer) {
        // Se for o mesmo ser, aplica a animação de saída e depois esconde
        detailsContainer.classList.add('closing');
        
        setTimeout(() => {
        detailsContainer.style.display = 'none';
        detailsContainer.classList.remove('closing');
        }, 300); // Mesmo tempo da transição CSS
        
        this.selectedSer = null;
        
        // Remove a seleção do botão
        document.querySelectorAll('.ser-button').forEach(btn => {
        btn.classList.remove('selected');
        });
        
        return;
    }
    
    // Remove seleção anterior de outros botões
    document.querySelectorAll('.ser-button').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Adiciona seleção ao botão clicado
    if (selectedButton) {
        selectedButton.classList.add('selected');
    }
    
    // Encontra o ser selecionado nos dados
    this.selectedSer = this.seresData.find(ser => ser.id === serId);
    
    // Renderiza os detalhes do ser
    this.renderSerDetails();
    }
  renderSerDetails() {
    if (!this.selectedSer) return;
    
    const detailsContainer = document.getElementById('ser-details-container');
    const titleElement = detailsContainer.querySelector('.ser-title');
    const caracteristicasElement = detailsContainer.querySelector('.ser-caracteristicas');
    const descricaoElement = detailsContainer.querySelector('.ser-descricao');
    
    // Filtra por id === 'seres_item' para pegar todas as características
    const caracteristicasList = this.selectedSer.content.filter(item => item.id === 'seres_item');
    
    // Encontra o item com "item_descrip" (descrição do ser)
    const descricao = this.selectedSer.content.find(item => item.item_descrip);
    
    titleElement.textContent = this.selectedSer.title;
    
    // Renderiza todas as características encontradas
    if (caracteristicasList.length > 0) {
      let caracteristicasHtml = '<h4>Características</h4>';
      
      caracteristicasList.forEach(item => {
        // Extrai o título da característica (antes do ponto) se possível
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
    
    // Mostra o container de detalhes
    detailsContainer.style.display = 'block';
  }
}

export default ComplementosManager;