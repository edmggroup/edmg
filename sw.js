// Minimal service worker: caches the app shell (this single-file app) so it
// still opens even with a flaky connection, and satisfies the installability
// requirement for "Add to Home Screen" on Android/Chrome. It does NOT cache
// data from the Apps Script backend — that always goes over the network, so
// you're never looking at stale progress data.
// Bump this string whenever index.html or manifest.json changes in a way that
// installed copies must pick up — the activate handler deletes every cache whose
// name doesn't match, so a new name forces a fresh fetch of the shell files.
// v2: manifest orientation unlocked (was portrait-primary).
// v3: query-string requests are no longer cached, so the page's update check
//     can see what is actually published.
const CACHE_NAME = 'rgms-shell-v3';
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

// The page sends this when someone presses "Update now", so a worker that is
// waiting to take over does so immediately instead of waiting for every tab to
// close. Harmless when there is no waiting worker.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Only handle same-origin GET requests for the shell itself. Everything
  // else (in particular, all calls to script.google.com) passes straight
  // through to the network untouched.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Anything with a query string is left entirely alone. The page's update
  // check fetches itself as "?updatecheck=<date>" specifically so it misses
  // this cache and sees what is actually published, rather than the copy the
  // person is currently running. Caching it would defeat the whole point.
  if (url.search) return;

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
