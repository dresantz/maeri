const CACHE_NAME = 'maeri-rpg-v2';

const urlsToCache = [
  '/',
  'index.html',

  'pages/lore.html',
  'pages/player.html',
  'pages/rulebook.html',
  'pages/shield.html',
  'pages/dice-modal.html',
  'pages/gmnotes-modal.html',
  'pages/sheet-modal.html',
  'pages/spells-modal.html',

  'css/3d-dice.css',
  'css/base.css',
  'css/dice.css',
  'css/floatingButtons.css',
  'css/lore.css',
  'css/notpat.css',
  'css/rulebook.css',
  'css/sheet.css',
  'css/shield-modal.css',
  'css/shield.css',
  'css/spells.css',
  'css/toc.css',

  'css/builder/builder-base.css',
  'css/builder/char-cards.css',
  'css/builder/char-list.css',
  'css/builder/e1-mentalidade.css',
  'css/builder/e2-complementos.css',
  'css/builder/e3-narrativa.css',
  'css/builder/e4-inventario.css',
  'css/builder/level-up.css',
  'css/builder/player-tabs.css',

  'css/gmnotes/gmnotes-base.css',
  'css/gmnotes/gmnotes-combat.css',
  'css/gmnotes/gmnotes-forms.css',
  'css/gmnotes/gmnotes-modal.css',
  'css/gmnotes/gmnotes-notes.css',
  'css/gmnotes/gmnotes-npcs.css',
  'css/gmnotes/gmnotes-players.css',

  'js/characterSheetStore.js',
  'js/dice-pool.js',
  'js/dice.js',
  'js/modalLoader.js',
  'js/notpat.js',
  'js/sheet.js',
  'js/spell-detail.js',
  'js/spells.js',

  'js/builder/builder.js',
  'js/builder/e1-mentalidade.js',
  'js/builder/e2-complementos.js',
  'js/builder/e3-narrativa.js',
  'js/builder/e4-inventario.js',
  'js/builder/level-up.js',
  'js/builder/player-char.js',
  'js/builder/template-list.js',
  'js/builder/template-manager.js',

  'js/rulebook/constants.js',
  'js/rulebook/loader.js',
  'js/rulebook/main.js',
  'js/rulebook/navigation.js',
  'js/rulebook/renderer.js',
  'js/rulebook/toc.js',
  'js/rulebook/tocKeyboard.js',
  'js/rulebook/uiReset.js',

  'js/search/searchIndex.js',
  'js/search/searchRouter.js',
  'js/search/searchUI.js',

  'js/shield/gm-combat.js',
  'js/shield/gm-npcs.js',
  'js/shield/gm-players.js',
  'js/shield/gm-sectionNotes.js',
  'js/shield/gmnotes-loader.js',
  'js/shield/gmnotes-modal.js',
  'js/shield/shield-modal.js',

  'data/rulebook/00-modelo.json',
  'data/rulebook/01-fundamentos.json',
  'data/rulebook/02-personagem.json',
  'data/rulebook/03-combate.json',
  'data/rulebook/04-magia.json',
  'data/rulebook/05-circulo-social-comercio.json',
  'data/rulebook/06-seres.json',
  'data/rulebook/07-classes.json',
  'data/rulebook/08-maeri.json',
  'data/rulebook/09-campanha.json',

  'data/Maeri - Livro I.pdf',

  'data/char-template/cleric-1.json',
  'data/char-template/druid-1.json',
  'data/char-template/mage-1.json',
  'data/char-template/model.json',
  'data/char-template/paladin-1.json',
  'data/char-template/rogue-1.json',
  'data/char-template/warrior-1.json'
];


// Instalação do Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
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