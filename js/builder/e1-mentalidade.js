// =========================
// Maeri RPG - Etapa 1: Mentalidade
// Gerencia a exibição e carregamento da tabela de mentalidades
// =========================

class MentalidadeManager {
  constructor(previewElement) {
    this.previewElement = previewElement;
    this.tableBodyId = 'mentalidade-table-body';
  }

  render() {
    if (!this.previewElement) return;
    
    this.previewElement.innerHTML = `
      <div class="mentalidade-container">
        <p class="mentalidade-intro">Escolha uma Mentalidade.</p>
        
        <div class="mentalidade-table-container">
          <table class="mentalidade-table">
            <thead>
              <tr>
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

  async loadData() {
    try {
      const response = await fetch('../../data/rulebook/01-fundamentos.json');
      const data = await response.json();
      
      // Encontra a seção de mentalidade
      const mentalidadeSection = data.sections.find(s => s.id === 'mentalidade');
      const tableData = mentalidadeSection.content.find(c => c.type === 'table');
      
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
    
    let html = '';
    tableData.rows.forEach(row => {
      html += `
        <tr class="mentalidade-row">
          <td><strong>${row[0]}</strong></td>
          <td>${row[1]}</td>
          <td>${row[2]}</td>
          <td>${row[3]}</td>
          <td>${row[4]}</td>
          <td>${row[5]}</td>
        </tr>
      `;
    });
    
    tbody.innerHTML = html;
  }
}

export default MentalidadeManager;