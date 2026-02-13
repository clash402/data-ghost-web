const STATIC_CACHE_NAME = "data-ghost-static-v1";
const RUNTIME_CACHE_NAME = "data-ghost-runtime-v1";

const APP_SHELL_FILES = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== RUNTIME_CACHE_NAME &&
              cacheName.startsWith("data-ghost-")
            ) {
              return caches.delete(cacheName);
            }

            return Promise.resolve(false);
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

async function fetchAndCache(request) {
  const response = await fetch(request);

  if (response.ok) {
    const runtimeCache = await caches.open(RUNTIME_CACHE_NAME);
    runtimeCache.put(request, response.clone());
  }

  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetchAndCache(request).catch(async () => {
        const cachedPage = await caches.match(request);
        if (cachedPage) {
          return cachedPage;
        }

        const offlinePage = await caches.match("/offline.html");
        return offlinePage || Response.error();
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        void fetchAndCache(request);
        return cachedResponse;
      }

      return fetchAndCache(request).catch(() => Response.error());
    })
  );
});
