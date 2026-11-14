// ----- Units: °C / °F -----
const units = {
  system: "metric",
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
};

try {
  if (localStorage.getItem("units") === "imperial") units.system = "imperial";
} catch (error) {}

const unitButton = document.getElementById("unit-btn");
unitButton.textContent = units.isImperial() ? "°F" : "°C";

unitButton.addEventListener("click", () => {
  units.system = units.isImperial() ? "metric" : "imperial";
  unitButton.textContent = units.isImperial() ? "°F" : "°C";

  try {
    localStorage.setItem("units", units.system);
  } catch (error) {
    console.error(error);
  }

  // Reload the current city and the favorites in the new units
  if (currentPlace) getWeather(currentPlace.name, currentPlace.latitude, currentPlace.longitude);
  renderFavorites();
});