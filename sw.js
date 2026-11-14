// ----- Service worker: lets the app install and open offline -----
const CACHE = "weather-v1";

const APP_FILES = [
  "./", "./index.html", "./style.css", "./manifest.json",
  "./icon-192.png", "./icon-512.png",
  "./theme.js", "./nav.js", "./units.js", "./icons.js", "./alerts.js",
  "./details.js", "./air.js", "./charts.js", "./rain.js", "./fx.js",
  "./home.js", "./script.js", "./radar.js",
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

// Fetch: try the network first, use the saved copy when offline
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const ownFile = url.origin === location.origin;
  const weatherData = url.hostname.endsWith("open-meteo.com");
  if (!ownFile && !weatherData) return; // maps, radar etc. go straight to the network

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
        const saved = await caches.match(request, { ignoreSearch: ownFile });
        if (saved) return saved;
        if (request.mode === "navigate") return caches.match("./index.html");
        return Response.error();
      })
  );
});