// js/builder/template-manager.js
// =========================
// Maeri RPG - Template Manager
// Gerencia o carregamento e acesso aos templates de personagens prontos
// =========================

class TemplateManager {
  constructor() {
    this.templates = new Map(); // Cache dos templates carregados
    this.loadedTemplates = new Set(); // Controle de quais já foram carregados
    this.basePath = '../../data/char-template/'; // Caminho base para os templates
  }

  // ===== UTILITÁRIOS =====
  getTemplatePath(templateId) {
    // Constrói o caminho completo para o template
    return `${this.basePath}${templateId}.json`;
  }

  // ===== CARREGAMENTO INDIVIDUAL =====
  async loadTemplate(templateId) {
    // Se já está carregado, retorna do cache
    if (this.templates.has(templateId)) {
      console.log(`Template ${templateId} carregado do cache`);
      return this.templates.get(templateId);
    }

    try {
      console.log(`Carregando template: ${templateId}`);
      
      const path = this.getTemplatePath(templateId);
      const response = await fetch(path);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // O JSON tem uma chave principal (ex: "model" ou "warrior-3")
      // Pega o primeiro valor do objeto, que é o template em si
      const templateKey = Object.keys(data)[0];
      const template = data[templateKey];
      
      // Verifica se o template foi encontrado
      if (!template) {
        throw new Error(`Template não encontrado no JSON para a chave: ${templateKey}`);
      }
      
      // Adiciona metadados ao template
      template._meta = {
        id: templateId,
        loadedAt: new Date().toISOString(),
        source: path,
        rootKey: templateKey // Guarda a chave original do JSON
      };
      
      // Salva no cache com o templateId como chave
      this.templates.set(templateId, template);
      this.loadedTemplates.add(templateId);
      
      console.log(`Template ${templateId} carregado com sucesso:`, template.name);
      
      return template; // Retorna APENAS o template, não o objeto completo
      
    } catch (error) {
      console.error(`Erro ao carregar template ${templateId}:`, error);
      return null;
    }
  }

  // ===== CARREGAMENTO MÚLTIPLO =====
  async loadTemplates(templateIds) {
    const promises = templateIds.map(id => this.loadTemplate(id));
    const results = await Promise.allSettled(promises);
    
    const loaded = [];
    const failed = [];
    
    results.forEach((result, index) => {
      const templateId = templateIds[index];
      if (result.status === 'fulfilled' && result.value) {
        loaded.push(result.value);
      } else {
        failed.push(templateId);
      }
    });
    
    return { loaded, failed };
  }

  // ===== ACESSO AOS TEMPLATES =====
  getTemplate(templateId) {
    return this.templates.get(templateId);
  }

  getAllTemplates() {
    return Array.from(this.templates.values());
  }

