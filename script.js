// 1. Where do we want the weather for? (Galați)
const city = "Galați";
const latitude = 45.4353;
const longitude = 28.008;

// 2. Weather codes from Open-Meteo -> icon + description
const weatherCodes = {
  0:  { icon: "☀️", text: "Clear sky" },
  1:  { icon: "🌤️", text: "Mostly clear" },
  2:  { icon: "⛅", text: "Partly cloudy" },
  3:  { icon: "☁️", text: "Overcast" },
  45: { icon: "🌫️", text: "Fog" },
  48: { icon: "🌫️", text: "Freezing fog" },
  51: { icon: "🌦️", text: "Light drizzle" },
  53: { icon: "🌦️", text: "Drizzle" },
  55: { icon: "🌧️", text: "Heavy drizzle" },
  61: { icon: "🌧️", text: "Light rain" },
  63: { icon: "🌧️", text: "Rain" },
  65: { icon: "🌧️", text: "Heavy rain" },
  71: { icon: "🌨️", text: "Light snow" },
  73: { icon: "❄️", text: "Snow" },
  75: { icon: "❄️", text: "Heavy snow" },
  80: { icon: "🌦️", text: "Rain showers" },
  81: { icon: "🌧️", text: "Heavy showers" },
  82: { icon: "⛈️", text: "Violent showers" },
  95: { icon: "⛈️", text: "Thunderstorm" },
  96: { icon: "⛈️", text: "Thunderstorm with hail" },
  99: { icon: "⛈️", text: "Severe thunderstorm" },
};
// ----- Favorite cities -----
let currentPlace = null; // the city currently shown on screen

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem("favorites")) || [];
  } catch (error) {
    return [];
  }
}

function saveFavorites(list) {
  try {
    localStorage.setItem("favorites", JSON.stringify(list));
  } catch (error) {
    console.error(error);
  }
}

function isFavorite(place) {
  return loadFavorites().some((f) => f.name === place.name);
}

// Show ★ or ☆ depending on whether the current city is saved
function updateStar() {
  const button = document.getElementById("fav-btn");
  const saved = currentPlace && isFavorite(currentPlace);
  button.textContent = saved ? "★" : "☆";
  button.classList.toggle("on", Boolean(saved));
}

function toggleFavorite() {
  if (!currentPlace) return;
  let list = loadFavorites();

  if (isFavorite(currentPlace)) {
    list = list.filter((f) => f.name !== currentPlace.name);
  } else {
    list.push(currentPlace);
  }

  saveFavorites(list);
  updateStar();
  renderFavorites();
}

// Get a small weather summary for one favorite
async function getMiniWeather(place) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${place.latitude}&longitude=${place.longitude}` +
        `&current=temperature_2m,weather_code,is_day` +
        `&daily=precipitation_probability_max&timezone=auto&forecast_days=1${units.param()}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return {
      temp: Math.round(data.current.temperature_2m),
           icon: weatherIcon(data.current.weather_code, data.current.is_day),
      rain: data.daily.precipitation_probability_max[0],
    };
  } catch (error) {
    return null;
  }
}

// Draw all favorite cards
async function renderFavorites() {
  const container = document.getElementById("favorites");
  const list = loadFavorites();

  if (list.length === 0) {
    container.innerHTML = `<p class="placeholder small">Tap ☆ next to a city to save it here.</p>`;
    return;
  }

  // Fetch all cities at the same time
  const results = await Promise.all(list.map(getMiniWeather));

  container.innerHTML = "";
  list.forEach((place, i) => {
    const w = results[i];
    container.innerHTML += `
      <div class="fav-card" data-index="${i}">
        <div>
          <span class="fav-name">${place.name}</span>
          <span class="fav-rain">${w ? `💧 ${w.rain}%` : "Unavailable"}</span>
        </div>
        <div class="fav-info">
          <span class="emoji">${w ? w.icon : "—"}</span>
          <span class="fav-temp">${w ? w.temp + "°" : ""}</span>
        </div>
        <button class="fav-remove" data-index="${i}" aria-label="Remove">✕</button>
      </div>`;
  });
}

