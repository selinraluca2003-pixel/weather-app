// ----- Air quality & pollen -----
let airCounter = 0;
let lastAir = null; // kept so a language change can redraw without asking the internet again

// European Air Quality Index bands
const aqiBands = [
  { max: 20,       label: "aqiGood",     color: "#3ddc97", advice: "adviceGood" },
  { max: 40,       label: "aqiFair",     color: "#9be564", advice: "adviceFair" },
  { max: 60,       label: "aqiModerate", color: "#ffd54a", advice: "adviceModerate" },
  { max: 80,       label: "aqiPoor",     color: "#ff9800", advice: "advicePoor" },
  { max: 100,      label: "aqiVeryPoor", color: "#ff5252", advice: "adviceVeryPoor" },
  { max: Infinity, label: "aqiExtreme",  color: "#b04ad6", advice: "adviceExtreme" },
];

function aqiBand(aqi) {
  return aqiBands.find((band) => aqi <= band.max);
}

const pollenTypes = [
  { key: "alder_pollen",   name: "alder",   icon: "🌳" },
  { key: "birch_pollen",   name: "birch",   icon: "🌳" },
  { key: "grass_pollen",   name: "grass",   icon: "🌾" },
  { key: "mugwort_pollen", name: "mugwort", icon: "🌿" },
  { key: "olive_pollen",   name: "olive",   icon: "🫒" },
  { key: "ragweed_pollen", name: "ragweed", icon: "🌼" },
];

// Simple general bands (grains per m³), not medical thresholds
function pollenLevel(value) {
  if (value < 10)  return { text: t("pollenLow"), cls: "" };
  if (value < 50)  return { text: t("pollenModerate"), cls: "" };
  if (value < 200) return { text: t("pollenHigh"), cls: "high" };
  return { text: t("pollenVeryHigh"), cls: "very-high" };
}

// A number, or "–" when the data is missing
function num(value) {
  return value === null || value === undefined ? "–" : Math.round(value);
}

function renderAir(c) {
  lastAir = c;
  const aqi = Math.round(c.european_aqi);
  const band = aqiBand(aqi);
  document.getElementById("air-hint").textContent = `${aqi} · ${t(band.label)}`;
  const markerPosition = (Math.min(aqi, 120) / 120) * 100;

  const pollutants =
    detailCard("PM2.5", num(c.pm2_5), t("fineParticles")) +
    detailCard("PM10", num(c.pm10), t("coarseParticles")) +
    detailCard(t("ozone"), num(c.ozone), "µg/m³") +
    detailCard(t("no2"), num(c.nitrogen_dioxide), t("no2Sub")) +
    detailCard(t("so2"), num(c.sulphur_dioxide), "µg/m³") +
    detailCard(t("dust"), num(c.dust), t("dustSub"));

  // Pollen: list only the types that are actually present
  const present = pollenTypes
    .filter((type) => c[type.key] !== null && c[type.key] !== undefined && c[type.key] >= 1)
    .sort((a, b) => c[b.key] - c[a.key]);
  const noData = pollenTypes.every((type) => c[type.key] === null || c[type.key] === undefined);

  let pollenHTML;
  if (noData) {
    pollenHTML = `<p class="alerts-note">${t("pollenNA")}</p>`;
  } else if (present.length === 0) {
    pollenHTML = `<div class="pollen-row"><span>🍃 ${t("noPollen")}</span></div>`;
  } else {
    pollenHTML = present
      .map((type) => {
        const value = c[type.key];
        const level = pollenLevel(value);
        return `
          <div class="pollen-row">
            <span>${type.icon} ${t("pollenNames")[type.name]}</span>
            <span class="pollen-level ${level.cls}">${level.text} · ${Math.round(value)}</span>
          </div>`;
      })
      .join("");
  }

  document.getElementById("air").innerHTML = `
    <div class="air-top">
      <span class="air-number" style="color:${band.color}">${aqi}</span>
      <div>
        <strong>${t(band.label)}</strong>
        <p>${t(band.advice)}</p>
      </div>
    </div>
    <div class="aqi-bar"><span class="aqi-marker" style="left:${markerPosition}%"></span></div>
    <div class="aqi-scale"><span>0</span><span>${t("europeanAqi")}</span><span>100+</span></div>

    <h3 class="air-sub">${t("pollutants")}</h3>
    <div class="more-grid">${pollutants}</div>

    <h3 class="air-sub">${t("pollenTitle")}</h3>
    ${pollenHTML}

    <p class="air-credit">${t("airCredit")} <a href="https://atmosphere.copernicus.eu" target="_blank" rel="noopener">CAMS ENSEMBLE</a> ${t("via")} <a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo</a></p>`;
}

// Called every time a city is loaded from the internet
async function showAir(latitude, longitude) {
  const myId = ++airCounter;
  const box = document.getElementById("air");
  if (!lastAir) box.innerHTML = `<p class="placeholder small">${t("airLoading")}</p>`;

  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${latitude}&longitude=${longitude}` +
    `&current=european_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,dust,` +
    `alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen` +
    `&timezone=auto`;

  try {
    const data = await fetchJSON(url);
    if (myId !== airCounter) return; // a newer city was loaded meanwhile

    if (!data.current || data.current.european_aqi === null) {
      lastAir = null;
      document.getElementById("air-hint").textContent = "";
      box.innerHTML = `<p class="placeholder small">${t("airNA")}</p>`;
      return;
    }
    renderAir(data.current);
  } catch (error) {
    if (myId !== airCounter) return;
    lastAir = null;
    document.getElementById("air-hint").textContent = "";
    box.innerHTML = `<p class="placeholder small">${t("airUnavailable")}</p>`;
    console.warn("Air quality unavailable:", error.message);
  }
}
