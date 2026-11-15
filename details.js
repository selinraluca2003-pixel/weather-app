// ----- More weather details -----

// Degrees (0-360) -> "NW" (or "NV" in Romanian)
function compass(degrees) {
  return t("compass")[Math.round(degrees / 22.5) % 16];
}

function uvLabel(uv) {
  if (uv < 3) return t("uvLow");
  if (uv < 6) return t("uvModerate");
  if (uv < 8) return t("uvHigh");
  if (uv < 11) return t("uvVeryHigh");
  return t("uvExtreme");
}

function dewLabel(dewCelsius) {
  if (dewCelsius < 10) return t("dewDry");
  if (dewCelsius < 16) return t("dewComfortable");
  if (dewCelsius < 18) return t("dewSlightly");
  if (dewCelsius < 21) return t("dewHumid");
  return t("dewOppressive");
}

function visibilityLabel(meters) {
  const km = meters / 1000;
  if (km >= 10) return t("visClear");
  if (km >= 4) return t("visModerate");
  if (km >= 1) return t("visPoor");
  return t("visVeryPoor");
}

function cloudLabel(clouds) {
  return clouds < 20 ? t("cloudsClear") : clouds < 70 ? t("cloudsPartly") : t("cloudsOvercast");
}

// 35400 seconds -> "9h 50m"
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return t("duration", { h: hours, m: minutes });
}

// Moon phase worked out from the date (no internet needed)
function moonPhase() {
  const synodicMonth = 29.530588853; // days between two new moons
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
  const days = (Date.now() - knownNewMoon) / 86400000;
  const phase = (((days % synodicMonth) + synodicMonth) % synodicMonth) / synodicMonth; // 0 to 1

  const icons = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
  const index = Math.round(phase * 8) % 8;
  const lit = Math.round(((1 - Math.cos(2 * Math.PI * phase)) / 2) * 100);

  return { icon: icons[index], name: t("moonNames")[index], lit };
}

// The arrow points where the wind is going, so it turns 180° from the "from" direction
function windArrow(degrees) {
  return `<span class="wind-arrow" style="transform: rotate(${degrees + 180}deg)">↑</span>`;
}

// One small card
function detailCard(label, value, sub, small = false) {
  return `
    <div class="more-card">
      <span class="label">${label}</span>
      <span class="more-value ${small ? "small" : ""}">${value}</span>
      <span class="more-sub">${sub}</span>
    </div>`;
}

// "More details" on the Home page
function showDetails(data, nowIndex) {
  const h = data.hourly;
  const daily = data.daily;
  const i = nowIndex;
  const uv = h.uv_index[i];
  const dew = h.dew_point_2m[i];
  const moon = moonPhase();

  document.getElementById("more-details").innerHTML =
    detailCard(t("uvIndex"), uv.toFixed(1), t("uvPeak", { label: uvLabel(uv), n: Math.round(daily.uv_index_max[0]) })) +
    detailCard(t("pressure"), `${Math.round(h.pressure_msl[i])} hPa`, t("seaLevel")) +
    detailCard(t("visibility"), units.visibility(h.visibility[i]), visibilityLabel(h.visibility[i])) +
    detailCard(t("dewPoint"), `${Math.round(dew)}°`, dewLabel(units.toCelsius(dew))) +
    detailCard(t("cloudCover"), `${Math.round(h.cloud_cover[i])}%`, cloudLabel(h.cloud_cover[i])) +
    detailCard(t("windFrom"), `${windArrow(h.wind_direction_10m[i])} ${compass(h.wind_direction_10m[i])}`, t("gusts", { n: Math.round(h.wind_gusts_10m[i]), u: units.windUnit() })) +
    detailCard(t("sunriseSunset"), `${fmtTime(daily.sunrise[0])} – ${fmtTime(daily.sunset[0])}`, t("daylight", { d: formatDuration(daily.daylight_duration[0]) }), true) +
    detailCard(t("moon"), `${moon.icon} ${moon.lit}%`, moon.name);
}

// ----- Hour detail page -----
let latestWeather = null; // newest forecast, set by renderWeather
const hourPage = { index: 0 };

function renderHourPage() {
  const data = latestWeather;
  if (!data) return;
  const h = data.hourly;
  const i = hourPage.index;
  const iso = h.time[i];

  const day = capitalize(new Date(iso.slice(0, 10) + "T12:00").toLocaleDateString(locale(), { weekday: "short", day: "numeric", month: "short" }));
  document.getElementById("hour-title").textContent =
    i === weatherNow.index ? `${t("now")} · ${fmtTime(iso)}` : `${day} · ${fmtTime(iso)}`;

  const code = h.weather_code[i];
  document.getElementById("hour-icon").innerHTML = weatherIcon(code, h.is_day[i]);
  document.getElementById("hour-temp").textContent = Math.round(h.temperature_2m[i]) + "°";
  document.getElementById("hour-condition").textContent = weatherText(code);

  const uv = h.uv_index[i];
  const direction = h.wind_direction_10m[i];
  const dew = h.dew_point_2m[i];

  document.getElementById("hour-grid").innerHTML =
    detailCard(t("feelsLike"), `${Math.round(h.apparent_temperature[i])}°`, "") +
    detailCard(t("humidity"), `${Math.round(h.relative_humidity_2m[i])}%`, "") +
    detailCard(t("rainChance"), `${h.precipitation_probability[i]}%`, "") +
    detailCard(t("rainAmount"), `${h.precipitation[i].toFixed(1)} mm`, "") +
    detailCard(t("windFrom"), `${windArrow(direction)} ${compass(direction)}`, t("speedGusts", { s: Math.round(h.wind_speed_10m[i]), u: units.windUnit(), g: Math.round(h.wind_gusts_10m[i]) })) +
    detailCard(t("uvIndex"), uv.toFixed(1), uvLabel(uv)) +
    detailCard(t("cloudCover"), `${Math.round(h.cloud_cover[i])}%`, cloudLabel(h.cloud_cover[i])) +
    detailCard(t("pressure"), `${Math.round(h.pressure_msl[i])} hPa`, t("seaLevel")) +
    detailCard(t("visibility"), units.visibility(h.visibility[i]), visibilityLabel(h.visibility[i])) +
    detailCard(t("dewPoint"), `${Math.round(dew)}°`, dewLabel(units.toCelsius(dew)));

  document.getElementById("hour-prev").disabled = i <= 0;
  document.getElementById("hour-next").disabled = i >= h.time.length - 1;
}

function openHourPage(index) {
  if (!latestWeather || Number.isNaN(index)) return;
  hourPage.index = index;
  renderHourPage();
  openSubPage("page-hour");
}

// step = -1 (earlier) or +1 (later). Returns false at the ends of the forecast.
function changeHour(step) {
  const last = latestWeather.hourly.time.length - 1;
  const next = Math.min(last, Math.max(0, hourPage.index + step));
  if (next === hourPage.index) return false;
  hourPage.index = next;
  renderHourPage();
  return true;
}

// Tapping any hour row opens its page
document.addEventListener("click", (event) => {
  const row = event.target.closest(".hour-row");
  if (row) openHourPage(Number(row.dataset.i));
});

document.getElementById("hour-prev").addEventListener("click", () => changeHour(-1));
document.getElementById("hour-next").addEventListener("click", () => changeHour(1));
