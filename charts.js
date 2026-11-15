// ----- Temperature chart (SVG): real temperature + dashed feels-like line -----
const chartArgs = {}; // last drawing of each chart, so it can be redrawn at a new width

function drawTempChart(containerId, data, from, to, nowIndex) {
  const box = document.getElementById(containerId);
  chartArgs[containerId] = [data, from, to, nowIndex];
  to = Math.min(to, data.hourly.time.length);
  const temps = data.hourly.temperature_2m.slice(from, to);
  const feels = data.hourly.apparent_temperature.slice(from, to);
  const times = data.hourly.time.slice(from, to);
  const n = temps.length;
  if (n < 2) return;

  // Draw at the real width (so text keeps its size on big screens). Hidden charts use 360 until shown.
  const W = box.clientWidth > 0 ? Math.max(300, box.clientWidth - 12) : 360;
  const H = 170;
  box.dataset.drawnWidth = W;
  const padX = 22, padTop = 30, padBottom = 28;

  // The scale must fit BOTH lines, or one could run off the chart
  const min = Math.min(...temps, ...feels);
  const max = Math.max(...temps, ...feels);
  const range = max - min || 1;

  const x = (k) => padX + (k / (n - 1)) * (W - 2 * padX);
  const y = (t) => padTop + (1 - (t - min) / range) * (H - padTop - padBottom);

  const pathFor = (values) =>
    "M" + values.map((t, k) => `${x(k).toFixed(1)},${y(t).toFixed(1)}`).join(" L");

  const line = pathFor(temps);
  const feelsLine = pathFor(feels);
  const area = `${line} L${x(n - 1).toFixed(1)},${H - padBottom} L${x(0).toFixed(1)},${H - padBottom} Z`;

  // Time labels every 6 hours
  let ticks = "";
  times.forEach((time, k) => {
    if (Number(time.slice(11, 13)) % 6 === 0) {
      ticks += `<text class="chart-label" x="${x(k).toFixed(1)}" y="${H - 8}" text-anchor="middle">${fmtTime(time)}</text>`;
    }
  });

  // Highest and lowest real temperature
  const tMin = Math.min(...temps);
  const tMax = Math.max(...temps);
  const kMin = temps.indexOf(tMin);
  const kMax = temps.indexOf(tMax);
  const mark = (k, above) => `
    <circle class="chart-dot" cx="${x(k).toFixed(1)}" cy="${y(temps[k]).toFixed(1)}" r="3.5"/>
    <text class="chart-value" x="${x(k).toFixed(1)}" y="${(y(temps[k]) + (above ? -9 : 17)).toFixed(1)}" text-anchor="middle">${Math.round(temps[k])}°</text>`;
  // The peak's label goes below its dot when it would bump into the "Now" label at the top
  const kNowCheck = nowIndex - from;
  const peakNearNow = kNowCheck >= 0 && kNowCheck < n && Math.abs(x(kMax) - x(kNowCheck)) < 70 && y(temps[kMax]) < padTop + 20;
  let extremes = mark(kMax, !peakNearNow);
  if (kMin !== kMax) extremes += mark(kMin, false);

  // "Now" marker with both values
  let now = "";
  const kNow = nowIndex - from;
  if (kNow >= 0 && kNow < n) {
    const xNow = x(kNow);
    // Keep the label inside the chart when "now" is near an edge
    const anchor = xNow < 70 ? "start" : xNow > W - 70 ? "end" : "middle";
    const labelX = anchor === "start" ? xNow - 4 : anchor === "end" ? xNow + 4 : xNow;

    now = `
      <line class="chart-now" x1="${xNow.toFixed(1)}" y1="${padTop - 12}" x2="${xNow.toFixed(1)}" y2="${H - padBottom}"/>
      <circle class="chart-feels-dot" cx="${xNow.toFixed(1)}" cy="${y(feels[kNow]).toFixed(1)}" r="3.5"/>
      <circle class="chart-dot" cx="${xNow.toFixed(1)}" cy="${y(temps[kNow]).toFixed(1)}" r="4.5"/>
      <text class="chart-label" x="${labelX.toFixed(1)}" y="${padTop - 16}" text-anchor="${anchor}">${t("chartNow", { t: Math.round(temps[kNow]), f: Math.round(feels[kNow]) })}</text>`;
  }

  const gradient = "grad-" + containerId;
  box.innerHTML = `
    <svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t("chartAria")}">
      <defs>
        <linearGradient id="${gradient}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity="0.35"/>
          <stop offset="1" stop-color="#fff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="${area}" fill="url(#${gradient})"/>
      <path class="chart-feels" d="${feelsLine}"/>
      <path d="${line}" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${now}
      ${extremes}
      ${ticks}
    </svg>
    <div class="chart-legend">
      <span><i class="lg lg-solid"></i>${t("temperature")}</span>
      <span><i class="lg lg-dash"></i>${t("feelsLike")}</span>
    </div>`;
}

// Redraw charts that became visible or changed size (opening a tab, rotating the phone, resizing the window)
function redrawVisibleCharts() {
  for (const [id, args] of Object.entries(chartArgs)) {
    const box = document.getElementById(id);
    if (box.clientWidth > 0 && Number(box.dataset.drawnWidth) !== Math.max(300, box.clientWidth - 12)) {
      drawTempChart(id, ...args);
    }
  }
}

document.addEventListener("pagechange", () => requestAnimationFrame(redrawVisibleCharts));
let chartResizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(chartResizeTimer);
  chartResizeTimer = setTimeout(redrawVisibleCharts, 150);
});
