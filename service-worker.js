const CACHE_NAME = 'maeri-rpg-v2';

// Detecta automaticamente se está no GitHub Pages
const BASE_PATH = self.location.pathname.includes('/maeri/') 
  ? '/maeri' 
  : '';

const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,

  `${BASE_PATH}/pages/lore.html`,
  `${BASE_PATH}/pages/player.html`,
  `${BASE_PATH}/pages/rulebook.html`,
  `${BASE_PATH}/pages/shield.html`,
  `${BASE_PATH}/pages/dice-modal.html`,
  `${BASE_PATH}/pages/gmnotes-modal.html`,
  `${BASE_PATH}/pages/sheet-modal.html`,
  `${BASE_PATH}/pages/spells-modal.html`,

  `${BASE_PATH}/css/3d-dice.css`,
  `${BASE_PATH}/css/base.css`,
  `${BASE_PATH}/css/dice.css`,
  `${BASE_PATH}/css/floatingButtons.css`,
  `${BASE_PATH}/css/lore.css`,
  `${BASE_PATH}/css/notpat.css`,
  `${BASE_PATH}/css/rulebook.css`,
  `${BASE_PATH}/css/sheet.css`,
  `${BASE_PATH}/css/shield-modal.css`,
  `${BASE_PATH}/css/shield.css`,
  `${BASE_PATH}/css/spells.css`,
  `${BASE_PATH}/css/toc.css`,

  `${BASE_PATH}/css/builder/builder-base.css`,
  `${BASE_PATH}/css/builder/char-cards.css`,
  `${BASE_PATH}/css/builder/char-list.css`,
  `${BASE_PATH}/css/builder/e1-mentalidade.css`,
  `${BASE_PATH}/css/builder/e2-complementos.css`,
  `${BASE_PATH}/css/builder/e3-narrativa.css`,
  `${BASE_PATH}/css/builder/e4-inventario.css`,
  `${BASE_PATH}/css/builder/level-up.css`,
  `${BASE_PATH}/css/builder/player-tabs.css`,

  `${BASE_PATH}/css/gmnotes/gmnotes-base.css`,
  `${BASE_PATH}/css/gmnotes/gmnotes-combat.css`,
  `${BASE_PATH}/css/gmnotes/gmnotes-forms.css`,
  `${BASE_PATH}/css/gmnotes/gmnotes-modal.css`,
  `${BASE_PATH}/css/gmnotes/gmnotes-notes.css`,
  `${BASE_PATH}/css/gmnotes/gmnotes-npcs.css`,
  `${BASE_PATH}/css/gmnotes/gmnotes-players.css`,

  `${BASE_PATH}/js/characterSheetStore.js`,
  `${BASE_PATH}/js/dice-pool.js`,
  `${BASE_PATH}/js/dice.js`,
  `${BASE_PATH}/js/modalLoader.js`,
  `${BASE_PATH}/js/notpat.js`,
  `${BASE_PATH}/js/sheet.js`,
  `${BASE_PATH}/js/spell-detail.js`,
  `${BASE_PATH}/js/spells.js`,

  `${BASE_PATH}/js/builder/builder.js`,
  `${BASE_PATH}/js/builder/e1-mentalidade.js`,
  `${BASE_PATH}/js/builder/e2-complementos.js`,
  `${BASE_PATH}/js/builder/e3-narrativa.js`,
  `${BASE_PATH}/js/builder/e4-inventario.js`,
  `${BASE_PATH}/js/builder/level-up.js`,
  `${BASE_PATH}/js/builder/player-char.js`,
  `${BASE_PATH}/js/builder/template-list.js`,
  `${BASE_PATH}/js/builder/template-manager.js`,

  `${BASE_PATH}/js/rulebook/constants.js`,
  `${BASE_PATH}/js/rulebook/loader.js`,
  `${BASE_PATH}/js/rulebook/main.js`,
  `${BASE_PATH}/js/rulebook/navigation.js`,
  `${BASE_PATH}/js/rulebook/renderer.js`,
  `${BASE_PATH}/js/rulebook/toc.js`,
  `${BASE_PATH}/js/rulebook/tocKeyboard.js`,
  `${BASE_PATH}/js/rulebook/uiReset.js`,

  `${BASE_PATH}/js/search/searchIndex.js`,
  `${BASE_PATH}/js/search/searchRouter.js`,
  `${BASE_PATH}/js/search/searchUI.js`,

  `${BASE_PATH}/js/shield/gm-combat.js`,
  `${BASE_PATH}/js/shield/gm-npcs.js`,
  `${BASE_PATH}/js/shield/gm-players.js`,
  `${BASE_PATH}/js/shield/gm-sectionNotes.js`,
  `${BASE_PATH}/js/shield/gmnotes-loader.js`,
  `${BASE_PATH}/js/shield/gmnotes-modal.js`,
  `${BASE_PATH}/js/shield/shield-modal.js`,

  `${BASE_PATH}/data/rulebook/00-modelo.json`,
  `${BASE_PATH}/data/rulebook/01-fundamentos.json`,
  `${BASE_PATH}/data/rulebook/02-personagem.json`,
  `${BASE_PATH}/data/rulebook/03-combate.json`,
  `${BASE_PATH}/data/rulebook/04-magia.json`,
  `${BASE_PATH}/data/rulebook/05-circulo-social-comercio.json`,
  `${BASE_PATH}/data/rulebook/06-seres.json`,
  `${BASE_PATH}/data/rulebook/07-classes.json`,
  `${BASE_PATH}/data/rulebook/08-maeri.json`,
  `${BASE_PATH}/data/rulebook/09-campanha.json`,

  `${BASE_PATH}/data/Maeri - Livro I.pdf`,

  `${BASE_PATH}/data/char-template/cleric-1.json`,
  `${BASE_PATH}/data/char-template/druid-1.json`,
  `${BASE_PATH}/data/char-template/mage-1.json`,
  `${BASE_PATH}/data/char-template/model.json`,
  `${BASE_PATH}/data/char-template/paladin-1.json`,
  `${BASE_PATH}/data/char-template/rogue-1.json`,
  `${BASE_PATH}/data/char-template/warrior-1.json`
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto com BASE_PATH:', BASE_PATH);
        return cache.addAll(urlsToCache);
      })
  );
});

// Intercepta requisições e serve do cache se disponível
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {

        if (response) {
          return response;
        }

        return fetch(event.request).then(response => {

          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });

      })
  );
});

// Limpa caches antigos quando uma nova versão é ativada
self.addEventListener('activate', event => {

  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(cacheNames => {

      return Promise.all(
        cacheNames.map(cacheName => {

          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }

        })
      );

    })
  );

  self.clients.claim();

});

// Escuta mensagens do frontend para pular a espera
self.addEventListener('message', (event) => {

  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }

});