    // ===== CONVERSÃO PARA FICHA =====
    templateToSheetData(template) {
    if (!template) return null;

    // ===== PROCESSAMENTO DOS CAMPOS =====

    // 1. Processa SER
    let serString = '';
    if (template.complemento?.ser) {
        const ser = template.complemento.ser;
        serString = ser.nome || '';
        if (ser.anato) {
        serString += serString ? `: ${ser.anato}` : ser.anato;
        }
    }

    // 2. Processa ESTUDOS (nome + conhecimentos)
    let estudosString = '';
    if (template.complemento?.estudos && Array.isArray(template.complemento.estudos)) {
        estudosString = template.complemento.estudos
        .map(e => {
            let estudoStr = e.nome || '';
            if (e.conhecimentos) {
            estudoStr += estudoStr ? `: ${e.conhecimentos}` : e.conhecimentos;
            }
            return estudoStr;
        })
        .filter(Boolean)
        .join('; ');
    }

    // 3. Processa TÉCNICAS (nome + descrição)
    let tecnicasString = '';
    if (template.complemento?.tecnicas && Array.isArray(template.complemento.tecnicas)) {
        tecnicasString = template.complemento.tecnicas
        .map(t => {
            let tecnicaStr = t.nome || '';
            if (t.descricao) {
            tecnicaStr += tecnicaStr ? `: ${t.descricao}` : t.descricao;
            }
            return tecnicaStr;
        })
        .filter(Boolean)
        .join('; ');
    }

    // 4. Processa ESTUDOS MÁGICOS
    let magiasString = '';
    if (template.complemento?.['estudos mágicos'] && Array.isArray(template.complemento['estudos mágicos'])) {
        magiasString = template.complemento['estudos mágicos']
        .map(m => {
            if (m.nome && m.magias) {
            return `${m.nome}: ${m.magias}`;
            }
            return m.nome || '';
        })
        .filter(Boolean)
        .join('; ');
    }

    // 5. Processa CLASSES - AGORA MAPEADO CORRETAMENTE
    let classesString = '';
    if (template.complemento?.classes && Array.isArray(template.complemento.classes)) {
        classesString = template.complemento.classes
        .map(c => {
            let classeStr = c.nome || '';
            if (c.característica) {
            classeStr += classeStr ? `: ${c.característica}` : c.característica;
            }
            return classeStr;
        })
        .filter(Boolean)
        .join('; ');
    }

    // 6. Processa CONTATOS
    let contatosString = '';
    if (template.narrativa?.contatos && Array.isArray(template.narrativa.contatos)) {
        contatosString = template.narrativa.contatos
        .map(c => {
            if (c.nome && c.tipo) {
            return `${c.nome} (${c.tipo})`;
            }
            return c.nome || '';
        })
        .filter(Boolean)
        .join(', ');
    }

    // 7. Processa ITENS - FORMATO ESPECÍFICO
    let itensString = '';
    if (template.inventario?.itens && Array.isArray(template.inventario.itens)) {
        itensString = template.inventario.itens
        .map(item => {
            const partes = [];
            
            // Nome do item
            partes.push(item.nome || 'Item sem nome');
            
            // Peso (sempre com "Pes")
            if (item.peso) {
            const pesoStr = item.peso.toString();
            if (pesoStr.includes('Pes')) {
                partes.push(pesoStr);
            } else {
                partes.push(`${pesoStr}Pes`);
            }
            } else {
            partes.push('0Pes');
            }
            
            // Quantidade (entre colchetes)
            if (item.quantidade) {
            partes.push(`[ ${item.quantidade} ]`);
            } else {
            partes.push('[ 1 ]');
            }
            
            // Nota (se existir)
            if (item.nota) {
            partes.push(item.nota);
            }
            
            return partes.join('. ');
        })
        .join('\n');
    }

    // Mapeia a estrutura do template para o formato esperado pela ficha
    return {
        // Cabeçalho
        name: template.name,
        level: template.level,
        
        // Atributos
        attributes: {
        f: template.attributes?.f || '2',
        v: template.attributes?.v || '2',
        d: template.attributes?.d || '2',
        s: template.attributes?.s || '2',
        i: template.attributes?.i || '2',
        a: template.attributes?.a || '2'
        },
        
        // Status Vitais
        vit: {
        current: template.vit?.current || '0',
        total: template.vit?.total || '0'
        },
        con: {
        current: template.con?.current || '0',
        total: template.con?.total || '0'
        },
        
        // Notas
        notas: template.notas || '',
        
        // PAINEL COMPLEMENTO - TODOS OS CAMPOS
        complemento: {
        ser: serString,
        estudos: estudosString,
        tecnicas: tecnicasString,
        magias: magiasString,
        classes: classesString, // AGORA FUNCIONA
        xp: {
            m: template.complemento?.xp?.m || '0',
            l: template.complemento?.xp?.l || '0',
            p: template.complemento?.xp?.p || '0'
        }
        },
        
        // PAINEL NARRATIVA
        narrativa: {
        arquetipo: template.narrativa?.arquetipo?.nome || '',
        motivacao: template.narrativa?.motivacao?.nome || '',
        disposicao: template.narrativa?.disposicao || '',
        historia: template.narrativa?.historia || '',
        contatos: contatosString
        },
        
        // PAINEL ITENS - TODOS OS CAMPOS
        itens: {
        // Moedas
        fo: template.inventario?.moedas?.fo || '0',
        dp: template.inventario?.moedas?.dp || '0',
        tc: template.inventario?.moedas?.tc || '0',
        
        // Limites de Peso (mapeando para os IDs corretos)
        pesoFx2: template.inventario?.peso?.medio || '0',  // #peso-fx2
        pesoFx4: template.inventario?.peso?.maximo || '0', // #peso-fx4
        pesoTotal: template.inventario?.peso?.atual || '0', // #peso-total
        
        // Lista de Itens
        lista: itensString // #itens-lista
        }
    };
    }

  // ===== VALIDAÇÃO =====
  validateTemplate(template) {
    if (!template) return false;
    
    const requiredFields = [
      'name',
      'level',
      'class',
      'attributes',
      'vit',
      'con'
    ];

    const missing = requiredFields.filter(field => !template[field]);
    
    if (missing.length > 0) {
      console.warn(`Template inválido - campos faltando:`, missing);
      return false;
    }
    
    return true;
  }

  // ===== UTILITÁRIOS DE INFORMAÇÃO =====
  getLoadedCount() {
    return this.templates.size;
  }

  getLoadedIds() {
    return Array.from(this.templates.keys());
  }

  clearCache() {
    this.templates.clear();
    this.loadedTemplates.clear();
    console.log('Cache de templates limpo');
  }
}

// Exporta uma única instância (Singleton) para ser reutilizada
const templateManager = new TemplateManager();
export default templateManager;