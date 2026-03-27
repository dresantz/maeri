// js/builder/template-manager.js
// =========================
// Maeri RPG - Template Manager
// =========================

class TemplateManager {
  constructor() {
    this.templates = new Map();
  }

  getTemplatePath(templateId) {
    // ✅ CORRIGIDO: Mesma lógica do spells.js
    const isInPages = window.location.pathname.includes('/pages/');
    const basePath = isInPages ? '../' : './';
    return `${basePath}data/char-template/${templateId}.json`;
  }

  async loadTemplate(templateId) {
    if (this.templates.has(templateId)) {
      return this.templates.get(templateId);
    }

    try {
      const url = this.getTemplatePath(templateId);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      const templateKey = Object.keys(data)[0];
      const template = data[templateKey];
      
      if (!template) throw new Error('Template não encontrado no JSON');
      
      template._meta = {
        id: templateId,
        loadedAt: new Date().toISOString()
      };
      
      this.templates.set(templateId, template);
      return template;
      
    } catch (error) {
      console.error(`Erro ao carregar template ${templateId}:`, error);
      return null;
    }
  }

  async loadTemplates(templateIds) {
    const results = await Promise.allSettled(templateIds.map(id => this.loadTemplate(id)));
    
    const loaded = [], failed = [];
    results.forEach((result, i) => {
      result.status === 'fulfilled' && result.value ? loaded.push(result.value) : failed.push(templateIds[i]);
    });
    
    return { loaded, failed };
  }

  getTemplate(templateId) {
    return this.templates.get(templateId);
  }

  getAllTemplates() {
    return Array.from(this.templates.values());
  }

  templateToSheetData(template) {
    if (!template) return null;

    const processArray = (items, nameKey, descKey, separator = '; ') => {
      if (!items || !Array.isArray(items)) return '';
      return items.map(item => {
        let str = item[nameKey] || '';
        if (item[descKey]) str += str ? `: ${item[descKey]}` : item[descKey];
        return str;
      }).filter(Boolean).join(separator);
    };

    const serString = template.complemento?.ser ? 
      (template.complemento.ser.nome + (template.complemento.ser.anato ? `: ${template.complemento.ser.anato}` : '')) : '';

    const estudosString = processArray(template.complemento?.estudos, 'nome', 'conhecimentos');
    const tecnicasString = processArray(template.complemento?.tecnicas, 'nome', 'descricao');
    const classesString = processArray(template.complemento?.classes, 'nome', 'característica');
    
    const magiasString = template.complemento?.['estudos mágicos']?.map(m => 
      m.nome && m.magias ? `${m.nome}: ${m.magias}` : m.nome || ''
    ).filter(Boolean).join('; ') || '';

    const contatosString = template.narrativa?.contatos?.map(c => 
      c.nome && c.tipo ? `${c.nome} (${c.tipo})` : c.nome || ''
    ).filter(Boolean).join(', ') || '';

    const itensString = template.inventario?.itens?.map(item => {
      const partes = [item.nome || 'Item sem nome'];
      
      const peso = item.peso?.toString() || '0';
      partes.push(peso.includes('Pes') ? peso : `${peso}Pes`);
      
      partes.push(item.quantidade ? `[ ${item.quantidade} ]` : '[ 1 ]');
      if (item.nota) partes.push(item.nota);
      
      return partes.join('. ');
    }).join('\n') || '';

    return {
      name: template.name,
      level: template.level,
      
      attributes: {
        f: template.attributes?.f || '2',
        v: template.attributes?.v || '2',
        d: template.attributes?.d || '2',
        s: template.attributes?.s || '2',
        i: template.attributes?.i || '2',
        a: template.attributes?.a || '2'
      },
      
      vit: { current: template.vit?.current || '0', total: template.vit?.total || '0' },
      con: { current: template.con?.current || '0', total: template.con?.total || '0' },
      
      notas: template.notas || '',
      
      complemento: {
        ser: serString,
        estudos: estudosString,
        tecnicas: tecnicasString,
        magias: magiasString,
        classes: classesString,
        xp: {
          m: template.complemento?.xp?.m || '0',
          l: template.complemento?.xp?.l || '0',
          p: template.complemento?.xp?.p || '0'
        }
      },
      
      narrativa: {
        arquetipo: template.narrativa?.arquetipo?.nome || '',
        motivacao: template.narrativa?.motivacao?.nome || '',
        disposicao: template.narrativa?.disposicao || '',
        historia: template.narrativa?.historia || '',
        contatos: contatosString
      },
      
      itens: {
        fo: template.inventario?.moedas?.fo || '0',
        dp: template.inventario?.moedas?.dp || '0',
        tc: template.inventario?.moedas?.tc || '0',
        pesoFx2: template.inventario?.peso?.medio || '0',
        pesoFx4: template.inventario?.peso?.maximo || '0',
        pesoTotal: template.inventario?.peso?.atual || '0',
        lista: itensString
      }
    };
  }

  validateTemplate(template) {
    if (!template) return false;
    const required = ['name', 'level', 'class', 'attributes', 'vit', 'con'];
    return required.every(field => template[field]);
  }

  getLoadedCount() {
    return this.templates.size;
  }

  getLoadedIds() {
    return Array.from(this.templates.keys());
  }

  clearCache() {
    this.templates.clear();
  }
}

const templateManager = new TemplateManager();
export default templateManager;