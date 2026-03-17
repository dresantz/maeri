// Detecta automaticamente se está rodando em GitHub Pages
const BASE_PATH = location.hostname.includes("github.io")
  ? "/maeri/"
  : "/";

window.BASE_PATH = BASE_PATH;