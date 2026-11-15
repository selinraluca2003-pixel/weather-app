// ----- A short summary of the next 24 hours, and activity forecasts -----

const isRainCode = (code) => (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
const isSnowCode = (code) => (code >= 71 && code <= 77) || code === 85 || code === 86;
const isFogCode = (code) => code === 45 || code === 48;

// Is it raining or snowing in hour i? (rain code + a real chance of it, or a measurable amount)
function wetHour(h, i) {
  const code = h.weather_code[i];
  return h.precipitation[i] >= 0.2 || ((isRainCode(code) || isSnowCode(code)) && h.precipitation_probability[i] >= 50);
}

// ----- "Rain from 15:00. Clear skies tonight. Colder tomorrow, up to 6°." -----
function showSummary(data, nowIndex) {
  const h = data.hourly;
  const end = Math.min(nowIndex + 24, h.time.length);
  const sentences = [];

  // Rain or snow
  if (wetHour(h, nowIndex)) {
    let stop = nowIndex;
    while (stop < end && wetHour(h, stop)) stop++;
    sentences.push(stop < end ? t("sRainNowUntil", { time: fmtTime(h.time[stop]) }) : t("sRainNowLong"));
  } else {
    let start = nowIndex;
    while (start < end && !wetHour(h, start)) start++;
    if (start < end) {
      if (isSnowCode(h.weather_code[start])) {
        sentences.push(t("sSnowFrom", { time: fmtTime(h.time[start]) }));
      } else {
        let stop = start;
        while (stop < end && wetHour(h, stop)) stop++;
        sentences.push(
          stop < end
            ? t("sRainFromTo", { from: fmtTime(h.time[start]), to: fmtTime(h.time[stop]) })
            : t("sRainFrom", { time: fmtTime(h.time[start]) })
        );
      }
    }
  }

  // Thunderstorms and fog
  for (let i = nowIndex; i < end; i++) {
    if (h.weather_code[i] >= 95) {
      sentences.push(t("sStorm", { time: fmtTime(h.time[i]) }));
      break;
    }
  }
  for (let i = nowIndex; i < end; i++) {
    if (isFogCode(h.weather_code[i])) {
      sentences.push(t("sFog", { time: fmtTime(h.time[i]) }));
      break;
    }
  }

  // Sky: clear night ahead, or mostly sunny / cloudy for the next hours
  if (sentences.length === 0) {
    const nightHours = [];
    for (let i = nowIndex; i < end; i++) if (!h.is_day[i]) nightHours.push(h.cloud_cover[i]);
    const nextHours = h.cloud_cover.slice(nowIndex, Math.min(nowIndex + 8, end));
    const avg = (list) => list.reduce((s, v) => s + v, 0) / (list.length || 1);
    if (h.is_day[nowIndex]) sentences.push(avg(nextHours) < 35 ? t("sSunny") : avg(nextHours) > 70 ? t("sCloudy") : t("sDry"));
    else if (nightHours.length && avg(nightHours) < 25) sentences.push(t("sClearTonight"));
    else sentences.push(t("sDry"));
  }

  // Wind
  let gust = 0;
  for (let i = nowIndex; i < end; i++) gust = Math.max(gust, units.toKmh(h.wind_gusts_10m[i]));
  if (gust >= 50) sentences.push(t("sWindy", { v: units.showWind(gust) }));

  // Tomorrow compared with today
  if (data.daily.time.length > 1) {
    const today = data.daily.temperature_2m_max[0];
    const tomorrow = data.daily.temperature_2m_max[1];
    const diff = units.toCelsius(tomorrow) - units.toCelsius(today);
    const key = diff >= 3 ? "sWarmerTomorrow" : diff <= -3 ? "sColderTomorrow" : "sSimilarTomorrow";
    sentences.push(t(key, { t: Math.round(tomorrow) }));
  }

  document.getElementById("summary").textContent = sentences.slice(0, 3).join(" ");
}

// ----- Activity forecasts -----
// Each activity starts at 10 points and loses points for each problem. 8+ great, 6+ good, 4+ fair.
function rating(score) {
  if (score >= 8) return { key: "great", cls: "great" };
  if (score >= 6) return { key: "good", cls: "good" };
  if (score >= 4) return { key: "fair", cls: "fair" };
  return { key: "poor", cls: "poor" };
}

// The hours to judge: the rest of today's daylight, or tomorrow's if today's is nearly over
function activityWindow(data, nowIndex) {
  const h = data.hourly;
  const today = h.time[nowIndex].slice(0, 10);
  const hours = [];
  for (let i = nowIndex; i < h.time.length && h.time[i].startsWith(today); i++) {
    const hour = Number(h.time[i].slice(11, 13));
    if (hour >= 7 && hour <= 21) hours.push(i);
  }
  if (hours.length >= 3) return { label: t("actRestOfToday"), hours };

  const tomorrow = data.daily.time[1];
  const next = [];
  h.time.forEach((time, i) => {
    const hour = Number(time.slice(11, 13));
    if (time.startsWith(tomorrow) && hour >= 8 && hour <= 20) next.push(i);
  });
  return { label: t("actTomorrow"), hours: next };
}

function summarize(data, hours) {
  const h = data.hourly;
  const pick = (key) => hours.map((i) => h[key][i]);
  const avg = (list) => list.reduce((s, v) => s + v, 0) / (list.length || 1);
  const temps = pick("apparent_temperature").map((v) => units.toCelsius(v));
  return {
    feelsAvg: avg(temps),
    feelsMin: Math.min(...temps),
    feelsMax: Math.max(...temps),
    rainChance: Math.max(...pick("precipitation_probability")),
    rainTotal: pick("precipitation").reduce((s, v) => s + v, 0),
    wind: Math.max(...pick("wind_speed_10m").map((v) => units.toKmh(v))),
    gusts: Math.max(...pick("wind_gusts_10m").map((v) => units.toKmh(v))),
    humidity: avg(pick("relative_humidity_2m")),
    clouds: avg(pick("cloud_cover")),
    uv: Math.max(...pick("uv_index")),
    visibility: Math.min(...pick("visibility")),
    snow: pick("weather_code").some(isSnowCode),
    fog: pick("weather_code").some(isFogCode),
    tempMin: Math.min(...pick("temperature_2m").map((v) => units.toCelsius(v))),
  };
}

function judge(problems) {
  // problems: [[points to lose, reason key], ...] — only the ones that apply
  const score = problems.reduce((s, [points]) => s - points, 10);
  const worst = problems.sort((a, b) => b[0] - a[0])[0];
  return { ...rating(score), reason: worst ? t(worst[1]) : null };
}

function activityList(s, data) {
  const list = [];
  const air = lastAir ? lastAir.european_aqi : 0;
  const when = (cond, points, reason) => (cond ? [[points, reason]] : []);

  list.push({ icon: "🏃", name: t("running"), ...judge([
    ...when(s.feelsAvg < -5, 5, "rCold"), ...when(s.feelsAvg >= -5 && s.feelsAvg < 3, 2, "rCold"),
    ...when(s.feelsAvg > 28, 5, "rHot"), ...when(s.feelsAvg > 23 && s.feelsAvg <= 28, 2, "rHot"),
    ...when(s.rainChance >= 70, 4, "rRain"), ...when(s.rainChance >= 40 && s.rainChance < 70, 2, "rRain"),
    ...when(s.gusts >= 50, 3, "rWind"), ...when(air > 60, 3, "rAir"), ...when(s.snow, 2, "rSnow"),
  ]) });

  list.push({ icon: "🚴", name: t("cycling"), ...judge([
    ...when(s.feelsAvg < 0, 5, "rCold"), ...when(s.feelsAvg >= 0 && s.feelsAvg < 7, 2, "rCold"),
    ...when(s.feelsAvg > 30, 4, "rHot"),
    ...when(s.rainChance >= 60, 4, "rRain"), ...when(s.rainChance >= 30 && s.rainChance < 60, 2, "rRain"),
    ...when(s.wind >= 30 || s.gusts >= 50, 4, "rWind"), ...when(s.wind >= 20 && s.wind < 30, 2, "rWind"),
    ...when(s.tempMin <= 1 && s.rainTotal > 0, 4, "rIce"), ...when(s.snow, 4, "rSnow"),
  ]) });

  list.push({ icon: "👕", name: t("laundry"), ...judge([
    ...when(s.rainChance >= 50, 6, "rRain"), ...when(s.rainChance >= 25 && s.rainChance < 50, 3, "rRain"),
    ...when(s.humidity > 85, 4, "rHumid"), ...when(s.humidity > 70 && s.humidity <= 85, 2, "rHumid"),
    ...when(s.feelsAvg < 5, 2, "rCold"), ...when(s.clouds > 80, 1, "rClouds"),
  ]) });

  list.push({ icon: "🧺", name: t("outdoors"), ...judge([
    ...when(s.feelsAvg < 8, 4, "rCold"), ...when(s.feelsAvg >= 8 && s.feelsAvg < 14, 2, "rCold"),
    ...when(s.feelsAvg > 31, 4, "rHot"),
    ...when(s.rainChance >= 50, 5, "rRain"), ...when(s.rainChance >= 25 && s.rainChance < 50, 2, "rRain"),
    ...when(s.gusts >= 45, 3, "rWind"), ...when(air > 60, 2, "rAir"),
  ]) });

  list.push({ icon: "🚗", name: t("driving"), ...judge([
    ...when(s.tempMin <= 1 && s.rainTotal > 0, 5, "rIce"), ...when(s.snow, 5, "rSnow"),
    ...when(s.fog || s.visibility < 1000, 4, "rFog"), ...when(s.rainTotal >= 10, 3, "rHeavyRain"),
    ...when(s.gusts >= 70, 3, "rWind"),
  ]) });

  // Stargazing: tonight's dark hours
  const night = [];
  data.hourly.time.forEach((time, i) => {
    if (i >= weatherNow.index && i < weatherNow.index + 24 && !data.hourly.is_day[i]) night.push(i);
  });
  if (night.length) {
    const clouds = night.map((i) => data.hourly.cloud_cover[i]);
    const avgClouds = clouds.reduce((a, b) => a + b, 0) / clouds.length;
    const moon = moonPhase();
    list.push({ icon: "🔭", name: t("stargazing"), label: t("actTonight"), ...judge([
      ...when(avgClouds > 70, 7, "rClouds"), ...when(avgClouds > 35 && avgClouds <= 70, 4, "rClouds"),
      ...when(night.some((i) => isFogCode(data.hourly.weather_code[i])), 4, "rFog"),
      ...when(moon.lit > 70, 3, "rMoon"), ...when(moon.lit > 40 && moon.lit <= 70, 1, "rMoon"),
    ]) });
  }
  return list;
}

// "Warm coat · take an umbrella"
function whatToWear(s) {
  let clothes;
  if (s.feelsMin < 0) clothes = t("wearWinter");
  else if (s.feelsAvg < 8) clothes = t("wearWarm");
  else if (s.feelsAvg < 15) clothes = t("wearJacket");
  else if (s.feelsAvg < 22) clothes = t("wearLayer");
  else clothes = t("wearTshirt");
  const extras = [];
  if (s.rainChance >= 50) extras.push(t("wearUmbrella"));
  if (s.uv >= 5) extras.push(t("wearSun"));
  return [clothes, ...extras].join(" · ");
}

function showActivities(data, nowIndex) {
  const box = document.getElementById("activities");
  const win = activityWindow(data, nowIndex);
  if (!win.hours.length) {
    box.innerHTML = "";
    return;
  }
  const s = summarize(data, win.hours);
  const cards = activityList(s, data)
    .map(
      (a) => `
      <div class="activity">
        <span class="act-icon">${a.icon}</span>
        <div class="act-text">
          <strong>${a.name}</strong>
          <small>${a.label ? a.label + " · " : ""}${a.reason || t("rIdeal")}</small>
        </div>
        <span class="act-rating ${a.cls}">${t(a.key)}</span>
      </div>`
    )
    .join("");

  box.innerHTML = `
    <p class="act-window">${win.label}</p>
    <div class="activity wear">
      <span class="act-icon">🧥</span>
      <div class="act-text"><strong>${t("wear")}</strong><small>${whatToWear(s)}</small></div>
    </div>
    ${cards}`;
}
