// Minimal service worker: caches the app shell (this single-file app) so it
// still opens even with a flaky connection, and satisfies the installability
// requirement for "Add to Home Screen" on Android/Chrome. It does NOT cache
// data from the Apps Script backend — that always goes over the network, so
// you're never looking at stale progress data.
const CACHE_NAME = 'rgms-shell-v1';
const SHELL_FILES = ['./index.html', './manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Only handle same-origin GET requests for the shell itself. Everything
  // else (in particular, all calls to script.google.com) passes straight
  // through to the network untouched.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // offline fallback to whatever's cached
      return cached || network;
    })
  );
});
