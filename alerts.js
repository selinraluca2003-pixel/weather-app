// ----- Weather alerts -----
let alertCounter = 0;

const levelRank = { red: 3, orange: 2, yellow: 1 };

// Make text safe before putting it into the page
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// "Sat 14:00"
function formatWhen(isoTime) {
  const day = new Date(isoTime).toLocaleDateString("en-GB", { weekday: "short" });
  return `${day} ${isoTime.slice(11, 16)}`;
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
  const end = nowIndex + 48;
  const source = "Forecast-based, not an official warning";

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
      title: "Strong wind gusts",
      text: `Gusts up to ${units.showWind(maxGust)} expected around ${formatWhen(gustTime)}.`,
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
        title: code >= 96 ? "Thunderstorm with hail" : "Thunderstorm",
        text: `Possible from ${formatWhen(data.hourly.time[i])}.`,
        source,
      });
      break;
    }
  }

  // Today and tomorrow: rain, heat, cold
  for (let d = 0; d < 2; d++) {
    const when = d === 0 ? "today" : "tomorrow";

    const rain = data.daily.precipitation_sum[d];
    const rainLevel = pickLevel(rain, 30, 50, 80);
    if (rainLevel) {
      alerts.push({
        level: rainLevel,
        icon: "🌧️",
        title: "Heavy rain",
        text: `About ${Math.round(rain)} mm of rain expected ${when}.`,
        source,
      });
    }

    const max = data.daily.temperature_2m_max[d];
   const heatLevel = pickLevel(units.toCelsius(max), 35, 38, 40);
    if (heatLevel) {
      alerts.push({
        level: heatLevel,
        icon: "🥵",
        title: "Extreme heat",
        text: `High of ${Math.round(max)}° expected ${when}.`,
        source,
      });
    }

    const min = data.daily.temperature_2m_min[d];
    const coldLevel = pickLevel(-units.toCelsius(min), 10, 15, 20);
    if (coldLevel) {
      alerts.push({
        level: coldLevel,
        icon: "🥶",
        title: "Severe cold",
        text: `Low of ${Math.round(min)}° expected ${when}.`,
        source,
      });
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
  const url = `https://api.librewxr.net/v2/alerts?lat=${latitude}&lon=${longitude}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("HTTP " + response.status);

  const data = await response.json();
  const features = data.features || [];

  // Debug help: shows what the service really sends back
  if (features.length > 0) console.log("Official alert example:", features[0].properties);

  return features
    .map((feature) => feature.properties || {})
    .filter((p) => !p.expires || new Date(p.expires) > new Date())
    .map((p) => ({
      level: levelFromOfficial(p),
      icon: "⚠️",
      title: p.event || p.headline || p.title || "Weather warning",
      text: String(p.headline || p.description || "").slice(0, 160),
      source: "Official warning" + (p.sender || p.senderName ? ` · ${p.sender || p.senderName}` : ""),
    }));
}

// ---- Showing the alerts ----
// officialStatus: null = still checking, true = checked, false = unavailable
function renderAlerts(list, officialStatus) {
  const box = document.getElementById("alerts");

  list.sort((a, b) => levelRank[b.level] - levelRank[a.level]);

  let html = "";
  if (list.length === 0) {
    html += `<div class="alert none"><span class="alert-icon">✅</span><strong>No weather alerts</strong></div>`;
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

  if (officialStatus === true) {
    html += `<p class="alerts-note">Official warnings: WMO via LibreWXR · <a href="https://www.meteoalarm.org" target="_blank" rel="noopener">meteoalarm.org</a></p>`;
  } else if (officialStatus === false) {
    html += `<p class="alerts-note">Official warnings unavailable right now. Check <a href="https://www.meteoalarm.org" target="_blank" rel="noopener">meteoalarm.org</a></p>`;
  }

  box.innerHTML = html;
}

// Called by getWeather every time a city loads
async function showAlerts(data, nowIndex, latitude, longitude) {
  const myId = ++alertCounter;
  const local = forecastAlerts(data, nowIndex);

  renderAlerts([...local], null); // show our own alerts straight away

  try {
    const official = await fetchOfficialAlerts(latitude, longitude);
    if (myId !== alertCounter) return; // a newer city was loaded meanwhile
    renderAlerts([...official, ...local], true);
  } catch (error) {
    if (myId !== alertCounter) return;
    console.error("Official alerts failed:", error);
    renderAlerts([...local], false);
  }
}