// ----- Rain countdown (next 2 hours, in 15-minute steps) -----
// The 15-minute rain values now come with the main weather request, so this needs no extra download.
const RAIN_THRESHOLD = 0.1; // mm per 15 minutes that counts as "rain"

function showRainCountdown(data, nowTime) {
  const box = document.getElementById("nowcast");
  const m = data.minutely_15;
  if (!m || !m.time) {
    box.innerHTML = "";
    return;
  }

  // The 15-minute slot we're in right now (local ISO times compare correctly as text)
  let start = m.time.findIndex((time) => time > nowTime);
  start = start === -1 ? -1 : Math.max(0, start - 1);
  const slots = start === -1 ? [] : m.precipitation.slice(start, start + 8).map((v) => v || 0); // 8 x 15 min = 2 hours
  if (slots.length < 4) {
    box.innerHTML = ""; // not enough data (for example very old saved data)
    return;
  }
  const total = slots.reduce((sum, v) => sum + v, 0);

  let icon, message;
  if (slots[0] >= RAIN_THRESHOLD) {
    const stops = slots.findIndex((v) => v < RAIN_THRESHOLD);
    icon = "🌧️";
    message = stops === -1 ? t("rainForHours") : t("rainEasing", { m: stops * 15 });
  } else {
    const first = slots.findIndex((v) => v >= RAIN_THRESHOLD);
    if (first === -1) {
      icon = "✅";
      message = t("noRain2h");
    } else {
      icon = "🌦️";
      message = t("rainStarting", { m: first * 15 });
    }
  }

  // Little bars: one per 15 minutes
  const tallest = Math.max(1, ...slots);
  const bars = slots
    .map((v) => {
      const height = v >= RAIN_THRESHOLD ? Math.max(15, (v / tallest) * 100) : 8;
      return `<span class="nc-bar ${v >= RAIN_THRESHOLD ? "" : "dry"}" style="height:${height}%"></span>`;
    })
    .join("");

  box.innerHTML = `
    <div class="nc">
      <span class="nc-icon">${icon}</span>
      <div class="nc-text">
        <strong>${message}</strong>
        <small>${t("rainSub", { mm: total.toFixed(1) })}</small>
      </div>
      <div class="nc-bars" aria-hidden="true">${bars}</div>
    </div>`;
}
