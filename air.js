// ----- Air quality & pollen -----
let airCounter = 0;

// European Air Quality Index bands
const aqiBands = [
  { max: 20,       label: "Good",           color: "#3ddc97", advice: "A great time to be outside." },
  { max: 40,       label: "Fair",           color: "#9be564", advice: "Fine for most people." },
  { max: 60,       label: "Moderate",       color: "#ffd54a", advice: "Sensitive people may want to limit long outdoor effort." },
  { max: 80,       label: "Poor",           color: "#ff9800", advice: "Consider shorter outdoor activity, especially if you're sensitive." },
  { max: 100,      label: "Very poor",      color: "#ff5252", advice: "Limit time outdoors, especially children and people with breathing problems." },
  { max: Infinity, label: "Extremely poor", color: "#b04ad6", advice: "Avoid strenuous outdoor activity." },
];

function aqiBand(aqi) {
  return aqiBands.find((band) => aqi <= band.max);
}

const pollenTypes = [
  { key: "alder_pollen",   name: "Alder",   icon: "🌳" },
  { key: "birch_pollen",   name: "Birch",   icon: "🌳" },
  { key: "grass_pollen",   name: "Grass",   icon: "🌾" },
  { key: "mugwort_pollen", name: "Mugwort", icon: "🌿" },
  { key: "olive_pollen",   name: "Olive",   icon: "🫒" },
  { key: "ragweed_pollen", name: "Ragweed", icon: "🌼" },
];

// Simple general bands (grains per m³), not medical thresholds
function pollenLevel(value) {
  if (value < 10)  return { text: "Low", cls: "" };
  if (value < 50)  return { text: "Moderate", cls: "" };
  if (value < 200) return { text: "High", cls: "high" };
  return { text: "Very high", cls: "very-high" };
}

// A number, or "–" when the data is missing
function num(value) {
  return value === null || value === undefined ? "–" : Math.round(value);
}

function renderAir(c) {
  const aqi = Math.round(c.european_aqi);
  const band = aqiBand(aqi);
    const hint = document.getElementById("air-hint");
  if (hint) hint.textContent = `${aqi} · ${band.label}`;
  const markerPosition = (Math.min(aqi, 120) / 120) * 100;

  const pollutants =
    detailCard("PM2.5", num(c.pm2_5), "µg/m³ · fine particles") +
    detailCard("PM10", num(c.pm10), "µg/m³ · coarse particles") +
    detailCard("Ozone (O₃)", num(c.ozone), "µg/m³") +
    detailCard("Nitrogen dioxide", num(c.nitrogen_dioxide), "µg/m³ · traffic, industry") +
    detailCard("Sulphur dioxide", num(c.sulphur_dioxide), "µg/m³") +
    detailCard("Dust", num(c.dust), "µg/m³ · e.g. Saharan dust");

  // Pollen: list only the types that are actually present
  const present = pollenTypes
    .filter((type) => c[type.key] !== null && c[type.key] !== undefined && c[type.key] >= 1)
    .sort((a, b) => c[b.key] - c[a.key]);
  const noData = pollenTypes.every((type) => c[type.key] === null || c[type.key] === undefined);

  let pollenHTML;
  if (noData) {
    pollenHTML = `<p class="alerts-note">Pollen data isn't available for this location.</p>`;
  } else if (present.length === 0) {
    pollenHTML = `<div class="pollen-row"><span>🍃 No pollen detected right now</span></div>`;
  } else {
    pollenHTML = present
      .map((type) => {
        const value = c[type.key];
        const level = pollenLevel(value);
        return `
          <div class="pollen-row">
            <span>${type.icon} ${type.name}</span>
            <span class="pollen-level ${level.cls}">${level.text} · ${Math.round(value)}</span>
          </div>`;
      })
      .join("");
  }

  document.getElementById("air").innerHTML = `
    <div class="air-top">
      <span class="air-number" style="color:${band.color}">${aqi}</span>
      <div>
        <strong>${band.label}</strong>
        <p>${band.advice}</p>
      </div>
    </div>
    <div class="aqi-bar"><span class="aqi-marker" style="left:${markerPosition}%"></span></div>
    <div class="aqi-scale"><span>0</span><span>European AQI</span><span>100+</span></div>

    <h3 class="air-sub">Pollutants</h3>
    <div class="more-grid">${pollutants}</div>

    <h3 class="air-sub">Pollen (grains/m³)</h3>
    ${pollenHTML}

    <p class="air-credit">Air quality data: <a href="https://atmosphere.copernicus.eu" target="_blank" rel="noopener">CAMS ENSEMBLE</a> via <a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo</a></p>`;
}

// Called by getWeather every time a city loads
async function showAir(latitude, longitude) {
  const myId = ++airCounter;
  const box = document.getElementById("air");
  box.innerHTML = `<p class="placeholder small">Loading air quality…</p>`;

  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${latitude}&longitude=${longitude}` +
    `&current=european_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,dust,` +
    `alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen` +
    `&timezone=auto`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (myId !== airCounter) return; // a newer city was loaded meanwhile

    if (data.error || !data.current || data.current.european_aqi === null) {
      box.innerHTML = `<p class="placeholder small">Air quality data isn't available for this location.</p>`;
      return;
    }
    renderAir(data.current);
  } catch (error) {
    if (myId !== airCounter) return;
    box.innerHTML = `<p class="placeholder small">Air quality is unavailable right now.</p>`;
    console.error(error);
  }
}