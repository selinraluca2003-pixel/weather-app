// ----- Service worker: lets the app install and open offline -----
// Change the number when you publish big changes, so phones throw away the old copies.
const CACHE = "weather-v3";

const APP_FILES = [
  "./", "./index.html", "./style.css", "./manifest.json",
  "./icon-192.png", "./icon-512.png",
  "./core.js", "./i18n.js", "./theme.js", "./nav.js", "./units.js", "./icons.js", "./alerts.js",
  "./details.js", "./day.js", "./air.js", "./charts.js", "./rain.js", "./fx.js",
  "./home.js", "./favorites.js", "./settings.js", "./gestures.js", "./script.js", "./radar.js",
];

// Install: save the app's own files (one missing file won't break the install)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(APP_FILES.map((file) => cache.add(file).catch(() => {})))
    )
  );
  self.skipWaiting();
});

// Activate: remove caches from older versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Fetch: only the app's own files. Network first, the saved copy when offline.
// Weather data is saved by the app itself (see script.js), maps and radar go straight to the network.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  if (new URL(request.url).origin !== location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const saved = await caches.match(request, { ignoreSearch: true });
        if (saved) return saved;
        if (request.mode === "navigate") return caches.match("./index.html");
        return new Response("", { status: 504, statusText: "Offline and not saved" });
      })
  );
});
