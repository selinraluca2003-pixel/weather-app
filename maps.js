// ----- Wind and temperature map layers (on the Radar page) -----
// The app asks Open-Meteo for the weather at a 9 × 9 grid of points covering the map,
// then paints colors between them and lets little particles drift with the wind.
let mapLayer = "rain"; // "rain", "wind" or "temp"
const GRID = 9;
const grid = { points: null, area: null, counter: 0, field: null, particles: [], frame: null, moveTimer: null };

let heatCanvas = null, flowCanvas = null; // two see-through canvases on top of the map

function ensureOverlays() {
  if (heatCanvas) return;
  const container = document.getElementById("radar-map");
  heatCanvas = document.createElement("canvas");
  flowCanvas = document.createElement("canvas");
  heatCanvas.className = flowCanvas.className = "map-overlay";
  container.append(heatCanvas, flowCanvas);

  // While the map moves, hide our drawing; when it stops, fetch (if needed) and redraw
  radar.map.on("movestart zoomstart", () => {
    if (mapLayer === "rain") return;
    stopFlow();
    heatCanvas.style.opacity = flowCanvas.style.opacity = "0";
  });
  radar.map.on("moveend", () => {
    if (mapLayer === "rain") return;
    clearTimeout(grid.moveTimer);
    grid.moveTimer = setTimeout(loadGrid, 300);
  });
}

// ---- Colors ----
const TEMP_STOPS = [[-20, [106, 0, 255]], [-10, [61, 90, 254]], [0, [0, 176, 255]], [10, [0, 200, 120]], [20, [255, 214, 0]], [30, [255, 109, 0]], [40, [213, 0, 0]]];
const WIND_STOPS = [[0, [61, 90, 254]], [10, [0, 176, 255]], [20, [0, 200, 120]], [35, [255, 214, 0]], [50, [255, 109, 0]], [75, [213, 0, 0]], [100, [170, 0, 255]]];

function colorFor(value, stops) {
  if (value <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [v1, c1] = stops[i];
    const [v0, c0] = stops[i - 1];
    if (value <= v1) {
      const f = (value - v0) / (v1 - v0);
      return c0.map((c, k) => Math.round(c + (c1[k] - c) * f));
    }
  }
  return stops[stops.length - 1][1];
}

// ---- Data ----
function paddedArea() {
  const b = radar.map.getBounds();
  const padLat = (b.getNorth() - b.getSouth()) * 0.25;
  const padLon = (b.getEast() - b.getWest()) * 0.25;
  return {
    south: Math.max(-85, b.getSouth() - padLat), north: Math.min(85, b.getNorth() + padLat),
    west: b.getWest() - padLon, east: b.getEast() + padLon,
  };
}

function covers(outer, b) {
  return outer && b.getSouth() >= outer.south && b.getNorth() <= outer.north && b.getWest() >= outer.west && b.getEast() <= outer.east;
}

async function loadGrid() {
  if (mapLayer === "rain") return;
  const note = document.getElementById("map-note");

  // Moving a little inside the area we already have doesn't need new data
  if (!covers(grid.area, radar.map.getBounds())) {
    const area = paddedArea();
    const lats = [], lons = [];
    for (let j = 0; j < GRID; j++) {
      for (let i = 0; i < GRID; i++) {
        lats.push((area.south + ((area.north - area.south) * j) / (GRID - 1)).toFixed(2));
        lons.push((area.west + ((area.east - area.west) * i) / (GRID - 1)).toFixed(2));
      }
    }
    const myId = ++grid.counter;
    note.textContent = t("mapLoading");
    try {
      const data = await fetchJSON(
        `https://api.open-meteo.com/v1/forecast?latitude=${lats.join(",")}&longitude=${lons.join(",")}` +
          `&current=temperature_2m,wind_speed_10m,wind_direction_10m${units.param()}`,
        { timeout: 15000 }
      );
      if (myId !== grid.counter) return;
      const list = Array.isArray(data) ? data : [data];
      grid.points = list.map((d) => ({
        temp: d.current.temperature_2m,
        speed: units.toKmh(d.current.wind_speed_10m), // colors and particle speed work in km/h
        dir: d.current.wind_direction_10m,
      }));
      grid.area = area;
    } catch (error) {
      if (myId !== grid.counter) return;
      console.warn("Map grid unavailable:", error.message);
      note.textContent = t("mapUnavailable");
      return;
    }
  }
  note.textContent = t("mapNote");
  buildField();
  drawLayer();
}

