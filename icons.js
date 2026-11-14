// ----- Custom weather icons (SVG) -----
const iconColors = {
  sun: "#FFC83D",
  moon: "#F3EFFF",
  cloud: "#EEF3FA",
  cloudBack: "#B9C6D8",
  stormCloud: "#8E99B0",
  rain: "#6EC6FF",
  snow: "#FFFFFF",
  bolt: "#FFD54A",
  fog: "#DCE3ED",
};

// A sun: a circle with 8 rays around it
function sunShape(cx, cy, r) {
  let rays = "";
  for (let k = 0; k < 8; k++) {
    const angle = (k * Math.PI) / 4;
    const x1 = (cx + Math.cos(angle) * (r + 4)).toFixed(1);
    const y1 = (cy + Math.sin(angle) * (r + 4)).toFixed(1);
    const x2 = (cx + Math.cos(angle) * (r + 9)).toFixed(1);
    const y2 = (cy + Math.sin(angle) * (r + 9)).toFixed(1);
    rays += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }
  return `
    <g class="wi-rays" style="transform-origin:${cx}px ${cy}px" stroke="${iconColors.sun}" stroke-width="3.5" stroke-linecap="round">${rays}</g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${iconColors.sun}"/>`;
}

// A crescent moon (scale and move it with scale, dx, dy)
function moonShape(scale = 1, dx = 0, dy = 0) {
  return `<path transform="translate(${dx} ${dy}) scale(${scale})" fill="${iconColors.moon}"
    d="M53.4 33.7A21.6 21.6 0 1 1 29.9 10.2A16.8 16.8 0 0 0 53.4 33.7z"/>`;
}

// A cloud made of three circles and a rectangle
function cloudShape(color, dx = 0, dy = 0, scale = 1) {
  return `
    <g transform="translate(${dx} ${dy}) scale(${scale})" fill="${color}">
      <circle cx="22" cy="37" r="10"/>
      <circle cx="34" cy="30" r="13"/>
      <circle cx="46" cy="38" r="9"/>
      <rect x="22" y="34" width="24" height="13"/>
    </g>`;
}

function drops(xs) {
  return xs
    .map((x, k) => `<line class="wi-drop" style="animation-delay:${(k * 0.3).toFixed(1)}s"
      x1="${x}" y1="46" x2="${x - 3}" y2="54" stroke="${iconColors.rain}" stroke-width="3.5" stroke-linecap="round"/>`)
    .join("");
}

function flakes(points) {
  return points
    .map(([x, y], k) => `<circle class="wi-flake" style="animation-delay:${(k * 0.5).toFixed(1)}s"
      cx="${x}" cy="${y}" r="2.8" fill="${iconColors.snow}"/>`)
    .join("");
}

const fogLines = `
  <g stroke="${iconColors.fog}" stroke-width="4" stroke-linecap="round">
    <line x1="14" y1="44" x2="50" y2="44"/>
    <line x1="10" y1="52" x2="44" y2="52"/>
    <line x1="20" y1="60" x2="54" y2="60"/>
  </g>`;

const boltShape = `<polygon class="wi-bolt" points="34,40 25,53 31,53 27,63 41,48 35,48 39,40" fill="${iconColors.bolt}"/>`;

// Weather code (+ day or night) -> finished SVG icon
function weatherIcon(code, isDay = 1) {
  const day = isDay !== 0;
  const c = iconColors;
  let body;

  if (code === 0) {
    body = day ? sunShape(32, 32, 13) : moonShape(0.9, 3, 3);
  } else if (code === 1) {
    body = (day ? sunShape(28, 28, 11) : moonShape(0.8, 4, 4)) + cloudShape(c.cloud, 30, 28, 0.55);
  } else if (code === 2) {
    body = (day ? sunShape(22, 22, 9) : moonShape(0.62, 1, 1)) + cloudShape(c.cloud, 6, 8);
  } else if (code === 3) {
    body = cloudShape(c.cloudBack, -4, -6) + cloudShape(c.cloud, 4, 6);
  } else if (code === 45 || code === 48) {
    body = cloudShape(c.cloudBack, 0, -10) + fogLines;
  } else if ([51, 53, 56].includes(code)) {
    body = cloudShape(c.cloud, 0, -6) + drops([26, 40]);
  } else if ([55, 57, 61, 63, 66, 80].includes(code)) {
    body = cloudShape(c.cloud, 0, -6) + drops([22, 33, 44]);
  } else if ([65, 67, 81, 82].includes(code)) {
    body = cloudShape(c.cloudBack, 0, -6) + drops([18, 27, 36, 45]);
  } else if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    body = cloudShape(c.cloud, 0, -6) + flakes([[22, 50], [32, 57], [42, 50]]);
  } else if (code >= 95) {
    body = cloudShape(c.stormCloud, 0, -8) + boltShape;
  } else {
    body = cloudShape(c.cloud);
  }

  const label = (weatherCodes[code] || { text: "Weather" }).text;
  return `<svg class="wi" viewBox="0 0 64 64" role="img" aria-label="${label}">${body}</svg>`;
}