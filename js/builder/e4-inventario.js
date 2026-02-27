// =========================
// Maeri RPG - Etapa 4: Inventário
// Gerencia a visualização de moedas, limites de peso e itens disponíveis por contato
// =========================

class InventarioManager {
  constructor(previewElement) {
    this.previewElement = previewElement;
    this.contatosData = null;
    this.selectedContato = null;
  }

  render() {
    if (!this.previewElement) return;
    
    this.previewElement.innerHTML = `
      <div class="inventario-container">
        <!-- Informações de Moedas -->
        <div class="moedas-section">
          <h3 class="inventario-subtitle">Moedas</h3>
          <p class="moedas-text">As moedas são definidas da seguinte maneira:</p>
          
          <div class="moedas-grid">
            <div class="moeda-item">
              <span class="moeda-simbolo">Fo</span>
              <span class="moeda-nome">Florins de Ouro</span>
              <span class="moeda-calculo">I + 1d6</span>
            </div>
            <div class="moeda-item">
              <span class="moeda-simbolo">Dp</span>
              <span class="moeda-nome">Denares de Prata</span>
              <span class="moeda-calculo">V + 1d6</span>
            </div>
            <div class="moeda-item">
              <span class="moeda-simbolo">Tc</span>
              <span class="moeda-nome">Tostões de Cobre</span>
              <span class="moeda-calculo">S + 1d6</span>
            </div>
          </div>
        </div>

        <!-- Limites de Peso -->
        <div class="peso-section">
          <h3 class="inventario-subtitle">Limites de Peso</h3>
          <p class="peso-text">Os limites de peso médio e máximo são definidos assim:</p>
          
          <div class="peso-grid">
            <div class="peso-item">
              <span class="peso-tipo">Médio</span>
              <span class="peso-calculo">F x 2</span>
            </div>
            <div class="peso-item">
              <span class="peso-tipo">Máximo</span>
              <span class="peso-calculo">F x 4</span>
            </div>
          </div>
        </div>

        <!-- Itens por Contato -->
        <div class="itens-contato-section">
          <h3 class="inventario-subtitle">Itens Disponíveis</h3>
          <p class="itens-intro">Os itens são adquiridos nas lojas de acordo com os Contatos escolhidos:</p>
          
          <div class="contatos-buttons" id="inventario-contatos-buttons-container">
            <button class="contato-button loading" disabled>Carregando contatos...</button>
          </div>
          
          <div class="contato-details" id="inventario-contato-details-container" style="display: none;">
            <h3 class="contato-title"></h3>
            <div class="contato-descricao"></div>
            <div class="contato-itens">
              <h4>Itens Disponíveis</h4>
              <div class="itens-list"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Carrega os dados dos contatos (reutilizando a mesma lógica da Etapa 3)
    this.loadContatosData();
  }

  // ===== CONTATOS =====
  async loadContatosData() {
    try {
      const response = await fetch('../../data/rulebook/05-circulo-social-comercio.json');
      const data = await response.json();
      
      this.contatosData = [];
      
      // Mapeamento de tipos de contato e seus respectivos campos
      const tiposContato = [
        { campo: 'lojacomb_item', idLista: 'lojacomb_item' },
        { campo: 'lojarc_item', idLista: 'lojarc_item' },
        { campo: 'montarias_item', idLista: 'montarias_item' }
      ];
      
      data.sections.forEach(section => {
        // Pula seções introdutórias
        if (section.id === 'introducao' || section.id.includes('introducao')) return;
        
        let currentContato = null;
        let currentItems = [];
        
        section.content.forEach(item => {
          // Verifica se é um contato (tem algum dos campos específicos)
          let encontrouContato = false;
          let tipoEncontrado = null;
          let nomeContato = null;
          
          for (const tipo of tiposContato) {
            if (item[tipo.campo]) {
              encontrouContato = true;
              tipoEncontrado = tipo;
              nomeContato = item[tipo.campo].replace('.', '').trim();
              break;
            }
          }
          
          if (encontrouContato && item.type === 'paragraph') {
            // Salva o contato anterior se existir
            if (currentContato && currentItems.length > 0) {
              this.contatosData.push({
                id: `${section.id}-${currentContato.nome.toLowerCase().replace(/\s+/g, '-')}`,
                nome: currentContato.nome,
                descricao: currentContato.descricao,
                itens: [...currentItems]
              });
            }
            
            // Inicia novo contato
            currentContato = {
              nome: nomeContato,
              descricao: item.text,
              tipo: tipoEncontrado
            };
            currentItems = [];
          }
          
          // Verifica se é uma lista de itens do contato atual
          if (item.type === 'list' && currentContato && item.id === currentContato.tipo.idLista) {
            currentItems = [...currentItems, ...item.items];
          }
        });
        
        // Adiciona o último contato da seção
        if (currentContato && currentItems.length > 0) {
          this.contatosData.push({
            id: `${section.id}-${currentContato.nome.toLowerCase().replace(/\s+/g, '-')}`,
            nome: currentContato.nome,
            descricao: currentContato.descricao,
            itens: currentItems
          });
        }
      });
    
      
      this.renderContatosButtons();
    } catch (error) {
      console.error('Erro ao carregar dados dos contatos:', error);
      const container = document.getElementById('inventario-contatos-buttons-container');
      if (container) {
        container.innerHTML = '<button class="contato-button error" disabled>Erro ao carregar contatos</button>';
      }
    }
  }

  renderContatosButtons() {
    const container = document.getElementById('inventario-contatos-buttons-container');
    if (!container || !this.contatosData || this.contatosData.length === 0) return;
    
    let buttonsHtml = '';
    this.contatosData.forEach((contato, index) => {
      buttonsHtml += `
        <button class="contato-button" data-inventario-contato-index="${index}">
          ${contato.nome}
        </button>
      `;
    });
    
    container.innerHTML = buttonsHtml;
    
    container.querySelectorAll('.contato-button').forEach(button => {
      button.addEventListener('click', () => this.selectContato(button.dataset.inventarioContatoIndex));
    });
  }

  selectContato(index) {
    const detailsContainer = document.getElementById('inventario-contato-details-container');
    const selectedButton = document.querySelector(`[data-inventario-contato-index="${index}"]`);
    
    const isSameContato = this.selectedContato && this.selectedContato.index === index;
    
    if (isSameContato) {
      detailsContainer.classList.add('closing');
      
      setTimeout(() => {
        detailsContainer.style.display = 'none';
        detailsContainer.classList.remove('closing');
      }, 300);
      
      this.selectedContato = null;
      
      document.querySelectorAll('[data-inventario-contato-index]').forEach(btn => {
        btn.classList.remove('selected');
      });
      
      return;
    }
    
    document.querySelectorAll('[data-inventario-contato-index]').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    if (selectedButton) {
      selectedButton.classList.add('selected');
    }
    
    this.selectedContato = {
      index: index,
      data: this.contatosData[index]
    };
    
    this.renderContatoDetails();
  }

  renderContatoDetails() {
    if (!this.selectedContato) return;
    
    const detailsContainer = document.getElementById('inventario-contato-details-container');
    const titleElement = detailsContainer.querySelector('.contato-title');
    const descricaoElement = detailsContainer.querySelector('.contato-descricao');
    const itensList = detailsContainer.querySelector('.itens-list');
    
    const contato = this.selectedContato.data;
    
    titleElement.textContent = contato.nome;
    descricaoElement.innerHTML = `<p>${contato.descricao}</p>`;
    
    let itensHtml = '';
    contato.itens.forEach(item => {
      itensHtml += `
        <div class="item-lista">
          ${item}
        </div>
      `;
    });
    
    itensList.innerHTML = itensHtml;
    detailsContainer.style.display = 'block';
  }
}

export default InventarioManager;