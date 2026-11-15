// ----- Sun and moon: positions, golden hour, moonrise and moonset -----
// Standard astronomy formulas (the same approach as the SunCalc library), accurate to about a minute.
const astro = (() => {
  const rad = Math.PI / 180;
  const dayMs = 86400000, J1970 = 2440588, J2000 = 2451545;
  const e = rad * 23.4397; // tilt of the Earth's axis

  const toDays = (date) => date.valueOf() / dayMs - 0.5 + J1970 - J2000;
  const fromJulian = (j) => new Date((j + 0.5 - J1970) * dayMs);
  const rightAscension = (l, b) => Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
  const declination = (l, b) => Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
  const altitude = (H, phi, dec) => Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  const siderealTime = (d, lw) => rad * (280.16 + 360.9856235 * d) - lw;
  const refraction = (h) => {
    if (h < 0) h = 0;
    return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
  };

  // ---- Sun ----
  const solarMeanAnomaly = (d) => rad * (357.5291 + 0.98560028 * d);
  const eclipticLongitude = (M) =>
    M + rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + rad * 102.9372 + Math.PI;

  const J0 = 0.0009;
  const julianCycle = (d, lw) => Math.round(d - J0 - lw / (2 * Math.PI));
  const approxTransit = (Ht, lw, n) => J0 + (Ht + lw) / (2 * Math.PI) + n;
  const solarTransitJ = (ds, M, L) => J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  const hourAngle = (h, phi, dec) => Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)));

  // Times when the sun's center is at "angle" degrees above the horizon, around the given day
  function sunTimes(date, lat, lng, angle) {
    const lw = rad * -lng, phi = rad * lat;
    const n = julianCycle(toDays(date), lw);
    const ds = approxTransit(0, lw, n);
    const M = solarMeanAnomaly(ds);
    const L = eclipticLongitude(M);
    const dec = declination(L, 0);
    const Jnoon = solarTransitJ(ds, M, L);
    const w = hourAngle(angle * rad, phi, dec);
    if (Number.isNaN(w)) return null; // polar day or night: never reaches that angle
    const Jset = solarTransitJ(approxTransit(w, lw, n), M, L);
    return { morning: fromJulian(Jnoon - (Jset - Jnoon)), evening: fromJulian(Jset) };
  }

  // ---- Moon ----
  function moonAltitude(date, lat, lng) {
    const d = toDays(date);
    const L = rad * (218.316 + 13.176396 * d);
    const M = rad * (134.963 + 13.064993 * d);
    const F = rad * (93.272 + 13.22935 * d);
    const l = L + rad * 6.289 * Math.sin(M);
    const b = rad * 5.128 * Math.sin(F);
    const H = siderealTime(d, rad * -lng) - rightAscension(l, b);
    const h = altitude(H, rad * lat, declination(l, b));
    return h + refraction(h);
  }

  // Moonrise and moonset during the 24 hours after "start"
  function moonTimes(start, lat, lng) {
    const at = (hours) => new Date(start.valueOf() + hours * 3600000);
    const hc = 0.133 * rad;
    let h0 = moonAltitude(start, lat, lng) - hc;
    let rise = null, set = null;

    // Look 2 hours at a time and fit a curve through the 3 heights to find where it crosses the horizon
    for (let i = 1; i <= 24; i += 2) {
      const h1 = moonAltitude(at(i), lat, lng) - hc;
      const h2 = moonAltitude(at(i + 1), lat, lng) - hc;
      const a = (h0 + h2) / 2 - h1;
      const b = (h2 - h0) / 2;
      const xe = -b / (2 * a);
      const ye = (a * xe + b) * xe + h1;
      const disc = b * b - 4 * a * h1;
      let roots = 0, x1 = 0, x2 = 0;

      if (disc >= 0) {
        const dx = Math.sqrt(disc) / (Math.abs(a) * 2);
        x1 = xe - dx;
        x2 = xe + dx;
        if (Math.abs(x1) <= 1) roots++;
        if (Math.abs(x2) <= 1) roots++;
        if (x1 < -1) x1 = x2;
      }

      if (roots === 1) {
        if (h0 < 0) rise = i + x1;
        else set = i + x1;
      } else if (roots === 2) {
        rise = i + (ye < 0 ? x2 : x1);
        set = i + (ye < 0 ? x1 : x2);
      }
      if (rise !== null && set !== null) break;
      h0 = h2;
    }
    return { rise: rise !== null ? at(rise) : null, set: set !== null ? at(set) : null };
  }

  return { sunTimes, moonTimes, moonAltitude };
})();

