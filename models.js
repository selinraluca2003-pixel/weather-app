// ----- Compare three forecast models (like Windy) -----
const MODELS = [
  { id: "ecmwf_ifs025", name: "ECMWF", color: "#ffd54a" }, // European centre
  { id: "gfs_seamless", name: "GFS", color: "#6ec6ff" },   // USA
  { id: "icon_seamless", name: "ICON", color: "#ff8a80" }, // Germany
];
let modelsCounter = 0;
let modelsResult = null; // { key, savedAt, days, models: [...] }

// Read one model's lists from an answer. With several models, names get a suffix: temperature_2m_max_gfs_seamless
function readModel(daily, model, single) {
  const pick = (name) => daily[`${name}_${model.id}`] || (single ? daily[name] : null);
  const max = pick("temperature_2m_max");
  if (!max || max.every((v) => v === null)) return null; // this model sent nothing usable
  return { ...model, max, min: pick("temperature_2m_min") || [], rain: pick("precipitation_sum") || [] };
}

async function fetchModels(place) {
  const base =
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7${units.param()}`;
  try {
    const data = await fetchJSON(`${base}&models=${MODELS.map((m) => m.id).join(",")}`);
    const models = MODELS.map((m) => readModel(data.daily, m, false)).filter(Boolean);
    if (models.length >= 2) return { days: data.daily.time, models };
  } catch (error) {
    console.warn("Models together failed, trying one by one:", error.message);
  }
  // Fallback: ask for each model separately and keep the ones that answer
  const answers = await Promise.all(
    MODELS.map((m) => fetchJSON(`${base}&models=${m.id}`).then((d) => ({ d, m })).catch(() => null))
  );
  const ok = answers.filter(Boolean);
  const models = ok.map(({ d, m }) => readModel(d.daily, m, true)).filter(Boolean);
  if (models.length < 2) throw new Error("not enough models");
  return { days: ok[0].d.daily.time, models };
}

// How much do the models agree on day d? Spread of the highs in °C, plus rain yes/no disagreement
function agreementOn(result, d) {
  const highs = result.models.map((m) => m.max[d]).filter((v) => v !== null && v !== undefined);
  if (highs.length < 2) return null;
  const spread = units.toCelsius(Math.max(...highs)) - units.toCelsius(Math.min(...highs));
  let level = spread <= 2 ? 2 : spread <= 4 ? 1 : 0;
  const rains = result.models.map((m) => m.rain[d] || 0);
  if (Math.max(...rains) >= 5 && Math.min(...rains) < 1) level = Math.max(0, level - 1); // one says rain, one says dry
  return [{ key: "agreeLow", cls: "poor" }, { key: "agreeMedium", cls: "fair" }, { key: "agreeHigh", cls: "great" }][level];
}

function drawModelsChart(box, result) {
  const W = box.clientWidth > 0 ? Math.max(300, box.clientWidth - 12) : 360;
  const H = 170, padX = 26, padTop = 18, padBottom = 28;
  const n = result.days.length;
  const all = result.models.flatMap((m) => m.max).filter((v) => v !== null);
  const min = Math.min(...all) - 1, max = Math.max(...all) + 1;
  const x = (k) => padX + (k / (n - 1)) * (W - 2 * padX);
  const y = (v) => padTop + (1 - (v - min) / (max - min)) * (H - padTop - padBottom);

  let body = "";
  for (const m of result.models) {
    let d = "";
    m.max.forEach((v, k) => {
      if (v === null) return;
      d += `${d ? " L" : "M"}${x(k).toFixed(1)},${y(v).toFixed(1)}`;
    });
    body += `<path d="${d}" fill="none" stroke="${m.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    m.max.forEach((v, k) => {
      if (v !== null) body += `<circle cx="${x(k).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3" fill="${m.color}"/>`;
    });
  }
  result.days.forEach((date, k) => {
    body += `<text class="chart-label" x="${x(k).toFixed(1)}" y="${H - 8}" text-anchor="middle">${fmtWeekday(date)}</text>`;
  });
  body += `<text class="chart-label" x="2" y="${padTop + 4}">${Math.round(max)}°</text>`;
  body += `<text class="chart-label" x="2" y="${H - padBottom}">${Math.round(min)}°</text>`;

  const legend = result.models.map((m) => `<span><i class="lg" style="border-color:${m.color}"></i>${m.name}</span>`).join("");
  box.innerHTML = `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t("modelsHighs")}">${body}</svg>
    <div class="chart-legend">${legend}</div>`;
}

function renderModels() {
  const result = modelsResult;
  const box = document.getElementById("models-body");
  if (!result) return;

  // Summary: until which day do they agree well?
  const levels = result.days.map((_, d) => agreementOn(result, d));
  const firstUnsure = levels.findIndex((l) => l && l.key !== "agreeHigh");
  let summary;
  if (firstUnsure === -1) summary = t("modelsAll");
  else if (firstUnsure <= 1) summary = t("modelsNone");
  else summary = t("modelsUntil", { day: fmtWeekday(result.days[firstUnsure], "long") });

  const head = result.models.map((m) => `<span style="color:${m.color}">${m.name}</span>`).join("");
  const rows = result.days
    .map((date, d) => {
      const name = d === 0 ? t("today") : capitalize(fmtWeekday(date));
      const cells = result.models
        .map((m) => `<span>${m.max[d] === null ? "–" : Math.round(m.max[d]) + "°"}<small>${m.min[d] == null ? "" : Math.round(m.min[d]) + "°"}</small></span>`)
        .join("");
      const level = levels[d];
      return `<div class="model-row"><span class="model-day">${name}</span>${cells}<span class="act-rating ${level ? level.cls : ""}">${level ? t(level.key) : "–"}</span></div>`;
    })
    .join("");

  box.innerHTML = `
    <p class="models-summary">${summary}</p>
    <h2 class="section-title">${t("modelsHighs")}</h2>
    <div class="temp-chart" id="chart-models"></div>
    <div class="model-table">
      <div class="model-row model-head"><span></span>${head}<span>${t("agreement")}</span></div>
      ${rows}
    </div>`;
  drawModelsChart(document.getElementById("chart-models"), result);
}

async function openModelsPage() {
  if (!currentPlace) return;
  openSubPage("page-models");
  const key = `${favKey(currentPlace)}|${units.system}`;
  if (modelsResult && modelsResult.key === key && Date.now() - modelsResult.savedAt < 3600000) {
    renderModels();
    return;
  }
  const myId = ++modelsCounter;
  const place = currentPlace;
  document.getElementById("models-body").innerHTML = `<p class="placeholder small">${t("loading")}</p>`;
  try {
    const result = await fetchModels(place);
    if (myId !== modelsCounter) return;
    modelsResult = { key, savedAt: Date.now(), ...result };
    renderModels();
  } catch (error) {
    if (myId !== modelsCounter) return;
    console.warn("Models unavailable:", error.message);
    document.getElementById("models-body").innerHTML = `<p class="placeholder small">${t("modelsUnavailable")}</p>`;
  }
}

document.getElementById("models-btn").addEventListener("click", openModelsPage);
