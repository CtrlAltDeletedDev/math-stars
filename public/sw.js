// Offline support.
//
// The app has always advertised itself as installable — the manifest sets
// standalone display, and an install banner actively nags to "Add to Home
// Screen for the full app experience!" — but there was no service worker at
// all. So the home-screen icon opened a browser error page in the car, on a
// plane, or anywhere the signal dropped, which is most of the time for an app
// a six-year-old uses.
//
// Two strategies, chosen per request:
//   navigations  network first, falling back to the cached shell, so a new
//                deploy is picked up as soon as there is a connection but a
//                cold offline start still works.
//   everything   cache first with a background refresh. Vite fingerprints
//   else         asset filenames, so a cached one is never stale — and serving
//                it immediately is what makes an offline launch feel instant.

const CACHE = 'math-stars-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // Individually, so one missing file can't fail the whole install.
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('./index.html', copy)).catch(() => {});
          return response;
        })
        .catch(() =>
          // Any route falls back to the shell: this is a hash router, so every
          // screen lives behind the same index.html.
          caches.match('./index.html').then((cached) => cached ?? Response.error()),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => cached);
      return cached ?? network;
    }),
  );
});
