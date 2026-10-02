// Service worker: busca sempre a versão mais nova na internet e usa a cópia salva quando estiver offline.
const CACHE = 'construtora-jr-v3';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.url.includes('version.json')) return; // sempre direto da rede
  e.respondWith(
    fetch(req.url, { cache: 'no-store', credentials: 'same-origin' })
      .then(res => {
        if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
