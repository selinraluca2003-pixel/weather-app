// ----- Sea (waves, water temperature) and snow (depth, new snow, freezing level) -----
let seaCounter = 0;
let lastSea = null;

// Distance between two points on Earth, in km
function distanceKm(lat1, lon1, lat2, lon2) {
  const rad = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

const lengthUnit = (meters, digits = 1) =>
  units.isImperial() ? `${(meters * 3.281).toFixed(digits)} ft` : `${meters.toFixed(digits)} m`;

async function showSea(place) {
  const myId = ++seaCounter;
  lastSea = null;
  renderSea();
  const url =
    `https://marine-api.open-meteo.com/v1/marine?latitude=${place.latitude}&longitude=${place.longitude}` +
    `&current=wave_height,wave_direction,wave_period,sea_surface_temperature&daily=wave_height_max` +
    `&forecast_days=3&timezone=auto&cell_selection=sea` +
    (units.isImperial() ? "&temperature_unit=fahrenheit" : "");
  try {
    const data = await fetchJSON(url, { retries: 0 });
    if (myId !== seaCounter) return;
    if (!data.current || data.current.wave_height === null || data.current.wave_height === undefined) return; // inland
    // Only for places near the coast: otherwise "the nearest sea" could be 150 km away
    if (distanceKm(place.latitude, place.longitude, data.latitude, data.longitude) > 30) return;
    lastSea = data;
    renderSea();
  } catch (error) {
    console.warn("Sea data unavailable:", error.message);
  }
}

function renderSea() {
  const fold = document.getElementById("fold-sea");
  if (!lastSea) {
    fold.hidden = true;
    return;
  }
  const c = lastSea.current;
  const maxWaves = Math.max(...(lastSea.daily.wave_height_max || []).filter((v) => v !== null), 0);
  fold.hidden = false;
  document.getElementById("sea").innerHTML = `
    <div class="more-grid">
      ${detailCard(t("waterTemp"), c.sea_surface_temperature === null ? "–" : `${Math.round(c.sea_surface_temperature)}°`, "")}
      ${detailCard(t("waves"), lengthUnit(c.wave_height), c.wave_direction === null ? "" : `${windArrow(c.wave_direction)} ${t("wavesFrom", { dir: compass(c.wave_direction) })}`)}
      ${detailCard(t("wavePeriod"), c.wave_period === null ? "–" : `${Math.round(c.wave_period)} s`, t("wavePeriodSub"))}
      ${detailCard(t("maxWaves"), lengthUnit(maxWaves), t("maxWavesSub"))}
    </div>
    <p class="alerts-note">${t("seaNote")}</p>`;
}

// Snow: only shown when there is snow on the ground or snow on the way
function showSnow(data, nowIndex) {
  const fold = document.getElementById("fold-snow");
  const h = data.hourly;
  if (!h.snow_depth || !data.daily.snowfall_sum) {
    fold.hidden = true; // an older saved forecast without snow data
    return;
  }
  const depth = h.snow_depth[nowIndex] || 0; // meters
  const newSnow = data.daily.snowfall_sum.slice(0, 7).reduce((sum, v) => sum + (v || 0), 0); // cm
  if (depth < 0.01 && newSnow < 0.5) {
    fold.hidden = true;
    return;
  }
  const cm = (value) => (units.isImperial() ? `${(value / 2.54).toFixed(1)} in` : `${Math.round(value)} cm`);
  const freezing = h.freezing_level_height ? h.freezing_level_height[nowIndex] : null;
  fold.hidden = false;
  document.getElementById("snow").innerHTML = `
    <div class="more-grid">
      ${detailCard(t("snowDepth"), cm(depth * 100), t("snowDepthSub"))}
      ${detailCard(t("newSnow"), cm(newSnow), t("newSnowSub"))}
      ${freezing === null || freezing === undefined ? "" : detailCard(t("freezingLevel"), lengthUnit(freezing, 0), t("freezingSub"))}
      ${data.elevation === undefined ? "" : detailCard(t("elevation"), lengthUnit(data.elevation, 0), t("elevationSub"))}
    </div>`;
}
