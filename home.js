// ----- Home page helpers: last update, start city, location, banner, folding sections -----
const DEFAULT_PLACE = { name: "Galați, RO", latitude: 45.4353, longitude: 28.008 };
const STALE_AFTER = 15 * 60 * 1000; // 15 minutes, in milliseconds

const updatedButton = document.getElementById("updated");
const locButton = document.getElementById("loc-btn");
const geoNote = document.getElementById("geo-note");
let lastUpdateTime = 0;

// ---- Last updated ----
function markUpdated(savedAt = Date.now()) {
  lastUpdateTime = savedAt;
  updatedButton.textContent = t("updated", { time: fmtClock(new Date(savedAt)) });
}

function markUpdating() {
  updatedButton.textContent = t("updating");
}

function markUpdateFailed() {
  updatedButton.textContent = t("updateFailed");
}

// Reload the weather (and the favorites). Returns a promise, so pull-to-refresh knows when it's done.
function refreshWeather() {
  const place = currentPlace || startPlace();
  return Promise.all([getWeather(place.name, place.latitude, place.longitude), renderFavorites()]);
}

function refreshIfStale() {
  if (!document.hidden && navigator.onLine && Date.now() - lastUpdateTime > STALE_AFTER) refreshWeather();
}

updatedButton.addEventListener("click", refreshWeather);
document.addEventListener("visibilitychange", refreshIfStale); // when you come back to the app
setInterval(refreshIfStale, 60 * 1000); // and a check once a minute

// ---- Message banner (offline, errors) ----
function showBanner(text) {
  document.getElementById("banner-text").textContent = text;
  document.getElementById("banner").hidden = false;
}

function hideBanner() {
  document.getElementById("banner").hidden = true;
}

document.getElementById("banner-retry").addEventListener("click", refreshWeather);
window.addEventListener("online", () => {
  hideBanner();
  refreshWeather();
});
window.addEventListener("offline", () => {
  if (latestWeather) showBanner(t("offlineBanner", { time: fmtClock(new Date(lastUpdateTime)) }));
});

// ---- Which city to open: the chosen start city, else the last one viewed, else Galați ----
function saveLastPlace(place) {
  store.set("lastPlace", place);
}

function validPlace(place) {
  return place && typeof place.latitude === "number" && typeof place.longitude === "number" ? place : null;
}

function loadLastPlace() {
  return validPlace(store.get("lastPlace"));
}

function startPlace() {
  return validPlace(store.get("startCity")) || loadLastPlace() || DEFAULT_PLACE;
}

// ---- Use my location ----
// Turns coordinates into "Galați, RO". BigDataCloud's free API is made for exactly this
// (a browser asking about its own location), and needs no key.
async function placeName(latitude, longitude) {
  const url =
    `https://api.bigdatacloud.net/data/reverse-geocode-client` +
    `?latitude=${latitude}&longitude=${longitude}&localityLanguage=${lang}`;
  const data = await fetchJSON(url, { timeout: 6000, retries: 0 });
  const name = data.city || data.locality || data.principalSubdivision;
  return name ? (data.countryCode ? `${name}, ${data.countryCode}` : name) : null;
}

locButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    geoNote.textContent = t("noGeo");
    return;
  }

  geoNote.textContent = t("findingLocation");
  locButton.disabled = true;

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      // 2 decimals is about 1 km: plenty for weather, and kinder to your privacy
      const latitude = Number(position.coords.latitude.toFixed(2));
      const longitude = Number(position.coords.longitude.toFixed(2));

      let name = null;
      try {
        name = await placeName(latitude, longitude);
      } catch (error) {
        console.warn("Place name unavailable:", error.message);
      }

      locButton.disabled = false;
      geoNote.textContent = "";
      getWeather(name || t("myLocation"), latitude, longitude);
    },
    (error) => {
      locButton.disabled = false;
      geoNote.textContent = error.code === 1 ? t("geoDenied") : t("geoFailed");
    },
    { timeout: 10000, maximumAge: 10 * 60 * 1000 }
  );
});

// ---- Collapsible sections remember if they were open ----
document.querySelectorAll("details.fold").forEach((fold) => {
  const saved = store.get("fold:" + fold.id);
  if (saved !== null) fold.open = saved === "open";
  fold.addEventListener("toggle", () => store.set("fold:" + fold.id, fold.open ? "open" : "closed"));
});
