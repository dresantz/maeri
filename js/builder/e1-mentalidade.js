// =========================
// Maeri RPG - Etapa 1: Mentalidade
// Gerencia a exibição e carregamento da tabela de mentalidades
// =========================

class MentalidadeManager {
  constructor(previewElement) {
    this.previewElement = previewElement;
    this.tableBodyId = 'mentalidade-table-body';
    this.cachedData = null;
  }

  render() {
    if (!this.previewElement) return;
    
    this.previewElement.innerHTML = `
      <div class="mentalidade-container">
        <p class="mentalidade-intro">Escolha uma Mentalidade.</p>
        
        <div class="mentalidade-table-container">
          <table class="mentalidade-table">
            <thead>
              65e
                <th>Mentalidade</th>
                <th>CF</th>
                <th>CM</th>
                <th>Aspectos</th>
                <th>Vit</th>
                <th>Con</th>
              </tr>
            </thead>
            <tbody id="${this.tableBodyId}">
              <tr>
                <td colspan="6" class="loading-row">Carregando mentalidades...</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mentalidade-info">
          <p>Em seguida, distribua em CF (F, V, D) e CM (S, I, A) os bônus de acordo com a Mentalidade escolhida, lembrando que cada personagem já começa com 2 em cada característica básica.</p>
          
          <p>Em seguida, defina Vit e Con de acordo com as suas fórmulas:</p>
          
          <div class="formulas">
            <p><strong>Vit = F + V + Mentalidade</strong></p>
            <p><strong>Con = S + I + Mentalidade</strong></p>
          </div>
          
          <p>Aspectos são usados para adquirir um Estudo, uma Técnica Marcial ou um Estudo Mágico, que poderão ser escolhidos na Etapa 2.</p>
        </div>
      </div>
    `;
    
    // Carrega os dados da tabela
    this.loadData();
  }

  async loadData(forceRefresh = false) {

    if (this.cachedData && !forceRefresh) {
      this.renderTable(this.cachedData);
      return;
    }

    try {
      // ✅ CORRIGIDO: Detecta se está em subpasta /pages/
      const isInPages = window.location.pathname.includes('/pages/');
      const basePath = isInPages ? '../' : './';
      const url = `${basePath}data/rulebook/01-fundamentos.json`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      // Encontra a seção de mentalidade
      const mentalidadeSection = data.sections.find(s => s.topic_id === 'mentalidade');
      const tableData = mentalidadeSection.content.find(c => c.type === 'table');
      
      this.cachedData = tableData;
      this.renderTable(tableData);
    } catch (error) {
      console.error('Erro ao carregar dados de mentalidade:', error);
      const tbody = document.getElementById(this.tableBodyId);
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" class="error-row">Erro ao carregar dados</td></tr>';
      }
    }
  }

  renderTable(tableData) {
    const tbody = document.getElementById(this.tableBodyId);
    if (!tbody) return;
    
    // Usar DocumentFragment para melhor performance
    const fragment = document.createDocumentFragment();
    
    tableData.rows.forEach(row => {
      const tr = document.createElement('tr');
      tr.className = 'mentalidade-row';
      tr.setAttribute('role', 'button');
      tr.setAttribute('tabindex', '0');
      tr.setAttribute('aria-label', `Selecionar mentalidade ${row[0]}`);
      
      // Adicionar cells
      [0,1,2,3,4,5].forEach(index => {
        const td = document.createElement('td');
        if (index === 0) {
          const strong = document.createElement('strong');
          strong.textContent = row[index];
          td.appendChild(strong);
        } else {
          td.textContent = row[index];
        }
        tr.appendChild(td);
      });
      
      fragment.appendChild(tr);
    });
    
    // Limpar e adicionar novo conteúdo
    tbody.innerHTML = '';
    tbody.appendChild(fragment);
  }
}

export default MentalidadeManager;