// Star button
document.getElementById("fav-btn").addEventListener("click", toggleFavorite);

// Clicks inside the favorites list: remove a city, or open it
document.getElementById("favorites").addEventListener("click", (event) => {
  const list = loadFavorites();

  const removeButton = event.target.closest(".fav-remove");
  if (removeButton) {
    list.splice(Number(removeButton.dataset.index), 1);
    saveFavorites(list);
    renderFavorites();
    updateStar();
    return;
  }

  const card = event.target.closest(".fav-card");
  if (card) {
    const place = list[Number(card.dataset.index)];
    getWeather(place.name, place.latitude, place.longitude);
    window.scrollTo(0, 0);
  }
});
// Load the weather for a given place
// Small helper: weather code -> icon
function getIcon(code) {
  return weatherIcon(code, 1);
}

// Build one row of an hour list (tap it to open that hour's page)
function hourRowHTML(label, icon, rain, temp, isNow, index, feels) {
  return `
    <button class="hour-row ${isNow ? "now" : ""}" data-i="${index}">
      <span class="row-time">${label}</span>
      <span class="emoji">${icon}</span>
      <span class="row-rain">💧 ${rain}%</span>
      <span class="row-temp">
        ${temp}°
        <span class="row-feels">feels ${feels}°</span>
      </span>
      <span class="chev">›</span>
    </button>`;
}
// Fill a list with hours from index "from" up to (not including) "to"
function fillHourList(containerId, data, from, to, nowIndex, withDay) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  for (let i = from; i < to; i++) {
    const time = data.hourly.time[i];
    let label = time.slice(11, 16); // "18:00"

    if (withDay) {
      const day = new Date(time).toLocaleDateString("en-GB", { weekday: "short" });
      label = `${day} ${label}`;
    }
    if (i === nowIndex) label = "Now";

    container.innerHTML += hourRowHTML(
      label,
            weatherIcon(data.hourly.weather_code[i], data.hourly.is_day[i]),
      data.hourly.precipitation_probability[i],
      Math.round(data.hourly.temperature_2m[i]),
      i === nowIndex,
      i,
       Math.round(data.hourly.apparent_temperature[i])
    );
  }
}

