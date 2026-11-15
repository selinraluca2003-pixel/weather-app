// ----- Favorite cities -----
let currentPlace = null; // the city currently shown on screen
let favWeather = {};     // last known weather per favorite, so cards can redraw instantly
let favCounter = 0;

// Two places are "the same" when their coordinates match (names can differ by language)
function favKey(place) {
  return `${Number(place.latitude).toFixed(2)},${Number(place.longitude).toFixed(2)}`;
}

function loadFavorites() {
  const list = store.get("favorites", []);
  return Array.isArray(list) ? list : [];
}

function saveFavorites(list) {
  store.set("favorites", list);
}

function isFavorite(place) {
  return loadFavorites().some((f) => favKey(f) === favKey(place));
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
  if (isFavorite(currentPlace)) list = list.filter((f) => favKey(f) !== favKey(currentPlace));
  else list.push(currentPlace);
  saveFavorites(list);
  updateStar();
  renderFavorites();
}

// One request for ALL favorites: Open-Meteo accepts several coordinates separated by commas
async function fetchFavoriteWeather(list) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${list.map((p) => p.latitude).join(",")}&longitude=${list.map((p) => p.longitude).join(",")}` +
    `&current=temperature_2m,weather_code,is_day` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&timezone=auto&forecast_days=1${units.param()}`;
  const data = await fetchJSON(url);
  const answers = Array.isArray(data) ? data : [data]; // one city gives one object, several give a list

  answers.forEach((d, i) => {
    favWeather[favKey(list[i])] = {
      temp: Math.round(d.current.temperature_2m),
      icon: weatherIcon(d.current.weather_code, d.current.is_day),
      rain: d.daily.precipitation_probability_max[0],
      max: Math.round(d.daily.temperature_2m_max[0]),
      min: Math.round(d.daily.temperature_2m_min[0]),
    };
  });
}

const gripIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>`;

// Draw the cards from what we already know (no internet needed)
function renderFavoriteCards() {
  const container = document.getElementById("favorites");
  const list = loadFavorites();

  if (list.length === 0) {
    container.innerHTML = `<p class="placeholder small">${t("tapStar")}</p>`;
    return;
  }

  container.innerHTML = list
    .map((place, i) => {
      const w = favWeather[favKey(place)];
      const name = escapeHTML(place.name);
      return `
        <div class="fav-card" data-index="${i}">
          <button class="fav-handle" data-index="${i}" aria-label="${escapeHTML(t("moveCity", { city: place.name }))}">${gripIcon}</button>
          <div class="fav-main">
            <span class="fav-name">${name}</span>
            <span class="fav-rain">${w ? `💧 ${w.rain}%` : `<span class="skel skel-small"></span>`}</span>
          </div>
          <div class="fav-info">
            <span class="emoji">${w ? w.icon : ""}</span>
            <div class="fav-temps">
              <span class="fav-temp">${w ? w.temp + "°" : `<span class="skel skel-small"></span>`}</span>
              <span class="fav-hilo">${w ? t("highLow", { max: w.max, min: w.min }) : ""}</span>
            </div>
          </div>
          <button class="fav-remove" data-index="${i}" aria-label="${escapeHTML(t("removeCity", { city: place.name }))}">✕</button>
        </div>`;
    })
    .join("");
}

// Draw the cards, then fetch fresh weather and draw them again
async function renderFavorites() {
  const myId = ++favCounter;
  renderFavoriteCards();
  const list = loadFavorites();
  if (list.length === 0) return;

  try {
    await fetchFavoriteWeather(list);
  } catch (error) {
    console.warn("Favorites weather unavailable:", error.message);
  }
  if (myId === favCounter && !drag) renderFavoriteCards();
}

// Move a favorite from one position to another and save
function moveFavorite(from, to) {
  const list = loadFavorites();
  if (to < 0 || to >= list.length || from === to) return false;
  const [place] = list.splice(from, 1);
  list.splice(to, 0, place);
  saveFavorites(list);
  return true;
}

// ---- Clicks: star, remove a city, open a city ----
document.getElementById("fav-btn").addEventListener("click", toggleFavorite);

document.getElementById("favorites").addEventListener("click", (event) => {
  if (event.target.closest(".fav-handle")) return; // the handle is only for dragging

  const removeButton = event.target.closest(".fav-remove");
  if (removeButton) {
    const list = loadFavorites();
    list.splice(Number(removeButton.dataset.index), 1);
    saveFavorites(list);
    renderFavoriteCards();
    updateStar();
    return;
  }

  const card = event.target.closest(".fav-card");
  if (card) {
    const place = loadFavorites()[Number(card.dataset.index)];
    if (place) {
      getWeather(place.name, place.latitude, place.longitude);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
});

// ---- Reordering: drag the ⋮⋮ handle (mouse or finger) ----
let drag = null;
const favContainer = document.getElementById("favorites");

favContainer.addEventListener("pointerdown", (event) => {
  const handle = event.target.closest(".fav-handle");
  if (!handle || event.button > 0) return;
  event.preventDefault();
  const card = handle.closest(".fav-card");
  drag = { card, startY: event.clientY, from: Number(card.dataset.index) };
  card.classList.add("dragging");
  handle.setPointerCapture(event.pointerId);
});

favContainer.addEventListener("pointermove", (event) => {
  if (!drag) return;
  const card = drag.card;
  const gap = 10; // the margin between cards
  let dy = event.clientY - drag.startY;

  // Swap with the neighbor once we've passed half of it
  let next = card.nextElementSibling;
  while (next && dy > next.offsetHeight / 2) {
    next.after(card);
    drag.startY += next.offsetHeight + gap;
    dy = event.clientY - drag.startY;
    next = card.nextElementSibling;
  }
  let prev = card.previousElementSibling;
  while (prev && dy < -prev.offsetHeight / 2) {
    prev.before(card);
    drag.startY -= prev.offsetHeight + gap;
    dy = event.clientY - drag.startY;
    prev = card.previousElementSibling;
  }
  card.style.transform = `translateY(${dy}px)`;
});

function endDrag() {
  if (!drag) return;
  const card = drag.card;
  const to = [...favContainer.children].indexOf(card);
  const from = drag.from;
  card.style.transform = "";
  card.classList.remove("dragging");
  drag = null;
  moveFavorite(from, to);
  renderFavoriteCards();
}
favContainer.addEventListener("pointerup", endDrag);
favContainer.addEventListener("pointercancel", endDrag);

// Keyboard: focus the handle and press ↑ or ↓
favContainer.addEventListener("keydown", (event) => {
  const handle = event.target.closest(".fav-handle");
  if (!handle || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
  event.preventDefault();
  const from = Number(handle.dataset.index);
  const to = from + (event.key === "ArrowUp" ? -1 : 1);
  if (moveFavorite(from, to)) {
    renderFavoriteCards();
    favContainer.querySelector(`.fav-handle[data-index="${to}"]`).focus();
  }
});
