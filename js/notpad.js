/* =========================
   NotPat – News / Patch Notes
   Home Toggle Controller
========================= */

document.addEventListener("DOMContentLoaded", () => {
  const notpatToggle = document.getElementById("notpat-toggle");
  const notpatContent = document.getElementById("notpat-content");
  
  if (!notpatToggle || !notpatContent) return;
  
  const newsList = notpatContent.querySelector('.news-list');
  const patchList = notpatContent.querySelector('.patch-list');
  
  // Se não encontrar as listas, não prossegue
  if (!newsList || !patchList) return;
  
  let showingNews = true; // true = news, false = patches
  
  function switchContent() {
    notpatContent.classList.add("is-switching");
    notpatToggle.disabled = true; // Previne cliques durante transição
    
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (showingNews) {
          notpatToggle.textContent = "Patch Notes ⇄";
          notpatToggle.setAttribute("aria-pressed", "true");
          newsList.style.display = 'none';
          patchList.style.display = 'block';
        } else {
          notpatToggle.textContent = "Notícias ⇄";
          notpatToggle.setAttribute("aria-pressed", "false");
          newsList.style.display = 'block';
          patchList.style.display = 'none';
        }
        
        showingNews = !showingNews;
        notpatContent.classList.remove("is-switching");
        notpatToggle.disabled = false;
      }, 150);
    });
  }
  
  notpatToggle.addEventListener("click", switchContent);
});