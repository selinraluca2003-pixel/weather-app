// ----- Weather alerts -----
let alertCounter = 0;

const levelRank = { red: 3, orange: 2, yellow: 1 };

// "Sat 14:00"
function formatWhen(isoTime) {
  return `${fmtWeekday(isoTime)} ${fmtTime(isoTime)}`;
}

// Pick yellow / orange / red from a value and three thresholds
function pickLevel(value, yellow, orange, red) {
  if (value >= red) return "red";
  if (value >= orange) return "orange";
  if (value >= yellow) return "yellow";
  return null;
}

// ---- Layer 1: alerts we work out from the forecast ----
function forecastAlerts(data, nowIndex) {
  const alerts = [];
  const end = Math.min(nowIndex + 48, data.hourly.time.length);
  const source = t("forecastBased");

  // Wind: strongest gust in the next 48 hours
  let maxGust = 0;
  let gustTime = "";
  for (let i = nowIndex; i < end; i++) {
    const gust = units.toKmh(data.hourly.wind_gusts_10m[i]);
    if (gust > maxGust) {
      maxGust = gust;
      gustTime = data.hourly.time[i];
    }
  }
  const windLevel = pickLevel(maxGust, 60, 90, 120);
  if (windLevel) {
    alerts.push({
      level: windLevel,
      icon: "💨",
      title: t("strongGusts"),
      text: t("gustsText", { v: units.showWind(maxGust), when: formatWhen(gustTime) }),
      source,
    });
  }

  // Thunderstorms: first stormy hour in the next 48 hours
  for (let i = nowIndex; i < end; i++) {
    const code = data.hourly.weather_code[i];
    if (code >= 95) {
      alerts.push({
        level: code >= 96 ? "orange" : "yellow",
        icon: "⛈️",
        title: weatherText(code),
        text: t("stormText", { when: formatWhen(data.hourly.time[i]) }),
        source,
      });
      break;
    }
  }

  // Today and tomorrow: rain, heat, cold
  for (let d = 0; d < 2; d++) {
    const when = d === 0 ? t("todayLower") : t("tomorrowLower");

    const rain = data.daily.precipitation_sum[d];
    const rainLevel = pickLevel(rain, 30, 50, 80);
    if (rainLevel) {
      alerts.push({ level: rainLevel, icon: "🌧️", title: t("heavyRain"), text: t("rainText", { mm: Math.round(rain), when }), source });
    }

    const max = data.daily.temperature_2m_max[d];
    const heatLevel = pickLevel(units.toCelsius(max), 35, 38, 40);
    if (heatLevel) {
      alerts.push({ level: heatLevel, icon: "🥵", title: t("extremeHeat"), text: t("heatText", { t: Math.round(max), when }), source });
    }

    const min = data.daily.temperature_2m_min[d];
    const coldLevel = pickLevel(-units.toCelsius(min), 10, 15, 20);
    if (coldLevel) {
      alerts.push({ level: coldLevel, icon: "🥶", title: t("severeCold"), text: t("coldText", { t: Math.round(min), when }), source });
    }
  }

  return alerts;
}

// ---- Layer 2: official warnings (best effort) ----
function levelFromOfficial(p) {
  const text = `${p.awareness_level || ""} ${p.awarenessLevel || ""} ${p.color || ""} ${p.headline || ""}`;
  if (/\bred\b/i.test(text)) return "red";
  if (/\borange\b/i.test(text)) return "orange";
  if (/\byellow\b/i.test(text)) return "yellow";

  const severity = String(p.severity || "").toLowerCase();
  if (severity === "extreme") return "red";
  if (severity === "severe") return "orange";
  return "yellow";
}

async function fetchOfficialAlerts(latitude, longitude) {
  const data = await fetchJSON(`https://api.librewxr.net/v2/alerts?lat=${latitude}&lon=${longitude}`, { retries: 0 });
  const features = data.features || [];

  return features
    .map((feature) => feature.properties || {})
    .filter((p) => !p.expires || new Date(p.expires) > new Date())
    .map((p) => ({
      level: levelFromOfficial(p),
      icon: "⚠️",
      title: p.event || p.headline || p.title || t("weatherWarning"),
      text: String(p.headline || p.description || "").slice(0, 160),
      source: t("officialWarning") + (p.sender || p.senderName ? ` · ${p.sender || p.senderName}` : ""),
    }));
}

// ---- Showing the alerts ----
// officialStatus: null = not checked, true = checked, false = unavailable
function renderAlerts(list, officialStatus) {
  const box = document.getElementById("alerts");
  list.sort((a, b) => levelRank[b.level] - levelRank[a.level]);

  let html = "";
  if (list.length === 0) {
    html += `<div class="alert none"><span class="alert-icon">✅</span><strong>${t("noAlerts")}</strong></div>`;
  } else {
    html += list
      .map(
        (a) => `
        <div class="alert ${a.level}">
          <span class="alert-icon">${a.icon}</span>
          <div>
            <strong>${escapeHTML(a.title)}</strong>
            <p>${escapeHTML(a.text)}</p>
            <small>${escapeHTML(a.source)}</small>
          </div>
        </div>`
      )
      .join("");
  }

  const link = `<a href="https://www.meteoalarm.org" target="_blank" rel="noopener">meteoalarm.org</a>`;
  if (officialStatus === true) html += `<p class="alerts-note">${t("officialSource")} ${link}</p>`;
  else if (officialStatus === false) html += `<p class="alerts-note">${t("officialUnavailable")} ${link}</p>`;

  box.innerHTML = html;
}

// Called every time a city is shown. checkOfficial = false when showing saved (offline) data.
async function showAlerts(data, nowIndex, latitude, longitude, checkOfficial = true) {
  const myId = ++alertCounter;
  const local = forecastAlerts(data, nowIndex);

  renderAlerts([...local], null); // show our own alerts straight away
  if (!checkOfficial) return;

  try {
    const official = await fetchOfficialAlerts(latitude, longitude);
    if (myId !== alertCounter) return; // a newer city was loaded meanwhile
    renderAlerts([...official, ...local], true);
  } catch (error) {
    if (myId !== alertCounter) return;
    console.warn("Official alerts unavailable:", error.message);
    renderAlerts([...local], false);
  }
}