// Value at any latitude/longitude, blended from the 4 nearest grid points
function sample(lat, lon) {
  const a = grid.area;
  const gx = Math.min(GRID - 1.001, Math.max(0, ((lon - a.west) / (a.east - a.west)) * (GRID - 1)));
  const gy = Math.min(GRID - 1.001, Math.max(0, ((lat - a.south) / (a.north - a.south)) * (GRID - 1)));
  const i = Math.floor(gx), j = Math.floor(gy), fx = gx - i, fy = gy - j;
  const p = (ii, jj) => grid.points[jj * GRID + ii];
  const corners = [[p(i, j), (1 - fx) * (1 - fy)], [p(i + 1, j), fx * (1 - fy)], [p(i, j + 1), (1 - fx) * fy], [p(i + 1, j + 1), fx * fy]];
  let temp = 0, u = 0, v = 0;
  for (const [pt, w] of corners) {
    const r = (pt.dir * Math.PI) / 180;
    temp += pt.temp * w;
    u += -pt.speed * Math.sin(r) * w; // east-west part of the wind ("from" direction, so minus)
    v += -pt.speed * Math.cos(r) * w; // north-south part
  }
  return { temp, u, v, speed: Math.hypot(u, v) };
}

// Sample the grid every 16 screen pixels, so the animation can look values up quickly
const STEP = 16;
function buildField() {
  const size = radar.map.getSize();
  const cols = Math.ceil(size.x / STEP) + 1, rows = Math.ceil(size.y / STEP) + 1;
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ll = radar.map.containerPointToLatLng([c * STEP, r * STEP]);
      cells.push(sample(ll.lat, ll.lng));
    }
  }
  grid.field = { cols, rows, cells, w: size.x, h: size.y };
}

function cellAt(x, y) {
  const f = grid.field;
  const c = Math.round(x / STEP), r = Math.round(y / STEP);
  if (c < 0 || r < 0 || c >= f.cols || r >= f.rows) return null;
  return f.cells[r * f.cols + c];
}

// ---- Drawing ----
function drawHeat() {
  const f = grid.field;
  heatCanvas.width = f.w;
  heatCanvas.height = f.h;
  const small = document.createElement("canvas");
  small.width = f.cols;
  small.height = f.rows;
  const sctx = small.getContext("2d");
  const img = sctx.createImageData(f.cols, f.rows);
  f.cells.forEach((cell, k) => {
    const rgb = mapLayer === "temp" ? colorFor(units.toCelsius(cell.temp), TEMP_STOPS) : colorFor(cell.speed, WIND_STOPS);
    img.data.set([...rgb, 120], k * 4);
  });
  sctx.putImageData(img, 0, 0);

  const ctx = heatCanvas.getContext("2d");
  ctx.imageSmoothingEnabled = true; // blends the small picture into smooth color areas
  ctx.drawImage(small, -STEP / 2, -STEP / 2, f.cols * STEP, f.rows * STEP);

  // Temperature numbers at the grid points
  if (mapLayer === "temp") {
    ctx.font = "600 12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 3;
    const a = grid.area;
    let lastX = -999, lastY = -999;
    for (let j = 0; j < GRID; j++) {
      for (let i = 0; i < GRID; i++) {
        const pt = radar.map.latLngToContainerPoint([a.south + ((a.north - a.south) * j) / (GRID - 1), a.west + ((a.east - a.west) * i) / (GRID - 1)]);
        if (pt.x < 10 || pt.y < 14 || pt.x > f.w - 10 || pt.y > f.h - 6) continue;
        if (Math.abs(pt.x - lastX) < 34 && Math.abs(pt.y - lastY) < 18) continue; // too crowded
        ctx.fillText(`${Math.round(grid.points[j * GRID + i].temp)}°`, pt.x, pt.y);
        lastX = pt.x;
        lastY = pt.y;
      }
    }
    ctx.shadowBlur = 0;
  }
}

function newParticle(f) {
  return { x: Math.random() * f.w, y: Math.random() * f.h, age: Math.floor(Math.random() * 80), life: 60 + Math.random() * 60 };
}

