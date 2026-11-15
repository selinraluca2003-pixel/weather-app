// ----- Day detail page (tap a day in the 14-day list) -----
const dayPage = { index: 0 };

function renderDayPage() {
  const data = latestWeather;
  if (!data) return;
  const d = dayPage.index;
  const daily = data.daily;
  const date = daily.time[d];

  const longDate = capitalize(new Date(date + "T12:00").toLocaleDateString(locale(), { weekday: "long", day: "numeric", month: "long" }));
  document.getElementById("day-title").textContent = d === 0 ? `${t("today")} · ${longDate}` : longDate;

  const code = daily.weather_code[d];
  document.getElementById("day-icon").innerHTML = weatherIcon(code, 1);
  document.getElementById("day-range").textContent = t("dayHiLo", {
    max: Math.round(daily.temperature_2m_max[d]),
    min: Math.round(daily.temperature_2m_min[d]),
  });
  document.getElementById("day-condition").textContent = weatherText(code);

  const uv = daily.uv_index_max[d];
  const daylight = daily.daylight_duration[d];
  const sunshine = daily.sunshine_duration[d];
  const direction = daily.wind_direction_10m_dominant[d];

  document.getElementById("day-grid").innerHTML =
    detailCard(t("rain"), `${daily.precipitation_sum[d].toFixed(1)} mm`, t("dayRainSub", { p: daily.precipitation_probability_max[d], h: Math.round(daily.precipitation_hours[d]) })) +
    detailCard(t("wind"), `${windArrow(direction)} ${Math.round(daily.wind_speed_10m_max[d])} ${units.windUnit()}`, t("dayWindSub", { dir: compass(direction), g: Math.round(daily.wind_gusts_10m_max[d]) })) +
    detailCard(t("feelsLike"), t("dayFeelsValue", { max: Math.round(daily.apparent_temperature_max[d]), min: Math.round(daily.apparent_temperature_min[d]) }), t("dayFeelsSub")) +
    detailCard(t("uvIndex"), uv.toFixed(1), uvLabel(uv)) +
    detailCard(t("sunriseSunset"), `${fmtTime(daily.sunrise[d])} – ${fmtTime(daily.sunset[d])}`, t("daylight", { d: formatDuration(daylight) }), true) +
    detailCard(t("sunshine"), formatDuration(sunshine), t("sunshineSub", { pct: daylight ? Math.round((sunshine / daylight) * 100) : 0 }));

  // The 24 hours of this day: chart + tappable list
  const start = data.hourly.time.findIndex((time) => time.startsWith(date));
  if (start !== -1) {
    const end = Math.min(start + 24, data.hourly.time.length);
    drawTempChart("chart-day", data, start, end, weatherNow.index);
    fillHourList("day-hours", data, start, end, weatherNow.index, false);
  }

  document.getElementById("day-prev").disabled = d <= 0;
  document.getElementById("day-next").disabled = d >= daily.time.length - 1;
}

function openDayPage(index) {
  if (!latestWeather || Number.isNaN(index)) return;
  dayPage.index = index;
  renderDayPage();
  openSubPage("page-day");
}

// step = -1 or +1. Returns false at the ends of the forecast.
function changeDay(step) {
  const last = latestWeather.daily.time.length - 1;
  const next = Math.min(last, Math.max(0, dayPage.index + step));
  if (next === dayPage.index) return false;
  dayPage.index = next;
  renderDayPage();
  window.scrollTo(0, 0);
  return true;
}

document.addEventListener("click", (event) => {
  const row = event.target.closest(".day-row");
  if (row) openDayPage(Number(row.dataset.d));
});

document.getElementById("day-prev").addEventListener("click", () => changeDay(-1));
document.getElementById("day-next").addEventListener("click", () => changeDay(1));
