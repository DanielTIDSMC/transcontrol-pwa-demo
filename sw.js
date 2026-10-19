const CACHE_NAME = 'transcontrol-taller-v5';
const APP_FILES = ['./', './index.html', './roles-app.js', './manifest.webmanifest', './icon.svg', './brand-mark.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith('transcontrol-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))
    ))
      .then(() => self.clients.claim())
  );
});

// Estrategia Network-First: Siempre intenta obtener el archivo fresco del servidor
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => {
        if (event.request.mode === 'navigate') return caches.match('./index.html');
        return caches.match(event.request);
      })
  );
});

self.addEventListener('push', event => {
  let data = { title: 'Transcontrol Taller', body: 'Tienes una actualización del taller mecánico.', url: './index.html' };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch { if (event.data) data.body = event.data.text(); }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: './icon.svg', badge: './icon.svg', tag: data.tag || 'transcontrol-taller-ops',
    data: { url: data.url || './index.html' }, vibrate: [120, 60, 120]
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || './index.html', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    const existing = clients.find(client => client.url.startsWith(self.location.origin));
    return existing ? existing.focus() : self.clients.openWindow(target);
  }));
});
