// ----- Main: loading the weather and drawing it -----
let weatherCounter = 0;
let latestMeta = { live: false, savedAt: 0 }; // was the shown data just downloaded, and when?
const weatherNow = { index: 0, todayStart: 0 }; // where "now" and "today" are in the hourly lists

const HOURLY_VARS =
  "temperature_2m,weather_code,precipitation_probability,wind_gusts_10m,uv_index,pressure_msl,visibility," +
  "dew_point_2m,cloud_cover,wind_direction_10m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,is_day";
const DAILY_VARS =
  "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min," +
  "precipitation_probability_max,precipitation_sum,precipitation_hours,sunrise,sunset,daylight_duration," +
  "sunshine_duration,uv_index_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant";

function weatherURL(latitude, longitude) {
  return (
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day` +
    `&hourly=${HOURLY_VARS}&daily=${DAILY_VARS}` +
    `&minutely_15=precipitation&past_minutely_15=1&forecast_minutely_15=12` + // the rain countdown, in the same request
    `&timezone=auto&forecast_days=14${units.param()}`
  );
}

// ---- Saved copies of recent forecasts: instant start, and something to show when offline ----
const CACHE_KEY = "weatherCache";
const CACHE_SIZE = 5; // remember the last 5 places

function loadCached(place) {
  const cache = store.get(CACHE_KEY, []);
  return (Array.isArray(cache) ? cache : []).find((entry) => entry.key === favKey(place) && entry.units === units.system) || null;
}

function saveCached(place, data) {
  let cache = store.get(CACHE_KEY, []);
  if (!Array.isArray(cache)) cache = [];
  cache = cache.filter((entry) => entry.key !== favKey(place));
  cache.unshift({ key: favKey(place), units: units.system, savedAt: Date.now(), data });
  store.set(CACHE_KEY, cache.slice(0, CACHE_SIZE));
}

// "Now" at the city itself, as "2026-11-15T11:20" (uses the city's own time zone from the forecast)
function placeNowISO(data) {
  return new Date(Date.now() + data.utc_offset_seconds * 1000).toISOString().slice(0, 16);
}

// Load the weather for a place: show a saved copy straight away (if any), then the fresh one
async function getWeather(name, latitude, longitude) {
  const place = { name, latitude, longitude };
  const myId = ++weatherCounter;
  const switching = !currentPlace || favKey(currentPlace) !== favKey(place);
  const cached = loadCached(place);
  markUpdating();

  if (cached && (switching || !latestWeather)) {
    renderWeather(place, cached.data, { live: false, savedAt: cached.savedAt });
  }

  try {
    const data = await fetchJSON(weatherURL(latitude, longitude), { timeout: 12000 });
    if (myId !== weatherCounter) return; // you picked another city while this one was loading
    saveCached(place, data);
    hideBanner();
    renderWeather(place, data, { live: true, savedAt: Date.now() });
  } catch (error) {
    if (myId !== weatherCounter) return;
    console.error(error);
    markUpdateFailed();
    if (cached || (latestWeather && !switching)) {
      const time = fmtClock(new Date(cached ? cached.savedAt : latestMeta.savedAt));
      showBanner(navigator.onLine ? t("staleBanner", { time }) : t("offlineBanner", { time }));
    } else {
      showBanner(t("loadFailedBanner"));
      if (!latestWeather) document.getElementById("condition").textContent = t("couldNotLoad");
    }
  }
}

// Draw a forecast on every page.
// live: just downloaded (so current conditions are exact) or a saved copy (read them from the hourly list).
// redraw: only the language or time format changed, so don't download extras again.
function renderWeather(place, data, { live, savedAt, redraw = false }) {
  latestWeather = data;
  latestMeta = { live, savedAt };
  currentPlace = place;
  updateStar();
  saveLastPlace(place);

  const nowISO = placeNowISO(data);
  let nowIndex = data.hourly.time.findIndex((time) => time.startsWith(nowISO.slice(0, 13)));
  if (nowIndex === -1) nowIndex = 0;
  let todayStart = data.hourly.time.findIndex((time) => time.startsWith(nowISO.slice(0, 10)));
  if (todayStart === -1) todayStart = 0;
  weatherNow.index = nowIndex;
  weatherNow.todayStart = todayStart;

  // A saved copy's "current" is old, so take the current hour from the hourly list instead
  const h = data.hourly;
  const current = live
    ? data.current
    : {
        temperature_2m: h.temperature_2m[nowIndex],
        apparent_temperature: h.apparent_temperature[nowIndex],
        relative_humidity_2m: h.relative_humidity_2m[nowIndex],
        wind_speed_10m: h.wind_speed_10m[nowIndex],
        weather_code: h.weather_code[nowIndex],
        is_day: h.is_day[nowIndex],
      };

  // Home page
  document.getElementById("city").textContent = place.name;
  document.getElementById("icon").innerHTML = weatherIcon(current.weather_code, current.is_day);
  document.getElementById("temp").textContent = Math.round(current.temperature_2m) + "°";
  document.getElementById("condition").textContent = weatherText(current.weather_code);
  document.getElementById("rain").textContent = t("chanceOfRain", { p: h.precipitation_probability[nowIndex] });
  document.getElementById("feels").textContent = Math.round(current.apparent_temperature) + "°";
  document.getElementById("humidity").textContent = Math.round(current.relative_humidity_2m) + "%";
  document.getElementById("wind").textContent = Math.round(current.wind_speed_10m) + " " + units.windUnit();
  markUpdated(savedAt);

  // Other pages
  fillHourList("today-list", data, todayStart, todayStart + 24, nowIndex, false);
  fillHourList("list-48h", data, nowIndex, nowIndex + 48, nowIndex, true);
  drawTempChart("chart-today", data, todayStart, todayStart + 24, nowIndex);
  drawTempChart("chart-48h", data, nowIndex, nowIndex + 48, nowIndex);
  drawTempChart("chart-home", data, nowIndex, nowIndex + 24, nowIndex);
  showDaily(data);
  showRainBars(data, nowIndex);
  showDetails(data, nowIndex);
  showRainCountdown(data, nowISO);
  showAlerts(data, nowIndex, place.latitude, place.longitude, live);
  if (live && !redraw) showAir(place.latitude, place.longitude);
  applyWeatherTheme(current.weather_code, current.is_day);

  // Keep an open hour or day page up to date
  const page = currentPageId();
  if (page === "page-hour") renderHourPage();
  if (page === "page-day") renderDayPage();
}

// ---- Lists ----
// Build one row of an hour list (tap it to open that hour's page)
function hourRowHTML(label, icon, rain, temp, isNow, index, feels) {
  return `
    <button class="hour-row ${isNow ? "now" : ""}" data-i="${index}">
      <span class="row-time">${label}</span>
      <span class="emoji">${icon}</span>
      <span class="row-rain">💧 ${rain}%</span>
      <span class="row-temp">
        ${temp}°
        <span class="row-feels">${t("feelsShort", { t: feels })}</span>
      </span>
      <span class="chev">›</span>
    </button>`;
}

// Fill a list with hours from index "from" up to (not including) "to"
function fillHourList(containerId, data, from, to, nowIndex, withDay) {
  const h = data.hourly;
  to = Math.min(to, h.time.length);
  let html = "";

  for (let i = from; i < to; i++) {
    let label = fmtTime(h.time[i]);
    if (withDay) label = `${fmtWeekday(h.time[i])} ${label}`;
    if (i === nowIndex) label = t("now");

    html += hourRowHTML(
      label,
      weatherIcon(h.weather_code[i], h.is_day[i]),
      h.precipitation_probability[i],
      Math.round(h.temperature_2m[i]),
      i === nowIndex,
      i,
      Math.round(h.apparent_temperature[i])
    );
  }
  document.getElementById(containerId).innerHTML = html; // one update instead of 48 small ones: faster
}

// The 14-day list (each day opens its own page)
function showDaily(data) {
  const daily = data.daily;
  document.getElementById("daily").innerHTML = daily.time
    .map((date, i) => {
      const name = i === 0
        ? t("today")
        : new Date(date + "T12:00").toLocaleDateString(locale(), { weekday: "short", day: "numeric" });
      return `
        <button class="day day-row" data-d="${i}">
          <span class="day-name">${name}</span>
          <span class="emoji">${weatherIcon(daily.weather_code[i], 1)}</span>
          <span class="rain-chance">💧 ${daily.precipitation_probability_max[i]}%</span>
          <span class="range">${Math.round(daily.temperature_2m_max[i])}° <span class="low">${Math.round(daily.temperature_2m_min[i])}°</span></span>
          <span class="chev">›</span>
        </button>`;
    })
    .join("");
}

// Bars showing the chance of rain for the next 12 hours
function showRainBars(data, nowIndex) {
  let html = "";
  const end = Math.min(nowIndex + 12, data.hourly.time.length);
  for (let i = nowIndex; i < end; i++) {
    const chance = data.hourly.precipitation_probability[i];
    const label = i === nowIndex ? t("now") : fmtHourShort(data.hourly.time[i]);
    html += `
      <div class="rain-col">
        <span>${chance}%</span>
        <div class="bar-track">
          <div class="rain-bar" style="height:${Math.max(chance, 3)}%"></div>
        </div>
        <span class="rain-hour">${label}</span>
      </div>`;
  }
  document.getElementById("rain-bars").innerHTML = html;
}

// ---- Search ----
function placeLabel(place) {
  return place.country_code ? `${place.name}, ${place.country_code}` : place.name;
}

// Turn a city name into coordinates, then load its weather
async function searchCity(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=${lang}`;
  try {
    const data = await fetchJSON(url);
    if (!data.results) {
      document.getElementById("geo-note").textContent = t("cityNotFound");
      return;
    }
    document.getElementById("geo-note").textContent = "";
    const place = data.results[0];
    getWeather(placeLabel(place), place.latitude, place.longitude);
  } catch (error) {
    document.getElementById("geo-note").textContent = t("searchFailed");
    console.error(error);
  }
}

// ----- Search suggestions (autocomplete) -----
const searchInput = document.getElementById("search-input");
const suggestionsList = document.getElementById("suggestions");
let suggestionResults = [];
let searchTimer = null;
let searchCounter = 0;

function hideSuggestions() {
  suggestionsList.classList.remove("open");
}

function showSuggestions(results) {
  suggestionResults = results;
  if (results.length === 0) {
    suggestionsList.innerHTML = `<li class="empty">${t("noCities")}</li>`;
  } else {
    suggestionsList.innerHTML = results
      .map((place, i) => {
        // e.g. "Ontario, Canada" (skip empty parts)
        const sub = [place.admin1, place.country].filter(Boolean).join(", ");
        return `<li data-index="${i}">${escapeHTML(place.name)}<span class="sub">${escapeHTML(sub)}</span></li>`;
      })
      .join("");
  }
  suggestionsList.classList.add("open");
}

async function fetchSuggestions(text) {
  const myId = ++searchCounter; // remember which search this is
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(text)}&count=5&language=${lang}`;
  try {
    const data = await fetchJSON(url, { retries: 0 });
    if (myId !== searchCounter) return; // you kept typing: a newer search exists
    showSuggestions(data.results || []);
  } catch (error) {
    console.warn("Suggestions unavailable:", error.message);
  }
}

// Typing: wait for a short pause, then search
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  const text = searchInput.value.trim();
  if (text.length < 2) {
    searchCounter++; // cancel any search still in flight
    hideSuggestions();
    return;
  }
  searchTimer = setTimeout(() => fetchSuggestions(text), 300);
});

// Clicking a suggestion
suggestionsList.addEventListener("click", (event) => {
  const item = event.target.closest("li[data-index]");
  if (!item) return;
  const place = suggestionResults[Number(item.dataset.index)];
  getWeather(placeLabel(place), place.latitude, place.longitude);
  searchInput.value = "";
  searchInput.blur(); // closes the phone keyboard
  hideSuggestions();
});

// Clicking anywhere else, or pressing Escape, closes the dropdown
document.addEventListener("click", (event) => {
  if (!event.target.closest(".search-box")) hideSuggestions();
});
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideSuggestions();
});

// When the form is submitted, search for the typed city
document.getElementById("search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  clearTimeout(searchTimer);
  searchCounter++;
  hideSuggestions();
  searchCity(searchInput.value.trim());
  searchInput.value = "";
  searchInput.blur();
});

// ---- Start ----
function showTodayDate() {
  document.getElementById("date").textContent = capitalize(
    new Date().toLocaleDateString(locale(), { weekday: "long", day: "numeric", month: "long" })
  );
}

showTodayDate();
const firstPlace = startPlace();
getWeather(firstPlace.name, firstPlace.latitude, firstPlace.longitude);
renderFavorites();
