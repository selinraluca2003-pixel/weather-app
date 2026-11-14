// ----- Rain countdown (next 2 hours, in 15-minute steps) -----
let nowcastCounter = 0;
const RAIN_THRESHOLD = 0.1; // mm per 15 minutes that counts as "rain"

async function showRainCountdown(latitude, longitude, nowTime) {
  const myId = ++nowcastCounter;
  const box = document.getElementById("nowcast");

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude}&longitude=${longitude}` +
    `&minutely_15=precipitation&forecast_days=2&timezone=auto`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (myId !== nowcastCounter) return; // a newer city was loaded meanwhile

    const times = data.minutely_15.time;
    const values = data.minutely_15.precipitation;

    // First 15-minute slot at or after "now" (local ISO times compare correctly as text)
    const start = times.findIndex((t) => t >= nowTime);
    if (start === -1) {
      box.innerHTML = "";
      return;
    }

    const slots = values.slice(start, start + 8).map((v) => v || 0); // 8 x 15 min = 2 hours
    const total = slots.reduce((sum, v) => sum + v, 0);

    let icon, message;
    if (slots[0] >= RAIN_THRESHOLD) {
      const stops = slots.findIndex((v) => v < RAIN_THRESHOLD);
      icon = "🌧️";
      message = stops === -1 ? "Rain for at least the next 2 hours" : `Raining now, easing in about ${stops * 15} min`;
    } else {
      const first = slots.findIndex((v) => v >= RAIN_THRESHOLD);
      if (first === -1) {
        icon = "✅";
        message = "No rain expected in the next 2 hours";
      } else {
        icon = "🌦️";
        message = `Rain starting in about ${first * 15} min`;
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
          <small>${total.toFixed(1)} mm expected in 2 h · 15-minute estimate</small>
        </div>
        <div class="nc-bars" aria-hidden="true">${bars}</div>
      </div>`;
  } catch (error) {
    if (myId !== nowcastCounter) return;
    box.innerHTML = "";
    console.error("Rain countdown failed:", error);
  }
}