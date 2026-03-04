// js/shield/gmnotes-loader.js
const GMNOTES_MODAL_PATH = '../pages/gmnotes-modal.html';

export async function loadGMNotesModal() {
  // Verifica se o modal já existe
  if (document.getElementById('gmnotes-modal')) {
    return;
  }

  try {
    const response = await fetch(GMNOTES_MODAL_PATH);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const modal = createModalFromHTML(html);
    
    document.body.appendChild(modal);
  } catch (error) {
    console.error('Erro ao carregar GM Notes modal:', error.message);
  }
}

function createModalFromHTML(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.firstElementChild;
}