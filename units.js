// ----- Units: °C / °F -----
const units = {
  system: store.get("units") === "imperial" ? "imperial" : "metric",
  isImperial() { return this.system === "imperial"; },
  // extra text added to every weather request
  param() { return this.isImperial() ? "&temperature_unit=fahrenheit&wind_speed_unit=mph" : ""; },
  windUnit() { return this.isImperial() ? "mph" : "km/h"; },
  // converters used by the alert thresholds (they work in °C and km/h)
  toKmh(value) { return this.isImperial() ? value * 1.609 : value; },
  toCelsius(value) { return this.isImperial() ? ((value - 32) * 5) / 9 : value; },
  showWind(kmh) {
    return this.isImperial() ? Math.round(kmh / 1.609) + " mph" : Math.round(kmh) + " km/h";
  },
  visibility(meters) {
    const km = meters / 1000;
    return this.isImperial() ? `${Math.round(km / 1.609)} mi` : `${Math.round(km)} km`;
  },
};

const unitButton = document.getElementById("unit-btn");

function setUnits(system) {
  units.system = system;
  store.set("units", system);
  unitButton.textContent = units.isImperial() ? "°F" : "°C";
  // Reload the current city and the favorites in the new units
  refreshWeather();
  if (typeof renderSettings === "function") renderSettings();
}

unitButton.textContent = units.isImperial() ? "°F" : "°C";
unitButton.addEventListener("click", () => setUnits(units.isImperial() ? "metric" : "imperial"));
