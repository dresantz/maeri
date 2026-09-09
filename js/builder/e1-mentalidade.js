// =========================
// Maeri RPG - Etapa 1: Mentalidade
// Gerencia a exibição e carregamento da tabela de mentalidades
// =========================

class MentalidadeManager {
  constructor(previewElement) {
    this.previewElement = previewElement;
    this.cachedData = null;
    this.containers = {
      tableBody: null,
    };
  }

  // ===== MÉTODO PRINCIPAL =====
  render() {
    if (!this.previewElement) return;

    // Limpa o previewElement antes de construir o novo conteúdo
    this.previewElement.innerHTML = '';

    // Constrói a estrutura do zero
    this.buildStructure();

    // Carrega os dados da tabela
    this.loadData();
  }

  // ===== CONSTRUÇÃO DA ESTRUTURA DOM =====
  buildStructure() {
    const container = document.createElement('div');
    container.className = 'mentalidade-container';

    // Introdução
    const intro = document.createElement('p');
    intro.className = 'mentalidade-intro';
    intro.textContent = 'Escolha uma Mentalidade.';
    container.appendChild(intro);

    // Informação adicional
    const info1 = document.createElement('div');
    info1.className = 'mentalidade-info';
    info1.innerHTML = `
      <p>Após escolher uma Mentalidade, distribua os pontos de acordo com a Mentalidade escolhida, lembrando que cada personagem já começa com 2 em cada característica básica. Um Belicoso deve colocar +3 e +2 em duas Características Físicas (F, V, D) e +1 em uma das Características Mentais (S, I, A) por exemplo. O Aspecto é gasto na próxima etapa.</p>
    `;
    container.appendChild(info1);

    // Tabela
    const tableContainer = document.createElement('div');
    tableContainer.className = 'mentalidade-table-container';

    const table = document.createElement('table');
    table.className = 'mentalidade-table';

    // Cabeçalho
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Mentalidade', 'CF', 'CM', 'Aspectos', 'Vit', 'Con'];
    headers.forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Corpo da tabela (será preenchido dinamicamente)
    const tbody = document.createElement('tbody');
    tbody.id = 'mentalidade-table-body';
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="loading-row">Carregando mentalidades...</td>
      </tr>
    `;
    table.appendChild(tbody);
    this.containers.tableBody = tbody;

    tableContainer.appendChild(table);
    container.appendChild(tableContainer);

    // Informações finais (fórmulas)
    const info2 = document.createElement('div');
    info2.className = 'mentalidade-info';
    info2.innerHTML = `
      <p>Em seguida, defina Vit e Con de acordo com as suas fórmulas:</p>
      <div class="formulas">
        <p><strong>Vit = F + V + Bônus de Mentalidade Escolhida</strong></p>
        <p><strong>Con = S + I + Bônus de Mentalidade Escolhida</strong></p>
      </div>
      <p>Cada ponto de Aspecto permite adquirir ou um Estudo, ou uma Técnica Marcial, ou um Estudo Mágico, que poderão ser escolhidos na Etapa 2.</p>
    `;
    container.appendChild(info2);

    // Adiciona o container ao previewElement (já limpo)
    this.previewElement.appendChild(container);
  }

  // ===== CARREGAMENTO DE DADOS =====
  async loadData(forceRefresh = false) {
    if (this.cachedData && !forceRefresh) {
      this.renderTable(this.cachedData);
      return;
    }

    try {
      // Detecta se está em subpasta /pages/
      const isInPages = window.location.pathname.includes('/pages/');
      const basePath = isInPages ? '../' : './';
      const url = `${basePath}data/rulebook/01-fundamentos.json`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Encontra a seção de mentalidade
      const mentalidadeSection = data.sections.find(s => s.topic_id === 'mentalidade');
      if (!mentalidadeSection) {
        throw new Error('Seção de mentalidade não encontrada');
      }

      const tableData = mentalidadeSection.content.find(c => c.type === 'table');
      if (!tableData) {
        throw new Error('Tabela de mentalidades não encontrada');
      }

      this.cachedData = tableData;
      this.renderTable(tableData);
    } catch (error) {
      console.error('Erro ao carregar dados de mentalidade:', error);
      const tbody = this.containers.tableBody;
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" class="error-row">Erro ao carregar dados</td></tr>';
      }
    }
  }

  // ===== RENDERIZAÇÃO DA TABELA =====
  renderTable(tableData) {
    const tbody = this.containers.tableBody;
    if (!tbody || !tableData || !tableData.rows) return;

    // Usar DocumentFragment para melhor performance
    const fragment = document.createDocumentFragment();

    tableData.rows.forEach(row => {
      const tr = document.createElement('tr');
      tr.className = 'mentalidade-row';
      tr.setAttribute('role', 'button');
      tr.setAttribute('tabindex', '0');
      tr.setAttribute('aria-label', `Selecionar mentalidade ${row[0]}`);

      // Adicionar células (colunas 0 a 5)
      [0, 1, 2, 3, 4, 5].forEach(index => {
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

    // Limpa e adiciona novo conteúdo
    tbody.innerHTML = '';
    tbody.appendChild(fragment);
  }
}

export default MentalidadeManager;