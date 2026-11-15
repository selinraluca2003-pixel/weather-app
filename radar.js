// ----- Radar map -----
const radar = {
  map: null,
  marker: null,
  host: "",
  frames: [],
  layers: [],
  index: 0,
  timer: null,
  loadedAt: 0,
};

const radarPlay = document.getElementById("radar-play");
const radarSlider = document.getElementById("radar-slider");
const radarTime = document.getElementById("radar-time");

function initRadarMap() {
  radar.map = L.map("radar-map", { minZoom: 3, maxZoom: 10 }).setView([45.43, 28.0], 6);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Radar: <a href="https://www.rainviewer.com/">RainViewer</a>',
  }).addTo(radar.map);

  radar.marker = L.circleMarker([45.43, 28.0], {
    radius: 7,
    color: "#ffffff",
    weight: 2,
    fillColor: "#ff4d6d",
    fillOpacity: 1,
  }).addTo(radar.map);
}

function stopRadar() {
  clearInterval(radar.timer);
  radar.timer = null;
  radarPlay.textContent = "▶";
}

function startRadar() {
  stopRadar();
  radar.timer = setInterval(() => {
    showRadarFrame((radar.index + 1) % radar.frames.length);
  }, 700);
  radarPlay.textContent = "⏸";
}

// Show one radar frame (its tile layer is created the first time it's needed)
function showRadarFrame(i) {
  const previous = radar.layers[radar.index];
  if (previous) previous.setOpacity(0);

  radar.index = i;
  const frame = radar.frames[i];

  if (!radar.layers[i]) {
    radar.layers[i] = L.tileLayer(
      `${radar.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`,
      { opacity: 0, maxNativeZoom: 7, maxZoom: 10, zIndex: 5 }
    ).addTo(radar.map);
  }
  radar.layers[i].setOpacity(0.75);

  radarSlider.value = i;
  refreshRadarLabel();
}

// "18:20 (7 min ago)" under the map
function refreshRadarLabel() {
  const frame = radar.frames[radar.index];
  if (!frame) return;
  const when = new Date(frame.time * 1000);
  const minutesAgo = Math.max(0, Math.round((Date.now() - when.getTime()) / 60000));
  radarTime.textContent = t("radarAgo", { clock: fmtClock(when), n: minutesAgo });
}

async function loadRadarFrames() {
  radarTime.textContent = t("loading");
  try {
    const data = await fetchJSON("https://api.rainviewer.com/public/weather-maps.json");

    stopRadar();
    radar.layers.forEach((layer) => layer && radar.map.removeLayer(layer));
    radar.layers = [];

    radar.host = data.host;
    radar.frames = data.radar.past;
    radar.loadedAt = Date.now();
    radar.index = 0;

    radarSlider.max = radar.frames.length - 1;
    showRadarFrame(0);
    startRadar();
  } catch (error) {
    radarTime.textContent = t("radarUnavailable");
    console.error(error);
  }
}

// Called every time the Radar tab is opened
function openRadar() {
  // wait a moment so the page is visible before Leaflet measures it
  setTimeout(() => {
    if (!radar.map) initRadarMap();
    radar.map.invalidateSize();

    if (currentPlace) {
      radar.map.setView([currentPlace.latitude, currentPlace.longitude], 6);
      radar.marker.setLatLng([currentPlace.latitude, currentPlace.longitude]);
    }

    if (Date.now() - radar.loadedAt > 5 * 60 * 1000) {
      loadRadarFrames();
    } else if (radar.frames.length) {
      startRadar();
    }
  }, 0);
}

// Controls
radarPlay.addEventListener("click", () => {
  if (radar.timer) stopRadar();
  else startRadar();
});

radarSlider.addEventListener("input", () => {
  stopRadar();
  showRadarFrame(Number(radarSlider.value));
});

// Open the radar on its tab (by tapping or swiping), pause it when you leave
document.addEventListener("pagechange", (event) => {
  if (event.detail.pageId === "page-radar") openRadar();
  else if (radar.map) stopRadar();
});