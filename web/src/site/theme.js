export function initThemeToggle({
  buttonId = "themeBtn",
  sunId = "themeSun",
  moonId = "themeMoon",
  storageKey = "portfolio-theme",
} = {}) {
  const root = document.documentElement;
  const btn = document.getElementById(buttonId);
  const sun = document.getElementById(sunId);
  const moon = document.getElementById(moonId);
  const themeColor = document.getElementById("themeColor") || document.querySelector('meta[name="theme-color"]');
  if (!btn || !sun || !moon) return;

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      // Storage can be unavailable in private or restricted browsing modes.
    }
    const dark = theme === "dark";
    sun.style.display = dark ? "none" : "block";
    moon.style.display = dark ? "block" : "none";
    if (themeColor) {
      themeColor.setAttribute("content", dark ? "#101010" : "#ffffff");
    }
  }

  let initial = null;
  try {
    initial = localStorage.getItem(storageKey);
  } catch (error) {
    initial = null;
  }
  if (!initial) {
    initial =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  setTheme(initial);
  btn.addEventListener("click", () => {
    setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });
}
