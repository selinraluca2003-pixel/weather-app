// ----- Weather look: background colors, and the animated sky behind the app -----

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

// Called when a forecast is shown: switches the whole look of the app
function applyWeatherTheme(code, isDay) {
  document.body.dataset.weather = weatherCategory(code);
  document.body.dataset.time = isDay ? "day" : "night";
  setScene(code, isDay);
}

// ----- The animated sky (one canvas behind everything) -----
const fxCanvas = document.getElementById("fx");
const fxCtx = fxCanvas.getContext("2d");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let scene = null;   // what is being drawn
let fxFrame = null; // the running animation
let sceneKey = "";

function resizeFx() {
  fxCanvas.width = window.innerWidth;
  fxCanvas.height = window.innerHeight;
  if (scene) {
    buildScene(scene.code, scene.isDay); // re-spread clouds and stars over the new size
    if (!fxFrame) drawFrame();           // animations off: redraw the still picture
  }
}
window.addEventListener("resize", resizeFx);

// A soft cloud picture, drawn once and then reused many times (much faster than drawing circles every frame)
function makeCloudSprite(color) {
  const sprite = document.createElement("canvas");
  sprite.width = 320;
  sprite.height = 160;
  const c = sprite.getContext("2d");
  const puffs = [[80, 100, 55], [140, 75, 70], [210, 90, 60], [255, 110, 42], [120, 115, 50], [180, 118, 52]];
  for (const [x, y, r] of puffs) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(0.6, color.replace(/[\d.]+\)$/, "0.55)"));
    g.addColorStop(1, color.replace(/[\d.]+\)$/, "0)"));
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
  return sprite;
}
const cloudLight = makeCloudSprite("rgba(255, 255, 255, 0.9)");
const cloudDark = makeCloudSprite("rgba(150, 160, 180, 0.9)");

const rand = (a, b) => a + Math.random() * (b - a);

function buildScene(code, isDay) {
  const w = fxCanvas.width, h = fxCanvas.height;
  const category = weatherCategory(code);
  const wet = category === "rain" || category === "storm" || category === "snow";
  const cloudCount = { 0: 0, 1: 2, 2: 4, 3: 7 }[code] ?? (wet ? 7 : category === "fog" ? 3 : 0);

  scene = {
    code, isDay, category, time: 0,
    sun: isDay && code <= 2,
    stars: !isDay && code <= 2 ? Array.from({ length: Math.round((w * h) / 9000) }, () => ({
      x: rand(0, w), y: rand(0, h * 0.75), r: rand(0.4, 1.6), phase: rand(0, 6.3), speed: rand(0.01, 0.04),
    })) : [],
    shooting: null,
    clouds: Array.from({ length: cloudCount }, () => ({
      x: rand(-200, w), y: rand(-30, h * 0.45), scale: rand(0.6, 1.5), speed: rand(0.08, 0.3),
      alpha: wet || code === 3 ? rand(0.25, 0.45) : rand(0.18, 0.35),
    })),
    darkClouds: wet,
    fog: category === "fog" ? Array.from({ length: 5 }, (_, i) => ({ x: rand(-w, 0), y: h * (0.35 + i * 0.13), speed: rand(0.15, 0.4) })) : [],
    drops: [],
    flash: 0,
    bolt: null,
    nextFlash: rand(120, 360),
  };

  if (wet) {
    const snow = category === "snow";
    const count = snow ? 80 : category === "storm" ? 170 : 110;
    scene.drops = Array.from({ length: count }, () => ({
      x: rand(0, w), y: rand(0, h), phase: rand(0, 6.3),
      speed: snow ? rand(0.8, 2.4) : rand(12, 22),
      size: snow ? rand(1.5, 4) : rand(10, 24),
    }));
  }
}

// The sun's glow never changes, so paint it once into its own small picture
function makeSunGlow(w, h) {
  const r = Math.round(Math.max(w, h) * 0.45);
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = glowCanvas.height = r * 2;
  const c = glowCanvas.getContext("2d");
  const glow = c.createRadialGradient(r, r, 0, r, r, r);
  glow.addColorStop(0, "rgba(255, 236, 170, 0.45)");
  glow.addColorStop(0.25, "rgba(255, 220, 140, 0.15)");
  glow.addColorStop(1, "rgba(255, 220, 140, 0)");
  c.fillStyle = glow;
  c.fillRect(0, 0, r * 2, r * 2);
  return glowCanvas;
}

function drawSun(c, w, h, time) {
  const x = w * 0.82, y = h * 0.1;
  if (!scene.sunGlow) scene.sunGlow = makeSunGlow(w, h);
  c.drawImage(scene.sunGlow, x - scene.sunGlow.width / 2, y - scene.sunGlow.height / 2);

  // Slowly turning light rays
  c.save();
  c.translate(x, y);
  c.rotate(time * 0.0007);
  c.fillStyle = "rgba(255, 245, 210, 0.06)";
  const len = Math.max(w, h);
  for (let k = 0; k < 12; k++) {
    c.rotate((Math.PI * 2) / 12);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(len, -len * 0.07);
    c.lineTo(len, len * 0.07);
    c.closePath();
    c.fill();
  }
  c.restore();
}

