// ----- Share the weather as an image card -----

// Our SVG icons need an xmlns before an <img> can show them
async function svgToImage(svg) {
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '));
  await img.decode();
  return img;
}

// Write text that may be too long: shrink it until it fits the width
function fitText(ctx, text, x, y, maxWidth, size, weight) {
  let s = size;
  do {
    ctx.font = `${weight} ${s}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    s -= 2;
  } while (ctx.measureText(text).width > maxWidth && s > 20);
  ctx.fillText(text, x, y);
}

async function makeShareImage() {
  const data = latestWeather;
  const W = 1080, H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Same colors as the app's background right now
  const css = getComputedStyle(document.body);
  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, css.getPropertyValue("--bg-start").trim() || "#4facfe");
  gradient.addColorStop(1, css.getPropertyValue("--bg-end").trim() || "#7b5cff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
  if (document.documentElement.dataset.theme === "dark" || document.body.dataset.time === "night") {
    ctx.fillStyle = document.documentElement.dataset.theme === "dark" ? "rgba(3, 4, 10, 0.8)" : "rgba(5, 8, 25, 0.4)";
    ctx.fillRect(0, 0, W, H);
  }

  // Frosted card
  ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(70, 70, W - 140, H - 140, 64);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  const mid = W / 2;
  const text = (id) => document.getElementById(id).textContent.trim();

  ctx.globalAlpha = 0.85;
  fitText(ctx, text("date"), mid, 190, 820, 40, 400);
  ctx.globalAlpha = 1;
  fitText(ctx, currentPlace.name, mid, 275, 860, 76, 700);

  const icon = await svgToImage(document.getElementById("icon").innerHTML);
  ctx.drawImage(icon, mid - 170, 320, 340, 340);

  fitText(ctx, text("temp"), mid, 880, 860, 230, 200);
  fitText(ctx, text("condition"), mid, 960, 860, 56, 500);

  ctx.globalAlpha = 0.9;
  const max = Math.round(data.daily.temperature_2m_max[0]);
  const min = Math.round(data.daily.temperature_2m_min[0]);
  fitText(ctx, `↑${max}°  ↓${min}°   ·   ${t("feelsLike")} ${text("feels")}`, mid, 1045, 860, 42, 400);
  const summary = document.getElementById("summary").textContent.trim();
  if (summary) fitText(ctx, summary, mid, 1120, 860, 34, 400);

  ctx.globalAlpha = 0.6;
  fitText(ctx, "Weather · Open-Meteo", mid, 1225, 860, 28, 400);
  ctx.globalAlpha = 1;

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

async function shareWeather() {
  if (!latestWeather || !currentPlace) return;
  const blob = await makeShareImage();
  const file = new File([blob], "weather.png", { type: "image/png" });
  const city = currentPlace.name;

  // Phones: the normal share sheet (WhatsApp, Instagram, ...)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: t("shareTitle", { city }),
        text: t("shareText", { city, t: document.getElementById("temp").textContent, cond: document.getElementById("condition").textContent }),
      });
    } catch (error) {
      if (error.name !== "AbortError") console.warn("Share failed:", error.message); // AbortError = you closed the share sheet
    }
    return;
  }

  // PCs and older browsers: download the image instead
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  // "Galați, RO" -> "weather-galati.png" (plain letters work everywhere)
  const slug = city.split(",")[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  link.download = `weather-${slug}.png`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
  const note = document.getElementById("geo-note");
  note.textContent = t("shareSaved");
  setTimeout(() => {
    if (note.textContent === t("shareSaved")) note.textContent = "";
  }, 3000);
}

document.getElementById("share-btn").addEventListener("click", shareWeather);
