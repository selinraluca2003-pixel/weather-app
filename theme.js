const themeButton = document.getElementById("theme-btn");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeButton.textContent = theme === "dark" ? "☀️" : "🌙";
}

// Use the theme set by the small script in <head>
applyTheme(document.documentElement.getAttribute("data-theme") || "light");

themeButton.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);

  try {
    localStorage.setItem("theme", next);
  } catch (error) {
    console.error(error);
  }
});