const CACHE_NAME = "nova-calc-v29";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/rv-powered-dark.png",
  "./icons/rv-mark-dark.png",
  "./icons/rv-full-dark.png",

  "./styles/base.css",
  "./styles/layout.css",
  "./styles/lcd.css",
  "./styles/keypad.css",
  "./styles/drawers.css",
  "./styles/onboarding.css",
  "./styles/splash.css",
  "./styles/responsive.css",

  "./src/main.js",
  "./src/diagnostics.js",
  "./src/dom.js",
  "./src/storage.js",
  "./src/toast.js",
  "./src/audio.js",
  "./src/speech.js",
  "./src/theme.js",
  "./src/settings.js",
  "./src/bubbles.js",
  "./src/state.js",
  "./src/render.js",
  "./src/checkOverlay.js",
  "./src/history.js",
  "./src/shareImage.js",
  "./src/shareModal.js",
  "./src/menu.js",
  "./src/install.js",
  "./src/keypad.js",
  "./src/paste.js",
  "./src/splash.js",
  "./src/onboarding.js",
  "./src/converter.js",
  "./src/gstCalculator.js",
  "./src/emiCalculator.js",
  "./src/cashCalculator.js",
  "./src/discountCalculator.js",
  "./src/splitCalculator.js",
  "./src/updater.js",
  "./src/ageCalculator.js",
  "./src/drawers.js",
  "./src/core/engine.js",
  "./src/core/format.js",
  "./src/core/numberWords.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith(self.location.origin)) return; // let cross-origin requests (e.g. the live currency API) go straight to the network
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