function flowStep() {
  const f = grid.field;
  const ctx = flowCanvas.getContext("2d");
  // Fade the old trails a little each frame
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
  ctx.fillRect(0, 0, f.w, f.h);
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (const p of grid.particles) {
    const cell = cellAt(p.x, p.y);
    if (!cell || ++p.age > p.life) {
      Object.assign(p, newParticle(f), { age: 0 });
      continue;
    }
    const nx = p.x + cell.u * 0.06, ny = p.y - cell.v * 0.06; // screen y grows downward
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(nx, ny);
    p.x = nx;
    p.y = ny;
  }
  ctx.stroke();
  grid.frame = requestAnimationFrame(flowStep);
}

// Animations off: still arrows instead of moving particles
function drawArrows() {
  const f = grid.field;
  const ctx = flowCanvas.getContext("2d");
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 1.5;
  for (let y = 24; y < f.h; y += 48) {
    for (let x = 24; x < f.w; x += 48) {
      const cell = cellAt(x, y);
      if (!cell || cell.speed < 1) continue;
      const len = Math.min(18, 6 + cell.speed * 0.3);
      const ang = Math.atan2(-cell.v, cell.u);
      const tx = x + Math.cos(ang) * len, ty = y + Math.sin(ang) * len;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(tx, ty);
      ctx.lineTo(tx - Math.cos(ang - 0.5) * 5, ty - Math.sin(ang - 0.5) * 5);
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - Math.cos(ang + 0.5) * 5, ty - Math.sin(ang + 0.5) * 5);
      ctx.stroke();
    }
  }
}

function stopFlow() {
  cancelAnimationFrame(grid.frame);
  grid.frame = null;
}

function drawLayer() {
  if (!grid.field || mapLayer === "rain") return;
  stopFlow();
  drawHeat();
  const f = grid.field;
  flowCanvas.width = f.w;
  flowCanvas.height = f.h;
  if (mapLayer === "wind") {
    if (animationsOn()) {
      grid.particles = Array.from({ length: Math.min(600, Math.round((f.w * f.h) / 900)) }, () => newParticle(f));
      flowStep();
    } else {
      drawArrows();
    }
  }
  heatCanvas.style.opacity = flowCanvas.style.opacity = "1";
  renderMapLegend();
}

function renderMapLegend() {
  const legend = document.getElementById("map-legend");
  if (mapLayer === "rain") {
    legend.innerHTML = "";
    return;
  }
  const temp = mapLayer === "temp";
  const stops = temp ? TEMP_STOPS : WIND_STOPS;
  const gradient = stops.map(([, c], i) => `rgb(${c.join(",")}) ${Math.round((i / (stops.length - 1)) * 100)}%`).join(", ");
  const label = (v) => (temp ? `${Math.round(units.isImperial() ? (v * 9) / 5 + 32 : v)}°` : units.showWind(v));
  legend.innerHTML = `
    <div class="legend-bar" style="background: linear-gradient(to right, ${gradient})"></div>
    <div class="legend-scale"><span>${label(stops[0][0])}</span><span>${temp ? t("layerTemp") : t("layerWind")}</span><span>${label(stops[stops.length - 1][0])}</span></div>`;
}

// ---- Switching layers ----
function setMapLayer(layer) {
  mapLayer = layer;
  document.querySelectorAll("#map-layers [data-layer]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.layer === layer)));
  const rain = layer === "rain";
  document.getElementById("radar-controls").hidden = !rain;
  document.getElementById("radar-note").hidden = !rain;
  document.getElementById("map-note").hidden = rain;
  if (!radar.map) return;
  ensureOverlays();

  if (rain) {
    stopFlow();
    heatCanvas.style.opacity = flowCanvas.style.opacity = "0";
    renderMapLegend();
    if (radar.frames.length) {
      showRadarFrame(radar.index);
      startRadar();
    }
  } else {
    stopRadar();
    radar.layers.forEach((l) => l && l.setOpacity(0)); // hide the rain radar
    loadGrid();
  }
}

document.getElementById("map-layers").addEventListener("click", (event) => {
  const button = event.target.closest("[data-layer]");
  if (button && button.dataset.layer !== mapLayer) setMapLayer(button.dataset.layer);
});

// Leaving the Radar page: stop the particles
document.addEventListener("pagechange", (event) => {
  if (event.detail.pageId !== "page-radar") stopFlow();
});
