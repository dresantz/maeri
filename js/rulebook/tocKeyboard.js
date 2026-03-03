/**
 * tocKeyboard.js - Navegação por teclado do TOC
 * 
 * Responsável apenas por:
 * - Gerenciar foco com setas
 * - Enter / Espaço para selecionar
 * - Escape para fechar
 * 
 * @param {Object} options - Opções de configuração
 * @param {HTMLElement} options.tocList - Elemento da lista do índice
 * @param {Function} options.onClose - Callback ao pressionar ESC
 * @param {Function} options.onSelect - Callback ao selecionar item
 * @returns {Object} API com métodos focusFirst e reset
 */

export function initTOCKeyboardNavigation({ tocList, onClose, onSelect }) {
  if (!tocList) {
    console.warn('tocKeyboard: Elemento tocList não fornecido');
    return null;
  }

  tocList.setAttribute('role', 'listbox');
  tocList.tabIndex = -1;

  let activeIndex = -1;

  function getItems() {
    return Array.from(tocList.querySelectorAll('a'));
  }

  function clearActive() {
    const items = getItems();
    items.forEach(item => {
      item.classList.remove('active');
      item.removeAttribute('aria-selected');
    });
  }

  function setActive(index) {
    const items = getItems();
    if (!items.length) return;

    // Remove active do item anterior
    if (activeIndex >= 0 && items[activeIndex]) {
      items[activeIndex].classList.remove('active');
      items[activeIndex].removeAttribute('aria-selected');
    }

    activeIndex = Math.max(0, Math.min(index, items.length - 1));

    const el = items[activeIndex];
    el.classList.add('active');
    el.setAttribute('aria-selected', 'true');
    el.focus();
  }

  function handleKeyDown(e) {
    const items = getItems();
    if (!items.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive(activeIndex < 0 ? 0 : activeIndex + 1);
        break;

      case 'ArrowUp':
        e.preventDefault();
        setActive(activeIndex <= 0 ? 0 : activeIndex - 1);
        break;

      case 'Home':
        e.preventDefault();
        setActive(0);
        break;

      case 'End':
        e.preventDefault();
        setActive(items.length - 1);
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (activeIndex < 0) {
          setActive(0);
        } else {
          const selectedItem = items[activeIndex];
          selectedItem?.click();
          onSelect?.(selectedItem);
        }
        break;

      case 'Escape':
        e.preventDefault();
        clearActive();
        activeIndex = -1;
        onClose?.();
        break;

      default:
        // Suporte a busca por primeira letra (opcional)
        if (e.key.length === 1 && /[a-zA-Z]/i.test(e.key)) {
          const firstChar = e.key.toLowerCase();
          const matchIndex = items.findIndex(item => 
            item.textContent?.toLowerCase().startsWith(firstChar)
          );
          if (matchIndex >= 0) setActive(matchIndex);
        }
        break;
    }
  }

  // Remove listener antigo se existir
  tocList.removeEventListener('keydown', handleKeyDown);
  tocList.addEventListener('keydown', handleKeyDown);

  return {
    /**
     * Foca no primeiro item da lista
     */
    focusFirst() {
      requestAnimationFrame(() => {
        clearActive();
        setActive(0);
      });
    },

    /**
     * Reseta o estado de navegação
     */
    reset() {
      clearActive();
      activeIndex = -1;
    },

    /**
     * Remove listeners (cleanup)
     */
    destroy() {
      tocList.removeEventListener('keydown', handleKeyDown);
    }
  };
}