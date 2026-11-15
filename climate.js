// ----- "Normal for today" and records for this date -----
// Uses Open-Meteo's history (ERA5 reanalysis, every day since 1940). That's a big download,
// so it happens at most once a week per city, and only the small results are saved.
let climateCounter = 0;
const CLIMATE_DAYS = 21;                    // work out normals for today + 20 days (covers the 14-day list for a week)
const CLIMATE_MAX_AGE = 7 * 24 * 3600 * 1000; // one week

function climateKey(place) {
  return `climate:${favKey(place)}:${units.isImperial() ? "F" : "C"}`;
}

// Turn ~31,000 days of history into normals and records for the coming days
function computeClimate(daily, firstDate) {
  // Group every year's values by calendar day: "11-15" -> [{ y: 1940, max, min }, ...]
  const byDay = {};
  daily.time.forEach((date, i) => {
    const md = date.slice(5);
    (byDay[md] = byDay[md] || []).push({ y: Number(date.slice(0, 4)), max: daily.temperature_2m_max[i], min: daily.temperature_2m_min[i] });
  });

  const shiftDate = (date, days) => {
    const d = new Date(date + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const result = {};
  for (let k = 0; k < CLIMATE_DAYS; k++) {
    const date = shiftDate(firstDate, k);
    const md = date.slice(5);

    // Normal = average of 1991–2020, using a week around the date to smooth out the bumps
    let sumMax = 0, sumMin = 0, count = 0;
    for (let w = -3; w <= 3; w++) {
      for (const e of byDay[shiftDate(date, w).slice(5)] || []) {
        if (e.y >= 1991 && e.y <= 2020 && e.max !== null && e.min !== null) {
          sumMax += e.max;
          sumMin += e.min;
          count++;
        }
      }
    }

    // Records = the most extreme values ever on exactly this calendar day
    let recordHigh = null, recordLow = null;
    for (const e of byDay[md] || []) {
      if (e.max !== null && (!recordHigh || e.max > recordHigh.t)) recordHigh = { t: e.max, y: e.y };
      if (e.min !== null && (!recordLow || e.min < recordLow.t)) recordLow = { t: e.min, y: e.y };
    }

    if (count) result[md] = { normalMax: sumMax / count, normalMin: sumMin / count, recordHigh, recordLow };
  }
  return result;
}

// Saved results for one calendar date ("2026-11-15"), or null
function climateFor(place, date) {
  const saved = store.get(climateKey(place));
  return (saved && saved.byDay && saved.byDay[date.slice(5)]) || null;
}

// "2° above normal" / "close to normal"
function normalDiffText(diff) {
  const n = Math.round(Math.abs(diff));
  if (n < 1) return t("nearNormal");
  return diff > 0 ? t("aboveNormal", { n }) : t("belowNormal", { n });
}

function renderClimate(place, data) {
  const box = document.getElementById("climate");
  const c = place && data ? climateFor(place, data.daily.time[0]) : null;
  if (!c) {
    box.innerHTML = "";
    return;
  }
  const max = Math.round(data.daily.temperature_2m_max[0]);
  const min = Math.round(data.daily.temperature_2m_min[0]);
  box.innerHTML =
    detailCard(
      t("normalTitle"),
      `${Math.round(c.normalMax)}° / ${Math.round(c.normalMin)}°`,
      t("forecastVsNormal", { max, min, diff: normalDiffText(data.daily.temperature_2m_max[0] - c.normalMax) })
    ) +
    detailCard(
      t("recordsTitle"),
      `<span class="record">↑ ${t("recordHigh", { t: Math.round(c.recordHigh.t), y: c.recordHigh.y })}</span>` +
        `<span class="record">↓ ${t("recordLow", { t: Math.round(c.recordLow.t), y: c.recordLow.y })}</span>`,
      t("climateSource"),
      true
    );
}

async function showClimate(place, data) {
  renderClimate(place, data);
  const saved = store.get(climateKey(place));
  const fresh = saved && Date.now() - saved.savedAt < CLIMATE_MAX_AGE && saved.byDay && saved.byDay[data.daily.time[0].slice(5)];
  if (fresh) return;

  const myId = ++climateCounter;
  // ERA5 runs about 5 days behind, so stop a week ago
  const end = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${place.latitude}&longitude=${place.longitude}` +
    `&start_date=1940-01-01&end_date=${end}&daily=temperature_2m_max,temperature_2m_min&timezone=auto` +
    (units.isImperial() ? "&temperature_unit=fahrenheit" : "");

  try {
    const history = await fetchJSON(url, { timeout: 30000, retries: 0 });
    store.set(climateKey(place), { savedAt: Date.now(), byDay: computeClimate(history.daily, data.daily.time[0]) });
    if (myId === climateCounter && currentPlace && favKey(currentPlace) === favKey(place)) {
      renderClimate(place, latestWeather);
      if (currentPageId() === "page-day") renderDayPage();
    }
  } catch (error) {
    console.warn("Climate history unavailable:", error.message);
  }
}
