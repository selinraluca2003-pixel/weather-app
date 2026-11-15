// ----- Weather look: background, night icon, rain & snow -----

// Group Open-Meteo weather codes into six looks
function weatherCategory(code) {
  if (code <= 1) return "clear";
  if (code <= 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 95) return "storm";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  return "rain"; // drizzle, rain, showers
}

// Moon instead of sun at night
function iconFor(code, isDay) {
  return weatherIcon(code, isDay);
}

// Called by getWeather: switches the whole look of the app
function applyWeatherTheme(code, isDay) {
  const category = weatherCategory(code);
  document.body.dataset.weather = category;
  document.body.dataset.time = isDay ? "day" : "night";
  setWeatherFx(category);
}

// ----- Falling rain and snow (canvas) -----
const fxCanvas = document.getElementById("fx");
const fxCtx = fxCanvas.getContext("2d");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let fxMode = "none";
let fxParticles = [];
let fxFrame = null;

function resizeFx() {
  fxCanvas.width = window.innerWidth;
  fxCanvas.height = window.innerHeight;
}
resizeFx();
window.addEventListener("resize", resizeFx);

function makeParticles(mode) {
  const count = mode === "snow" ? 80 : mode === "storm" ? 170 : 110;
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * fxCanvas.width,
      y: Math.random() * fxCanvas.height,
      speed: mode === "snow" ? 0.8 + Math.random() * 1.6 : 12 + Math.random() * 10,
      size: mode === "snow" ? 1.5 + Math.random() * 2.5 : 10 + Math.random() * 14,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return particles;
}

function drawFx() {
  const w = fxCanvas.width;
  const h = fxCanvas.height;
  fxCtx.clearRect(0, 0, w, h);

  if (fxMode === "snow") {
    fxCtx.fillStyle = "rgba(255, 255, 255, 0.8)";
    for (const p of fxParticles) {
      p.y += p.speed;
      p.phase += 0.02;
      p.x += Math.sin(p.phase) * 0.6; // gentle sway
      if (p.y > h) { p.y = -5; p.x = Math.random() * w; }
      fxCtx.beginPath();
      fxCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      fxCtx.fill();
    }
  } else {
    fxCtx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    fxCtx.lineWidth = 1.2;
    fxCtx.beginPath();
    for (const p of fxParticles) {
      p.y += p.speed;
      p.x -= 1.5;
      if (p.x < -5) p.x = w;
      if (p.y > h) { p.y = -p.size; p.x = Math.random() * w; }
      fxCtx.moveTo(p.x, p.y);
      fxCtx.lineTo(p.x - 1.5, p.y + p.size);
    }
    fxCtx.stroke();
  }

  fxFrame = requestAnimationFrame(drawFx);
}

function setWeatherFx(category) {
  const mode = category === "rain" || category === "storm" || category === "snow" ? category : "none";
  if (mode === fxMode) return;

  fxMode = mode;
  cancelAnimationFrame(fxFrame);
  fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);

  if (mode === "none" || reduceMotion.matches || store.get("motion", true) === false) return;

  fxParticles = makeParticles(mode);
  drawFx();
}

// Called by the settings page when "Animations" is switched on or off
function refreshWeatherFx() {
  const category = document.body.dataset.weather || "clear";
  fxMode = "none"; // forces setWeatherFx to start (or stop) again
  setWeatherFx(category);
}