// A real moment -> "2026-11-15T16:02" in the forecast city's own time
function isoAtPlace(date, data) {
  return new Date(date.valueOf() + data.utc_offset_seconds * 1000).toISOString().slice(0, 16);
}

// Local "HH:MM" strings from the forecast -> milliseconds (only used to compare them with each other)
const isoMs = (iso) => Date.parse(iso + ":00Z");

// ----- The "Sun & moon" card -----
function showSunMoon(data) {
  const box = document.getElementById("sun-card");
  const place = currentPlace;
  const date = data.daily.time[0];
  const offsetMs = data.utc_offset_seconds * 1000;
  const sunrise = data.daily.sunrise[0];
  const sunset = data.daily.sunset[0];
  const nowISO = placeNowISO(data);
  if (!sunrise || !sunset) {
    box.innerHTML = "";
    return;
  }

  // How far along today's path the sun is (0 = sunrise, 1 = sunset)
  const fraction = (isoMs(nowISO) - isoMs(sunrise)) / (isoMs(sunset) - isoMs(sunrise));
  const up = fraction >= 0 && fraction <= 1;
  const W = 300, base = 112, rx = 125, ry = 92, cx = W / 2;
  const angle = Math.PI * (1 - Math.min(1, Math.max(0, fraction)));
  const sunX = cx + rx * Math.cos(angle);
  const sunY = base - ry * Math.sin(angle);
  const arc = `M ${cx - rx} ${base} A ${rx} ${ry} 0 0 1 ${cx + rx} ${base}`;

  let status;
  if (up) status = t("daylightLeft", { d: formatDuration((isoMs(sunset) - isoMs(nowISO)) / 1000) });
  else if (fraction < 0) status = t("sunriseIn", { d: formatDuration((isoMs(sunrise) - isoMs(nowISO)) / 1000) });
  else status = t("sunDown");

  // Golden hour: the sun between the horizon and 6° up
  const noon = new Date(Date.parse(date + "T12:00:00Z") - offsetMs);
  const golden = astro.sunTimes(noon, place.latitude, place.longitude, 6);
  let goldenHTML = "";
  if (golden) {
    goldenHTML = `
      <div class="sun-row"><span>✨ ${t("goldenHour")}</span><span>
        ${t("goldenMorning", { a: fmtTime(sunrise), b: fmtTime(isoAtPlace(golden.morning, data)) })}<br>
        ${t("goldenEvening", { a: fmtTime(isoAtPlace(golden.evening, data)), b: fmtTime(sunset) })}
      </span></div>`;
  }

  // Moonrise and moonset during today (city time)
  const midnight = new Date(Date.parse(date + "T00:00:00Z") - offsetMs);
  const moon = astro.moonTimes(midnight, place.latitude, place.longitude);
  const phase = moonPhase();
  const moonTime = (d) => (d ? fmtTime(isoAtPlace(d, data)) : "—");

  box.innerHTML = `
    <div class="more-card sun-card">
      <span class="label">${t("sunMoon")}</span>
      <svg class="sun-arc" viewBox="0 0 ${W} 140" role="img" aria-label="${t("sunrise")} ${fmtTime(sunrise)}, ${t("sunset")} ${fmtTime(sunset)}">
        <line x1="10" y1="${base}" x2="${W - 10}" y2="${base}" class="arc-horizon"/>
        <path d="${arc}" class="arc-path"/>
        ${up ? `<path d="${arc}" class="arc-done" pathLength="100" stroke-dasharray="${(fraction * 100).toFixed(1)} 100"/>` : ""}
        ${up ? `<circle cx="${sunX.toFixed(1)}" cy="${sunY.toFixed(1)}" r="14" class="arc-glow"/><circle cx="${sunX.toFixed(1)}" cy="${sunY.toFixed(1)}" r="8" class="arc-sun"/>` : ""}
        <text x="${cx - rx}" y="${base + 22}" text-anchor="middle" class="arc-label">${fmtTime(sunrise)}</text>
        <text x="${cx + rx}" y="${base + 22}" text-anchor="middle" class="arc-label">${fmtTime(sunset)}</text>
      </svg>
      <p class="sun-status">${status}</p>
      ${goldenHTML}
      <div class="sun-row"><span>${phase.icon} ${t("moonrise")}</span><span>${moonTime(moon.rise)}</span></div>
      <div class="sun-row"><span>${phase.icon} ${t("moonset")}</span><span>${moonTime(moon.set)}</span></div>
    </div>`;
}
