// =========================
// Maeri RPG - Etapa 3: Narrativa
// Gerencia a escolha de Arquétipos, Motivações, Disposição e Contatos
// =========================

class NarrativaManager {
  constructor(previewElement) {
    this.previewElement = previewElement;
    this.arquetiposData = null;
    this.motivacoesData = null;
    this.disposicaoData = null;
    this.contatosData = null;
    this.selectedArquetipo = null;
    this.selectedMotivacao = null;
    this.selectedContato = null;
  }

  render() {
    if (!this.previewElement) return;
    
    this.previewElement.innerHTML = `
      <div class="narrativa-container">
        <!-- Seção de Arquétipos -->
        <p class="narrativa-intro">Escolha o arquétipo do seu personagem:</p>
        
        <div class="arquetipos-buttons" id="arquetipos-buttons-container">
          <button class="arquetipo-button loading" disabled>Carregando arquétipos...</button>
        </div>
        
        <div class="arquetipo-details" id="arquetipo-details-container" style="display: none;">
          <h3 class="arquetipo-title"></h3>
          <div class="arquetipo-descricao"></div>
        </div>

        <!-- Seção de Motivações -->
        <div class="motivacoes-section">
          <p class="motivacoes-intro">Escolha a motivação do seu personagem:</p>
          
          <div class="motivacoes-buttons" id="motivacoes-buttons-container">
            <button class="motivacao-button loading" disabled>Carregando motivações...</button>
          </div>
          
          <div class="motivacao-details" id="motivacao-details-container" style="display: none;">
            <h3 class="motivacao-title"></h3>
            <div class="motivacao-descricao"></div>
          </div>
        </div>

        <!-- Seção de Disposição -->
        <div class="disposicao-section">
          <p class="disposicao-intro">A Disposição é:</p>
          <div class="disposicao-text" id="disposicao-text-container">
            <p class="disposicao-loading">Carregando...</p>
          </div>
        </div>

        <!-- Seção de Contatos -->
        <div class="contatos-section">
          <p class="contatos-intro">Escolha os Contatos</p>
          <p class="contatos-descricao">O jogador pode escolher qualquer tipo de contato que quiser, não precisa estar na lista, porém, para adquirir itens em uma loja, é necessário ter o Contato específico.</p>
          
          <div class="contatos-buttons" id="contatos-buttons-container">
            <button class="contato-button loading" disabled>Carregando contatos...</button>
          </div>
          
          <div class="contato-details" id="contato-details-container" style="display: none;">
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
    
    // Carrega os dados
    this.loadArquetiposData();
    this.loadMotivacoesData();
    this.loadDisposicaoData();
    this.loadContatosData();
  }

  // ===== ARQUÉTIPOS =====
  async loadArquetiposData() {
    try {
      const response = await fetch('../../data/rulebook/02-personagem.json');
      const data = await response.json();
      
      const arquetipoSection = data.sections.find(s => s.topic_id === 'arquetipo');
      const listaArquetipos = arquetipoSection.content.find(c => c.type === 'list');
      
      this.processarArquetipos(listaArquetipos.items);
      this.renderArquetiposButtons();
    } catch (error) {
      console.error('Erro ao carregar dados dos arquétipos:', error);
      const container = document.getElementById('arquetipos-buttons-container');
      if (container) {
        container.innerHTML = '<button class="arquetipo-button error" disabled>Erro ao carregar arquétipos</button>';
      }
    }
  }

  processarArquetipos(items) {
    this.arquetiposData = items.map(item => {
      const firstColonIndex = item.indexOf(':');
      const titulo = item.substring(0, firstColonIndex).trim();
      const descricao = item.substring(firstColonIndex + 1).trim();
      
      return {
        titulo: titulo,
        descricao: descricao
      };
    });
  }

  renderArquetiposButtons() {
    const container = document.getElementById('arquetipos-buttons-container');
    if (!container || !this.arquetiposData) return;
    
    let buttonsHtml = '';
    this.arquetiposData.forEach((arquetipo, index) => {
      buttonsHtml += `
        <button class="arquetipo-button" data-arquetipo-index="${index}">
          ${arquetipo.titulo}
        </button>
      `;
    });
    
    container.innerHTML = buttonsHtml;
    
    container.querySelectorAll('.arquetipo-button').forEach(button => {
      button.addEventListener('click', () => this.selectArquetipo(button.dataset.arquetipoIndex));
    });
  }

  selectArquetipo(index) {
    const detailsContainer = document.getElementById('arquetipo-details-container');
    const selectedButton = document.querySelector(`[data-arquetipo-index="${index}"]`);
    
    const isSameArquetipo = this.selectedArquetipo && this.selectedArquetipo.index === index;
    
    if (isSameArquetipo) {
      detailsContainer.classList.add('closing');
      
      setTimeout(() => {
        detailsContainer.style.display = 'none';
        detailsContainer.classList.remove('closing');
      }, 300);
      
      this.selectedArquetipo = null;
      
      document.querySelectorAll('.arquetipo-button').forEach(btn => {
        btn.classList.remove('selected');
      });
      
      return;
    }
    
    document.querySelectorAll('.arquetipo-button').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    if (selectedButton) {
      selectedButton.classList.add('selected');
    }
    
    this.selectedArquetipo = {
      index: index,
      data: this.arquetiposData[index]
    };
    
    this.renderArquetipoDetails();
  }

  renderArquetipoDetails() {
    if (!this.selectedArquetipo) return;
    
    const detailsContainer = document.getElementById('arquetipo-details-container');
    const titleElement = detailsContainer.querySelector('.arquetipo-title');
    const descricaoElement = detailsContainer.querySelector('.arquetipo-descricao');
    
    const arquetipo = this.selectedArquetipo.data;
    
    titleElement.textContent = arquetipo.titulo;
    descricaoElement.innerHTML = `<p>${arquetipo.descricao}</p>`;
    
    detailsContainer.style.display = 'block';
  }

  // ===== MOTIVAÇÕES =====
  async loadMotivacoesData() {
    try {
      const response = await fetch('../../data/rulebook/02-personagem.json');
      const data = await response.json();
      
      const motivacaoSection = data.sections.find(s => s.topic_id === 'motivacao');
      const listaMotivacoes = motivacaoSection.content.find(c => c.type === 'list');
      
      this.processarMotivacoes(listaMotivacoes.items);
      this.renderMotivacoesButtons();
    } catch (error) {
      console.error('Erro ao carregar dados das motivações:', error);
      const container = document.getElementById('motivacoes-buttons-container');
      if (container) {
        container.innerHTML = '<button class="motivacao-button error" disabled>Erro ao carregar motivações</button>';
      }
    }
  }

  processarMotivacoes(items) {
    this.motivacoesData = items.map(item => {
      const firstColonIndex = item.indexOf(':');
      const titulo = item.substring(0, firstColonIndex).trim();
      const descricao = item.substring(firstColonIndex + 1).trim();
      
      return {
        titulo: titulo,
        descricao: descricao
      };
    });
  }

  renderMotivacoesButtons() {
    const container = document.getElementById('motivacoes-buttons-container');
    if (!container || !this.motivacoesData) return;
    
    let buttonsHtml = '';
    this.motivacoesData.forEach((motivacao, index) => {
      buttonsHtml += `
        <button class="motivacao-button" data-motivacao-index="${index}">
          ${motivacao.titulo}
        </button>
      `;
    });
    
    container.innerHTML = buttonsHtml;
    
    container.querySelectorAll('.motivacao-button').forEach(button => {
      button.addEventListener('click', () => this.selectMotivacao(button.dataset.motivacaoIndex));
    });
  }

  selectMotivacao(index) {
    const detailsContainer = document.getElementById('motivacao-details-container');
    const selectedButton = document.querySelector(`[data-motivacao-index="${index}"]`);
    
    const isSameMotivacao = this.selectedMotivacao && this.selectedMotivacao.index === index;
    
    if (isSameMotivacao) {
      detailsContainer.classList.add('closing');
      
      setTimeout(() => {
        detailsContainer.style.display = 'none';
        detailsContainer.classList.remove('closing');
      }, 300);
      
      this.selectedMotivacao = null;
      
      document.querySelectorAll('.motivacao-button').forEach(btn => {
        btn.classList.remove('selected');
      });
      
      return;
    }
    
    document.querySelectorAll('.motivacao-button').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    if (selectedButton) {
      selectedButton.classList.add('selected');
    }
    
    this.selectedMotivacao = {
      index: index,
      data: this.motivacoesData[index]
    };
    
    this.renderMotivacaoDetails();
  }

  renderMotivacaoDetails() {
    if (!this.selectedMotivacao) return;
    
    const detailsContainer = document.getElementById('motivacao-details-container');
    const titleElement = detailsContainer.querySelector('.motivacao-title');
    const descricaoElement = detailsContainer.querySelector('.motivacao-descricao');
    
    const motivacao = this.selectedMotivacao.data;
    
    titleElement.textContent = motivacao.titulo;
    descricaoElement.innerHTML = `<p>${motivacao.descricao}</p>`;
    
    detailsContainer.style.display = 'block';
  }

  // ===== DISPOSIÇÃO =====
  async loadDisposicaoData() {
    try {
      const response = await fetch('../../data/rulebook/02-personagem.json');
      const data = await response.json();
      
      const disposicaoSection = data.sections.find(s => s.topic_id === 'disposicao');
      const disposicaoText = disposicaoSection.content.find(c => c.type === 'paragraph');
      
      this.renderDisposicaoText(disposicaoText.text);
    } catch (error) {
      console.error('Erro ao carregar dados da disposição:', error);
      const container = document.getElementById('disposicao-text-container');
      if (container) {
        container.innerHTML = '<p class="disposicao-error">Erro ao carregar texto da disposição</p>';
      }
    }
  }

  renderDisposicaoText(text) {
    const container = document.getElementById('disposicao-text-container');
    if (!container) return;
    
    container.innerHTML = `<p class="disposicao-text">${text}</p>`;
  }

  // ===== CONTATOS =====
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
      if (section.topic_id === 'introducao' || section.topic_id.includes('introducao')) return;
      
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
    const container = document.getElementById('contatos-buttons-container');
    if (container) {
      container.innerHTML = '<button class="contato-button error" disabled>Erro ao carregar contatos</button>';
    }
  }
}

  renderContatosButtons() {
    const container = document.getElementById('contatos-buttons-container');
    if (!container || !this.contatosData || this.contatosData.length === 0) return;
    
    let buttonsHtml = '';
    this.contatosData.forEach((contato, index) => {
      buttonsHtml += `
        <button class="contato-button" data-contato-index="${index}">
          ${contato.nome}
        </button>
      `;
    });
    
    container.innerHTML = buttonsHtml;
    
    container.querySelectorAll('.contato-button').forEach(button => {
      button.addEventListener('click', () => this.selectContato(button.dataset.contatoIndex));
    });
  }

  selectContato(index) {
    const detailsContainer = document.getElementById('contato-details-container');
    const selectedButton = document.querySelector(`[data-contato-index="${index}"]`);
    
    const isSameContato = this.selectedContato && this.selectedContato.index === index;
    
    if (isSameContato) {
      detailsContainer.classList.add('closing');
      
      setTimeout(() => {
        detailsContainer.style.display = 'none';
        detailsContainer.classList.remove('closing');
      }, 300);
      
      this.selectedContato = null;
      
      document.querySelectorAll('.contato-button').forEach(btn => {
        btn.classList.remove('selected');
      });
      
      return;
    }
    
    document.querySelectorAll('.contato-button').forEach(btn => {
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
    
    const detailsContainer = document.getElementById('contato-details-container');
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

export default NarrativaManager;