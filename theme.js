// ----- Theme: light, dark or automatic (follows the phone/PC setting) -----
const themeButton = document.getElementById("theme-btn");
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

// "auto", "light" or "dark"
function themeChoice() {
  const saved = store.get("theme");
  return saved === "light" || saved === "dark" ? saved : "auto";
}

function applyTheme() {
  const choice = themeChoice();
  const theme = choice === "auto" ? (systemDark.matches ? "dark" : "light") : choice;
  document.documentElement.setAttribute("data-theme", theme);
  themeButton.textContent = theme === "dark" ? "☀️" : "🌙";
  // The phone's status bar color
  document.querySelector('meta[name="theme-color"]').setAttribute("content", theme === "dark" ? "#05070f" : "#4facfe");
}

function setTheme(choice) {
  store.set("theme", choice === "auto" ? null : choice); // "auto" = nothing saved
  applyTheme();
}

applyTheme();
systemDark.addEventListener("change", applyTheme); // phone switched to dark mode at sunset, for example

// The round button switches between light and dark
themeButton.addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  setTheme(isDark ? "light" : "dark");
  if (typeof renderSettings === "function") renderSettings();
});