// Fill the 14-day forecast
function showDaily(data) {
  const container = document.getElementById("daily");
  container.innerHTML = "";

  data.daily.time.forEach((date, i) => {
    const name = i === 0
      ? "Today"
      : new Date(date + "T12:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
    const icon = getIcon(data.daily.weather_code[i]);
    const rain = data.daily.precipitation_probability_max[i];
    const max = Math.round(data.daily.temperature_2m_max[i]);
    const min = Math.round(data.daily.temperature_2m_min[i]);

    container.innerHTML += `
      <div class="day">
        <span class="day-name">${name}</span>
        <span class="emoji">${icon}</span>
        <span class="rain-chance">💧 ${rain}%</span>
        <span class="range">${max}° <span class="low">${min}°</span></span>
      </div>`;
  });
}
// Bars showing the chance of rain for the next 12 hours
function showRainBars(data, nowIndex) {
  const container = document.getElementById("rain-bars");
  container.innerHTML = "";

  for (let i = nowIndex; i < nowIndex + 12; i++) {
    const chance = data.hourly.precipitation_probability[i];
    const label = i === nowIndex ? "Now" : data.hourly.time[i].slice(11, 13);

    container.innerHTML += `
      <div class="rain-col">
        <span>${chance}%</span>
        <div class="bar-track">
          <div class="rain-bar" style="height:${Math.max(chance, 3)}%"></div>
        </div>
        <span class="rain-hour">${label}</span>
      </div>`;
  }
}
// Load the weather for a given place
async function getWeather(city, latitude, longitude) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day` +
                 `&hourly=temperature_2m,weather_code,precipitation_probability,wind_gusts_10m,uv_index,pressure_msl,visibility,dew_point_2m,cloud_cover,wind_direction_10m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,is_day` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset,daylight_duration,uv_index_max` +
       `&timezone=auto&forecast_days=14${units.param()}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const current = data.current;
    latestWeather = data;
        currentPlace = { name: city, latitude, longitude };
    updateStar();

    // Where is "now" inside the hourly lists?
    const nowIndex = data.hourly.time.findIndex((t) => t.startsWith(current.time.slice(0, 13)));
    const todayDate = current.time.slice(0, 10);
    const todayStart = data.hourly.time.findIndex((t) => t.startsWith(todayDate));

    const weather = weatherCodes[current.weather_code] || { icon: "🌡️", text: "Unknown" };

    // Home page
    document.getElementById("city").textContent = city;
            document.getElementById("icon").innerHTML = iconFor(current.weather_code, current.is_day);
    document.getElementById("temp").textContent = Math.round(current.temperature_2m) + "°";
    document.getElementById("condition").textContent = weather.text;
    document.getElementById("rain").textContent =
      `💧 ${data.hourly.precipitation_probability[nowIndex]}% chance of rain`;
    document.getElementById("feels").textContent = Math.round(current.apparent_temperature) + "°";
    document.getElementById("humidity").textContent = current.relative_humidity_2m + "%";
        document.getElementById("wind").textContent = Math.round(current.wind_speed_10m) + " " + units.windUnit();

    // Other pages
    fillHourList("today-list", data, todayStart, todayStart + 24, nowIndex, false);
    fillHourList("list-48h", data, nowIndex, nowIndex + 48, nowIndex, true);
        drawTempChart("chart-today", data, todayStart, todayStart + 24, nowIndex);
    drawTempChart("chart-48h", data, nowIndex, nowIndex + 48, nowIndex);
    showDaily(data);
        showRainBars(data, nowIndex);
            showAlerts(data, nowIndex, latitude, longitude);
            showDetails(data, nowIndex);
                showAir(latitude, longitude);
                    showRainCountdown(latitude, longitude, current.time);
                        markUpdated();
    saveLastPlace(currentPlace);
                applyWeatherTheme(current.weather_code, current.is_day);
  } catch (error) {
    document.getElementById("condition").textContent = "Could not load weather";
    console.error(error);
        markUpdateFailed();
  }
}

// Turn a city name into coordinates, then load its weather
async function searchCity(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.results) {
      document.getElementById("condition").textContent = "City not found";
      return;
    }

    const place = data.results[0];
    getWeather(`${place.name}, ${place.country_code}`, place.latitude, place.longitude);
  } catch (error) {
    document.getElementById("condition").textContent = "Search failed";
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
    suggestionsList.innerHTML = `<li class="empty">No cities found</li>`;
  } else {
    suggestionsList.innerHTML = results
      .map((place, i) => {
        // e.g. "Ontario, Canada" (skip empty parts)
        const sub = [place.admin1, place.country].filter(Boolean).join(", ");
        return `<li data-index="${i}">${place.name}<span class="sub">${sub}</span></li>`;
      })
      .join("");
  }
  suggestionsList.classList.add("open");
}

async function fetchSuggestions(text) {
  const myId = ++searchCounter; // remember which search this is
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(text)}&count=5`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // If you kept typing, a newer search exists: ignore this old answer
    if (myId !== searchCounter) return;

    showSuggestions(data.results || []);
  } catch (error) {
    console.error(error);
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
  getWeather(`${place.name}, ${place.country_code}`, place.latitude, place.longitude);

  searchInput.value = "";
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
document.getElementById("search-form").addEventListener("submit", function (event) {
  event.preventDefault();
  clearTimeout(searchTimer);
  searchCounter++;
  hideSuggestions();

  const input = document.getElementById("search-input");
  searchCity(input.value.trim());
  input.value = "";
});

// Show today's date
const today = new Date().toLocaleDateString("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
document.getElementById("date").textContent = today;

// Start with the last city you looked at (Galați the first time)
const startPlace = loadLastPlace() || DEFAULT_PLACE;
getWeather(startPlace.name, startPlace.latitude, startPlace.longitude);
renderFavorites();
