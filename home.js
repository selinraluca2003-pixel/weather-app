// ----- Home page helpers: last update, remembered city, location, folding sections -----
const DEFAULT_PLACE = { name: "Galați, RO", latitude: 45.4353, longitude: 28.008 };
const STALE_AFTER = 15 * 60 * 1000; // 15 minutes, in milliseconds

const updatedButton = document.getElementById("updated");
const locButton = document.getElementById("loc-btn");
const geoNote = document.getElementById("geo-note");
let lastUpdateTime = 0;

// ---- Last updated ----
function markUpdated() {
  lastUpdateTime = Date.now();
  const clock = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  updatedButton.textContent = `Updated ${clock} · ↻ Refresh`;
}

function markUpdateFailed() {
  updatedButton.textContent = "Update failed · ↻ Try again";
}

function refreshWeather() {
  const place = currentPlace || loadLastPlace() || DEFAULT_PLACE;
  updatedButton.textContent = "Updating…";
  getWeather(place.name, place.latitude, place.longitude);
  renderFavorites();
}

function refreshIfStale() {
  if (!document.hidden && Date.now() - lastUpdateTime > STALE_AFTER) refreshWeather();
}

updatedButton.addEventListener("click", refreshWeather);
document.addEventListener("visibilitychange", refreshIfStale); // when you come back to the tab
setInterval(refreshIfStale, 60 * 1000); // and a check once a minute

// ---- Remember the last city ----
function saveLastPlace(place) {
  try {
    localStorage.setItem("lastPlace", JSON.stringify(place));
  } catch (error) {
    console.error(error);
  }
}

function loadLastPlace() {
  try {
    const place = JSON.parse(localStorage.getItem("lastPlace"));
    if (place && typeof place.latitude === "number" && typeof place.longitude === "number") return place;
  } catch (error) {}
  return null;
}

// ---- Use my location ----
locButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    geoNote.textContent = "Your browser doesn't support location.";
    return;
  }

  geoNote.textContent = "Finding your location…";
  locButton.disabled = true;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      locButton.disabled = false;
      geoNote.textContent = "";
      // 2 decimals is about 1 km: plenty for weather, and kinder to your privacy
      const latitude = Number(position.coords.latitude.toFixed(2));
      const longitude = Number(position.coords.longitude.toFixed(2));
      getWeather("My location", latitude, longitude);
    },
    (error) => {
      locButton.disabled = false;
      geoNote.textContent =
        error.code === 1
          ? "Location permission was denied. You can allow it in the browser's site settings."
          : "Couldn't find your location. Try again, or search for a city.";
    },
    { timeout: 10000, maximumAge: 10 * 60 * 1000 }
  );
});

// ---- Collapsible sections remember if they were open ----
document.querySelectorAll("details.fold").forEach((fold) => {
  try {
    const saved = localStorage.getItem("fold:" + fold.id);
    if (saved !== null) fold.open = saved === "open";
  } catch (error) {}

  fold.addEventListener("toggle", () => {
    try {
      localStorage.setItem("fold:" + fold.id, fold.open ? "open" : "closed");
    } catch (error) {
      console.error(error);
    }
  });
});