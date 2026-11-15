// ----- Core helpers used by every other file -----

// Saved settings. Each value lives under its own key in localStorage.
// Plain text values (like "dark") are stored as-is so the early theme script in <head> can read them.
const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      try {
        return JSON.parse(raw);
      } catch (error) {
        return raw; // older plain-text values such as "dark" or "imperial"
      }
    } catch (error) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      if (value === null || value === undefined) localStorage.removeItem(key);
      else localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  },
};

// Make outside text safe before putting it into the page
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// fetch() + JSON with a time limit and one automatic retry.
// Open-Meteo answers problems with { error: true, reason: "..." }, so that counts as a failure too.
async function fetchJSON(url, { timeout = 10000, retries = 1 } = {}) {
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal });
      const data = await response.json();
      if (!response.ok || data.error) {
        const error = new Error(data.reason || "HTTP " + response.status);
        error.noRetry = response.status >= 400 && response.status < 500; // a bad request won't fix itself
        throw error;
      }
      return data;
    } catch (error) {
      if (attempt >= retries || error.noRetry || !navigator.onLine) throw error;
      await sleep(800 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }
}

// "Animations" setting: one class on <html> switches every animation off
function applyMotionSetting() {
  document.documentElement.classList.toggle("no-motion", store.get("motion", true) === false);
}
applyMotionSetting();
