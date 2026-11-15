// ----- Settings page -----

// A row of buttons where exactly one is selected
function segmented(setting, options, current) {
  const buttons = options
    .map(
      ([value, label]) =>
        `<button type="button" role="radio" aria-checked="${value === current}" data-setting="${setting}" data-value="${value}">${escapeHTML(label)}</button>`
    )
    .join("");
  return `<div class="seg" role="radiogroup">${buttons}</div>`;
}

function settingRow(title, control, hint = "") {
  return `
    <div class="setting">
      <h2 class="setting-title">${title}</h2>
      ${control}
      ${hint ? `<p class="setting-hint">${hint}</p>` : ""}
    </div>`;
}

function renderSettings() {
  const list = document.getElementById("settings-list");
  if (!list) return;

  const savedStart = validPlace(store.get("startCity"));
  const startCity = savedStart || currentPlace || DEFAULT_PLACE;
  const startOptions = [
    ["last", t("startLast")],
    ["fixed", t("startFixed", { city: startCity.name })],
  ];
  // A start city is saved, but you're looking at a different one: offer to switch to it
  if (savedStart && currentPlace && favKey(savedStart) !== favKey(currentPlace)) {
    startOptions.push(["current", t("startFixed", { city: currentPlace.name })]);
  }

  list.innerHTML =
    settingRow(t("language"), segmented("lang", [["en", "English"], ["ro", "Română"]], lang)) +
    settingRow(t("theme"), segmented("theme", [["auto", t("themeAuto")], ["light", t("themeLight")], ["dark", t("themeDark")]], themeChoice())) +
    settingRow(t("units"), segmented("units", [["metric", "°C · km/h"], ["imperial", "°F · mph"]], units.system)) +
    settingRow(t("clock"), segmented("clock", [["24", t("clock24")], ["12", t("clock12")]], String(store.get("clock", "24")))) +
    settingRow(t("startCity"), segmented("start", startOptions, savedStart ? "fixed" : "last"), t("startHint")) +
    settingRow(t("motion"), segmented("motion", [["on", t("on")], ["off", t("off")]], store.get("motion", true) === false ? "off" : "on"), t("motionHint")) +
    settingRow(t("about"), "", t("aboutText"));
}

// Redraw everything that shows text or times, without downloading again
function redrawAll() {
  applyStaticText();
  showTodayDate();
  if (latestWeather && currentPlace) renderWeather(currentPlace, latestWeather, { ...latestMeta, redraw: true });
  if (lastAir) renderAir(lastAir);
  if (lastUpdateTime) markUpdated(lastUpdateTime);
  renderFavoriteCards();
  if (typeof refreshRadarLabel === "function") refreshRadarLabel();
  renderSettings();
}

document.getElementById("settings-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-setting]");
  if (!button) return;
  const value = button.dataset.value;

  switch (button.dataset.setting) {
    case "lang":
      setLanguage(value);
      redrawAll();
      break;
    case "theme":
      setTheme(value);
      break;
    case "units":
      if (value !== units.system) setUnits(value);
      break;
    case "clock":
      store.set("clock", value);
      redrawAll();
      break;
    case "start":
      if (value === "last") store.set("startCity", null);
      else if (value === "current") store.set("startCity", currentPlace);
      else store.set("startCity", validPlace(store.get("startCity")) || currentPlace || DEFAULT_PLACE);
      break;
    case "motion":
      store.set("motion", value === "on");
      applyMotionSetting();
      refreshWeatherFx();
      break;
  }
  renderSettings();
  // Keep keyboard focus on the same option after the redraw
  const again = document.querySelector(`[data-setting="${button.dataset.setting}"][data-value="${value}"]`);
  if (again) again.focus();
});

document.getElementById("settings-btn").addEventListener("click", () => {
  if (currentPageId() === "page-settings") return;
  renderSettings();
  openSubPage("page-settings");
});
