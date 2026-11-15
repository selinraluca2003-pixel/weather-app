// ----- Tap a detail (UV, wind, humidity...) to see its next 48 hours -----
const METRICS = {
  uv:         { title: "uvIndex",     key: "uv_index",                fmt: (v) => v.toFixed(1), ex: "exUV", zero: true },
  pressure:   { title: "pressure",    key: "pressure_msl",            fmt: (v) => `${Math.round(v)} hPa`, ex: "exPressure" },
  visibility: { title: "visibility",  key: "visibility",              fmt: (v) => units.visibility(v), ex: "exVisibility", zero: true,
                scale: (v) => (units.isImperial() ? v / 1609 : v / 1000) },
  dew:        { title: "dewPoint",    key: "dew_point_2m",            fmt: (v) => `${Math.round(v)}°`, ex: "exDew" },
  clouds:     { title: "cloudCover",  key: "cloud_cover",             fmt: (v) => `${Math.round(v)}%`, ex: "exClouds", zero: true, top: 100 },
  humidity:   { title: "humidity",    key: "relative_humidity_2m",    fmt: (v) => `${Math.round(v)}%`, ex: "exHumidity", zero: true, top: 100 },
  wind:       { title: "wind",        key: "wind_speed_10m", second: "wind_gusts_10m", fmt: (v) => `${Math.round(v)} ${units.windUnit()}`,
                ex: "exWind", zero: true, legend: ["metricSpeed", "metricGusts"] },
  feels:      { title: "feelsLike",   key: "apparent_temperature", second: "temperature_2m", fmt: (v) => `${Math.round(v)}°`,
                ex: "exFeels", legend: ["feelsLike", "temperature"] },
  rain:       { title: "rainChance",  key: "precipitation_probability", second: "precipitation", bars: true, fmt: (v) => `${v}%`,
                ex: "exRain", zero: true, top: 100, legend: ["metricChance", "metricAmount"] },
};

const metricPage = { name: "uv" };

// A line (or bar) chart of one value, with an optional dashed second line
function drawMetricChart(box, data, from, to, nowIndex, metric) {
  const h = data.hourly;
  const scale = metric.scale || ((v) => v);
  const values = h[metric.key].slice(from, to).map(scale);
  const second = metric.second ? h[metric.second].slice(from, to) : null;
  const times = h.time.slice(from, to);
  const n = values.length;
  const W = box.clientWidth > 0 ? Math.max(300, box.clientWidth - 12) : 360;
  const H = 180, padX = 26, padTop = 22, padBottom = 28;

  // Bars + amount use separate scales; lines share one scale
  const pool = metric.bars ? values : second ? [...values, ...second.map(scale)] : values;
  let min = metric.zero ? 0 : Math.min(...pool);
  let max = metric.top !== undefined ? metric.top : Math.max(...pool);
  if (max - min < 1) max = min + 1;
  const x = (k) => padX + (k / (n - 1)) * (W - 2 * padX);
  const y = (v, lo = min, hi = max) => padTop + (1 - (v - lo) / (hi - lo)) * (H - padTop - padBottom);
  const path = (list, lo, hi) => "M" + list.map((v, k) => `${x(k).toFixed(1)},${y(v, lo, hi).toFixed(1)}`).join(" L");

  let body = "";
  if (metric.bars) {
    const bw = Math.max(2, (W - 2 * padX) / n - 2);
    body += values.map((v, k) => `<rect class="metric-bar" x="${(x(k) - bw / 2).toFixed(1)}" y="${y(v).toFixed(1)}" width="${bw.toFixed(1)}" height="${(H - padBottom - y(v)).toFixed(1)}" rx="2"/>`).join("");
    if (second) {
      const top = Math.max(1, ...second);
      body += `<path class="chart-feels" d="${path(second, 0, top)}"/>`;
    }
  } else {
    const line = path(values, min, max);
    body += `<path d="${line} L${x(n - 1).toFixed(1)},${H - padBottom} L${x(0).toFixed(1)},${H - padBottom} Z" fill="url(#metric-grad)"/>`;
    if (second) body += `<path class="chart-feels" d="${path(second.map(scale), min, max)}"/>`;
    body += `<path d="${line}" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
  }

  // "Now" line and time labels every 6 hours
  const kNow = nowIndex - from;
  if (kNow >= 0 && kNow < n) body += `<line class="chart-now" x1="${x(kNow).toFixed(1)}" y1="${padTop - 8}" x2="${x(kNow).toFixed(1)}" y2="${H - padBottom}"/>`;
  times.forEach((time, k) => {
    if (Number(time.slice(11, 13)) % 6 === 0) {
      const label = time.slice(11, 13) === "00" ? fmtWeekday(time) : fmtTime(time);
      body += `<text class="chart-label" x="${x(k).toFixed(1)}" y="${H - 8}" text-anchor="middle">${label}</text>`;
    }
  });
  // Scale labels on the left
  body += `<text class="chart-label" x="2" y="${padTop + 4}">${Math.round(max)}</text>`;
  body += `<text class="chart-label" x="2" y="${H - padBottom}">${Math.round(min)}</text>`;

  const legend = metric.legend
    ? `<div class="chart-legend"><span><i class="lg ${metric.bars ? "lg-bar" : "lg-solid"}"></i>${t(metric.legend[0])}</span><span><i class="lg lg-dash"></i>${t(metric.legend[1])}</span></div>`
    : "";

  box.innerHTML = `
    <svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t(metric.title)}">
      <defs><linearGradient id="metric-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity="0.3"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient></defs>
      ${body}
    </svg>${legend}`;
}

function renderMetricPage() {
  const data = latestWeather;
  const metric = METRICS[metricPage.name];
  if (!data || !metric) return;
  const h = data.hourly;
  const from = weatherNow.index;
  const to = Math.min(from + 48, h.time.length);
  const list = h[metric.key].slice(from, to);

  document.getElementById("metric-title").textContent = t(metric.title);
  document.getElementById("metric-now").textContent = metric.fmt(list[0]);

  const hi = list.indexOf(Math.max(...list));
  const lo = list.indexOf(Math.min(...list));
  const when = (k) => `${fmtWeekday(h.time[from + k])} ${fmtTime(h.time[from + k])}`;
  document.getElementById("metric-stats").innerHTML =
    `<span>${t("metricHigh", { v: metric.fmt(list[hi]) })} · ${when(hi)}</span>` +
    `<span>${t("metricLow", { v: metric.fmt(list[lo]) })} · ${when(lo)}</span>`;
  document.getElementById("metric-explain").textContent = t(metric.ex);

  const box = document.getElementById("chart-metric");
  drawMetricChart(box, data, from, to, weatherNow.index, metric);
}

function openMetricPage(name) {
  if (!latestWeather || !METRICS[name]) return;
  metricPage.name = name;
  openSubPage("page-metric");
  renderMetricPage(); // after the page is visible, so the chart knows its width
}

// Any element with data-metric="..." opens the page (mouse, finger or Enter key)
document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-metric]");
  if (target) openMetricPage(target.dataset.metric);
});
document.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-metric]")) {
    event.preventDefault();
    openMetricPage(event.target.dataset.metric);
  }
});