function drawStars(c, w, h, time) {
  c.fillStyle = "#fff";
  for (const s of scene.stars) {
    c.globalAlpha = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(time * s.speed + s.phase));
    c.beginPath();
    c.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;

  // Now and then, a shooting star
  if (!scene.shooting && Math.random() < 0.002) {
    scene.shooting = { x: rand(w * 0.2, w), y: rand(0, h * 0.3), life: 1 };
  }
  const s = scene.shooting;
  if (s) {
    const g = c.createLinearGradient(s.x, s.y, s.x + 90, s.y - 40);
    g.addColorStop(0, `rgba(255,255,255,${s.life})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.strokeStyle = g;
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(s.x, s.y);
    c.lineTo(s.x + 90, s.y - 40);
    c.stroke();
    s.x -= 9;
    s.y += 4;
    s.life -= 0.03;
    if (s.life <= 0) scene.shooting = null;
  }
}

function drawClouds(c, w) {
  const sprite = scene.darkClouds ? cloudDark : cloudLight;
  for (const cl of scene.clouds) {
    c.globalAlpha = cl.alpha;
    c.drawImage(sprite, cl.x, cl.y, 320 * cl.scale, 160 * cl.scale);
    cl.x += cl.speed;
    if (cl.x > w) cl.x = -320 * cl.scale;
  }
  c.globalAlpha = 1;
}

function drawFog(c, w) {
  for (const band of scene.fog) {
    if (!band.gradient) {
      band.gradient = c.createLinearGradient(0, band.y - 60, 0, band.y + 60);
      band.gradient.addColorStop(0, "rgba(230, 236, 245, 0)");
      band.gradient.addColorStop(0.5, "rgba(230, 236, 245, 0.22)");
      band.gradient.addColorStop(1, "rgba(230, 236, 245, 0)");
    }
    c.fillStyle = band.gradient;
    c.fillRect(band.x, band.y - 60, w * 2, 120);
    band.x += band.speed;
    if (band.x > 0) band.x = -w;
  }
}

function drawDrops(c, w, h) {
  if (scene.category === "snow") {
    c.fillStyle = "rgba(255, 255, 255, 0.8)";
    for (const p of scene.drops) {
      p.y += p.speed;
      p.phase += 0.02;
      p.x += Math.sin(p.phase) * 0.6; // gentle sway
      if (p.y > h) { p.y = -5; p.x = rand(0, w); }
      c.beginPath();
      c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      c.fill();
    }
  } else {
    c.strokeStyle = "rgba(255, 255, 255, 0.35)";
    c.lineWidth = 1.2;
    c.beginPath();
    for (const p of scene.drops) {
      p.y += p.speed;
      p.x -= 1.5;
      if (p.x < -5) p.x = w;
      if (p.y > h) { p.y = -p.size; p.x = rand(0, w); }
      c.moveTo(p.x, p.y);
      c.lineTo(p.x - 1.5, p.y + p.size);
    }
    c.stroke();
  }
}

// Thunderstorm: a lightning bolt and a flash every few seconds
function drawLightning(c, w, h) {
  scene.nextFlash--;
  if (scene.nextFlash <= 0) {
    scene.flash = 0.45;
    scene.nextFlash = rand(180, 480);
    const points = [[rand(w * 0.15, w * 0.85), 0]];
    while (points[points.length - 1][1] < h * 0.6) {
      const [px, py] = points[points.length - 1];
      points.push([px + rand(-40, 40), py + rand(25, 60)]);
    }
    scene.bolt = { points, life: 8 };
  }
  if (scene.flash > 0) {
    c.fillStyle = `rgba(230, 235, 255, ${scene.flash})`;
    c.fillRect(0, 0, w, h);
    scene.flash = Math.max(0, scene.flash - 0.03);
  }
  if (scene.bolt) {
    c.strokeStyle = "rgba(255, 255, 240, 0.9)";
    c.lineWidth = 2.5;
    c.shadowColor = "rgba(200, 210, 255, 0.9)";
    c.shadowBlur = 12;
    c.beginPath();
    scene.bolt.points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
    c.shadowBlur = 0;
    if (--scene.bolt.life <= 0) scene.bolt = null;
  }
}

function drawFrame() {
  const c = fxCtx, w = fxCanvas.width, h = fxCanvas.height;
  c.clearRect(0, 0, w, h);
  if (!scene) return;
  scene.time++;
  if (scene.sun) drawSun(c, w, h, scene.time);
  if (scene.stars.length) drawStars(c, w, h, scene.time);
  if (scene.fog.length) drawFog(c, w);
  if (scene.clouds.length) drawClouds(c, w);
  if (scene.drops.length) drawDrops(c, w, h);
  if (scene.category === "storm") drawLightning(c, w, h);
}

function animationsOn() {
  return !reduceMotion.matches && store.get("motion", true) !== false;
}

function loop() {
  drawFrame();
  fxFrame = requestAnimationFrame(loop);
}

// Start (or redraw) the sky for this weather
function setScene(code, isDay) {
  const key = `${code}|${isDay}`;
  if (key === sceneKey && fxFrame) return; // already showing it
  sceneKey = key;
  cancelAnimationFrame(fxFrame);
  fxFrame = null;
  buildScene(code, isDay);

  if (animationsOn()) {
    loop();
  } else {
    // Animations off: one still picture (no lightning flash, no movement)
    scene.category = scene.category === "storm" ? "rain" : scene.category;
    drawFrame();
  }
}

// Called by the settings page when "Animations" is switched on or off
function refreshWeatherFx() {
  if (!scene) return;
  sceneKey = "";
  setScene(scene.code, scene.isDay);
}
resizeFx();
