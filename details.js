// ----- More weather details -----
const compassNames = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

// Degrees (0-360) -> "NW"
function compass(degrees) {
  return compassNames[Math.round(degrees / 22.5) % 16];
}

function uvLabel(uv) {
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very high";
  return "Extreme";
}

function dewLabel(dewCelsius) {
  if (dewCelsius < 10) return "Dry";
  if (dewCelsius < 16) return "Comfortable";
  if (dewCelsius < 18) return "Slightly humid";
  if (dewCelsius < 21) return "Humid";
  return "Oppressive";
}

function visibilityLabel(km) {
  if (km >= 10) return "Clear";
  if (km >= 4) return "Moderate";
  if (km >= 1) return "Poor";
  return "Very poor (fog)";
}

// 35400 seconds -> "9h 50m"
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

// Moon phase worked out from the date (no internet needed)
function moonPhase() {
  const synodicMonth = 29.530588853; // days between two new moons
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
  const days = (Date.now() - knownNewMoon) / 86400000;
  const phase = (((days % synodicMonth) + synodicMonth) % synodicMonth) / synodicMonth; // 0 to 1

  const names = [
    "New moon", "Waxing crescent", "First quarter", "Waxing gibbous",
    "Full moon", "Waning gibbous", "Last quarter", "Waning crescent",
  ];
  const icons = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
  const index = Math.round(phase * 8) % 8;
  const lit = Math.round(((1 - Math.cos(2 * Math.PI * phase)) / 2) * 100);

  return { icon: icons[index], name: names[index], lit };
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

// Called by getWeather every time a city loads
function showDetails(data, nowIndex) {
  const hourly = data.hourly;
  const daily = data.daily;

  const uv = hourly.uv_index[nowIndex];
  const pressure = hourly.pressure_msl[nowIndex];
  const km = hourly.visibility[nowIndex] / 1000;
  const dew = hourly.dew_point_2m[nowIndex];
  const clouds = hourly.cloud_cover[nowIndex];
  const windDirection = hourly.wind_direction_10m[nowIndex];
  const gust = hourly.wind_gusts_10m[nowIndex];

  const visibilityText = units.isImperial()
    ? `${Math.round(km / 1.609)} mi`
    : `${Math.round(km)} km`;

  const sunrise = daily.sunrise[0].slice(11, 16);
  const sunset = daily.sunset[0].slice(11, 16);
  const moon = moonPhase();

  // The arrow points where the wind is going, so it turns 180° from the "from" direction
  const arrow = `<span class="wind-arrow" style="transform: rotate(${windDirection + 180}deg)">↑</span>`;

  document.getElementById("more-details").innerHTML =
    detailCard("UV index", uv.toFixed(1), `${uvLabel(uv)} · peak ${Math.round(daily.uv_index_max[0])} today`) +
    detailCard("Pressure", `${Math.round(pressure)} hPa`, "Sea level") +
    detailCard("Visibility", visibilityText, visibilityLabel(km)) +
    detailCard("Dew point", `${Math.round(dew)}°`, dewLabel(units.toCelsius(dew))) +
    detailCard("Cloud cover", `${Math.round(clouds)}%`, clouds < 20 ? "Mostly clear" : clouds < 70 ? "Partly cloudy" : "Overcast") +
    detailCard("Wind from", `${arrow} ${compass(windDirection)}`, `Gusts ${Math.round(gust)} ${units.windUnit()}`) +
    detailCard("Sunrise · Sunset", `${sunrise} – ${sunset}`, `${formatDuration(daily.daylight_duration[0])} of daylight`, true) +
    detailCard("Moon", `${moon.icon} ${moon.lit}%`, moon.name);

  // If you switch °C/°F while looking at an hour page, refresh it
  if (document.getElementById("page-hour").classList.contains("active")) renderHourPage();
}

// ----- Hour detail page -----
let latestWeather = null; // newest forecast, set by getWeather
const hourPage = { index: 0, origin: "page-today", scrollY: 0 };

function renderHourPage() {
  const data = latestWeather;
  const h = data.hourly;
  const i = hourPage.index;

  // Where is "now" in the hourly list?
  const nowIndex = h.time.findIndex((t) => t.startsWith(data.current.time.slice(0, 13)));

  const clock = h.time[i].slice(11, 16);
  const day = new Date(h.time[i]).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  document.getElementById("hour-title").textContent =
    i === nowIndex ? `Now · ${clock}` : `${day} · ${clock}`;

  const code = h.weather_code[i];
    document.getElementById("hour-icon").innerHTML = weatherIcon(code, h.is_day[i]);
  document.getElementById("hour-temp").textContent = Math.round(h.temperature_2m[i]) + "°";
  document.getElementById("hour-condition").textContent = (weatherCodes[code] || { text: "Unknown" }).text;

  const km = h.visibility[i] / 1000;
  const visibility = units.isImperial() ? `${Math.round(km / 1.609)} mi` : `${Math.round(km)} km`;
  const uv = h.uv_index[i];
  const clouds = h.cloud_cover[i];
  const direction = h.wind_direction_10m[i];
  const arrow = `<span class="wind-arrow" style="transform: rotate(${direction + 180}deg)">↑</span>`;

  document.getElementById("hour-grid").innerHTML =
    detailCard("Feels like", `${Math.round(h.apparent_temperature[i])}°`, "") +
    detailCard("Humidity", `${Math.round(h.relative_humidity_2m[i])}%`, "") +
    detailCard("Rain chance", `${h.precipitation_probability[i]}%`, "") +
    detailCard("Rain amount", `${h.precipitation[i].toFixed(1)} mm`, "") +
    detailCard("Wind from", `${arrow} ${compass(direction)}`, `${Math.round(h.wind_speed_10m[i])} ${units.windUnit()} · gusts ${Math.round(h.wind_gusts_10m[i])}`) +
    detailCard("UV index", uv.toFixed(1), uvLabel(uv)) +
    detailCard("Cloud cover", `${Math.round(clouds)}%`, clouds < 20 ? "Mostly clear" : clouds < 70 ? "Partly cloudy" : "Overcast") +
    detailCard("Pressure", `${Math.round(h.pressure_msl[i])} hPa`, "Sea level") +
    detailCard("Visibility", visibility, visibilityLabel(km)) +
    detailCard("Dew point", `${Math.round(h.dew_point_2m[i])}°`, dewLabel(units.toCelsius(h.dew_point_2m[i])));

  document.getElementById("hour-prev").disabled = i <= 0;
  document.getElementById("hour-next").disabled = i >= h.time.length - 1;
}

function openHourPage(index) {
    if (!latestWeather || Number.isNaN(index)) return;

  // Remember where we came from, so Back can return there
  hourPage.origin = document.querySelector(".page.active").id;
  hourPage.scrollY = window.scrollY;
  hourPage.index = index;

  renderHourPage();
  showPage("page-hour", hourPage.origin); // keep the original tab highlighted
}

function changeHour(step) {
  const last = latestWeather.hourly.time.length - 1;
  hourPage.index = Math.min(last, Math.max(0, hourPage.index + step));
  renderHourPage();
}

// Tapping any hour row opens its page
document.addEventListener("click", (event) => {
  const row = event.target.closest(".hour-row");
  if (row) openHourPage(Number(row.dataset.i));
});

document.getElementById("hour-back").addEventListener("click", () => {
  showPage(hourPage.origin, hourPage.origin, hourPage.scrollY);
});
document.getElementById("hour-prev").addEventListener("click", () => changeHour(-1));
document.getElementById("hour-next").addEventListener("click", () => changeHour(1));