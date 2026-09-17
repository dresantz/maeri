// ============================================================
// Service Worker — Maeri RPG
// ============================================================

const CACHE_NAME = 'maeri-rpg-v5';

const BASE_PATH = self.location.pathname.replace(/\/service-worker\.js$/, '');

const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,

  `${BASE_PATH}/pages/player.html`,
  `${BASE_PATH}/pages/rulebook.html`,
  `${BASE_PATH}/pages/shield.html`,
  `${BASE_PATH}/pages/dice-modal.html`,
  `${BASE_PATH}/pages/sheet-modal.html`,
  `${BASE_PATH}/pages/spells-modal.html`,
  `${BASE_PATH}/pages/settings-modal.html`,

  `${BASE_PATH}/css/3d-dice.css`,
  `${BASE_PATH}/css/base.css`,
  `${BASE_PATH}/css/dice.css`,
  `${BASE_PATH}/css/floatingButtons.css`,
  `${BASE_PATH}/css/notpat.css`,
  `${BASE_PATH}/css/rulebook.css`,
  `${BASE_PATH}/css/sheet.css`,
  `${BASE_PATH}/css/shield-modal.css`,
  `${BASE_PATH}/css/shield.css`,
  `${BASE_PATH}/css/spells.css`,
  `${BASE_PATH}/css/toc.css`,
  `${BASE_PATH}/css/settings-modal.css`,

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
  `${BASE_PATH}/css/gmnotes/gmnotes-notes.css`,
  `${BASE_PATH}/css/gmnotes/gmnotes-npcs.css`,
  `${BASE_PATH}/css/gmnotes/gmnotes-players.css`,

  `${BASE_PATH}/icons/icon-192.png`,
  `${BASE_PATH}/icons/icon-512.png`,
  `${BASE_PATH}/icons/icon-192-maskable.png`,
  `${BASE_PATH}/icons/icon-512-maskable.png`,
  `${BASE_PATH}/icons/apple-touch-icon.png`,

  `${BASE_PATH}/favicon.ico`,

  `${BASE_PATH}/js/characterSheetStore.js`,
  `${BASE_PATH}/js/dice-pool.js`,
  `${BASE_PATH}/js/dice.js`,
  `${BASE_PATH}/js/modalLoader.js`,
  `${BASE_PATH}/js/notpat.js`,
  `${BASE_PATH}/js/sheet.js`,
  `${BASE_PATH}/js/spell-detail.js`,
  `${BASE_PATH}/js/spells.js`,
  `${BASE_PATH}/js/settings.js`,

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

  `${BASE_PATH}/js/search/searchIndex.js`,
  `${BASE_PATH}/js/search/searchRouter.js`,
  `${BASE_PATH}/js/search/searchUI.js`,

  `${BASE_PATH}/js/shield/gm-combat.js`,
  `${BASE_PATH}/js/shield/gm-npcs.js`,
  `${BASE_PATH}/js/shield/gm-players.js`,
  `${BASE_PATH}/js/shield/gm-sectionNotes.js`,
  `${BASE_PATH}/js/shield/gmnotes.js`,
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

  `${BASE_PATH}/data/char-template/cleric-1.json`,
  `${BASE_PATH}/data/char-template/druid-1.json`,
  `${BASE_PATH}/data/char-template/mage-1.json`,
  `${BASE_PATH}/data/char-template/model.json`,
  `${BASE_PATH}/data/char-template/paladin-1.json`,
  `${BASE_PATH}/data/char-template/rogue-1.json`,
  `${BASE_PATH}/data/char-template/warrior-1.json`
];

// ------------------------------------------------------------
// INSTALL — precache resiliente (um 404 não derruba o SW)
// ------------------------------------------------------------
self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('[SW] Cache aberto. BASE_PATH =', BASE_PATH || '(raiz)');

      const resultados = await Promise.allSettled(
        urlsToCache.map(async url => {
          try {
            await cache.add(new Request(url, { cache: 'reload' }));
          } catch (err) {
            console.warn(`[SW] Falha ao cachear: ${url}`, err);
            throw err;
          }
        })
      );

      const falhas = resultados.filter(r => r.status === 'rejected').length;
      if (falhas > 0) {
        console.warn(`[SW] ${falhas} de ${urlsToCache.length} recurso(s) não foram cacheados.`);
      } else {
        console.log(`[SW] Precache completo: ${urlsToCache.length} recurso(s).`);
      }
    })()
  );
});

// ------------------------------------------------------------
// FETCH — cache-first com filtros (só GET same-origin)
// ------------------------------------------------------------
self.addEventListener('fetch', event => {
  const { request } = event;

  // Só intercepta GET
  if (request.method !== 'GET') return;

  // Só same-origin (ignora CDNs, fontes externas, analytics, etc.)
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        // Não cacheia respostas inválidas
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      });
    })
  );
});

// ------------------------------------------------------------
// ACTIVATE — limpa caches antigos e assume controle
// ------------------------------------------------------------
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(name => {
          if (!cacheWhitelist.includes(name)) {
            console.log('[SW] Removendo cache antigo:', name);
            return caches.delete(name);
          }
        })
      );
      await self.clients.claim();
      console.log('[SW] Ativo. CACHE_NAME =', CACHE_NAME);
    })()
  );
});

// ------------------------------------------------------------
// MESSAGE — frontend pode pedir para ativar imediatamente
// ------------------------------------------------------------
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});