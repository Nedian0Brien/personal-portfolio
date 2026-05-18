const CHROME_COLORS = {
  "theme-blue": "#006be8",
  "theme-red": "#f04a0f",
  "theme-yellow": "#f5aa00",
  "theme-green": "#16865a",
  "theme-purple": "#4f2fc7",
  "theme-pink": "#bb55d7",
  "theme-orange": "#f05a16",
};

export function initProjectBackground() {
  const stage = document.querySelector(".proj-bg-stage");
  if (!stage) return;

  const scenes = Array.from(document.querySelectorAll("#project .proj-scene:not(.proj-scene--grid)"));
  const layers = Array.from(stage.querySelectorAll(".proj-bg-layer")).slice(0, scenes.length);
  if (!layers.length || layers.length !== scenes.length) return;

  const mq = window.matchMedia("(min-width: 981px)");
  const cssWipeMq = window.matchMedia("(max-width: 980px)");
  const root = document.documentElement;
  let themeMeta = document.querySelector('meta[name="theme-color"]');
  if (!themeMeta) {
    themeMeta = document.createElement("meta");
    themeMeta.name = "theme-color";
    document.head.appendChild(themeMeta);
  }
  const defaultThemeColor = themeMeta.getAttribute("content") || "#ffffff";
  let active = false;
  let ticking = false;

  function supportsCssWipe() {
    return (
      cssWipeMq.matches &&
      window.CSS &&
      CSS.supports("animation-timeline: --project-bg") &&
      CSS.supports("view-timeline-name: --project-bg") &&
      CSS.supports("timeline-scope: --project-bg")
    );
  }

  function clearProjectThemeColor() {
    themeMeta.setAttribute("content", defaultThemeColor);
  }

  function themeClassForScene(scene) {
    const card = scene ? scene.querySelector(".proj-card") : null;
    const source = card || scene;
    return source ? Array.from(source.classList).find((name) => CHROME_COLORS[name]) : null;
  }

  function updateProjectThemeColor() {
    if (!root.classList.contains("device-mobile-or-tablet")) {
      clearProjectThemeColor();
      return;
    }

    const project = stage.closest("#project");
    const projectRect = project ? project.getBoundingClientRect() : null;
    if (!projectRect || projectRect.top >= window.innerHeight || projectRect.bottom <= 0) {
      clearProjectThemeColor();
      return;
    }

    const probeY = window.innerHeight - 1;
    let visibleScene = null;
    scenes.forEach((scene) => {
      const rect = scene.getBoundingClientRect();
      if (rect.top <= probeY && rect.bottom > 0) {
        visibleScene = scene;
      }
    });

    const sceneThemeClass = themeClassForScene(visibleScene);
    if (sceneThemeClass) {
      themeMeta.setAttribute("content", CHROME_COLORS[sceneThemeClass]);
      return;
    }

    let visibleLayer = layers[0];
    layers.forEach((layer, index) => {
      if (index === 0 || layer.getBoundingClientRect().top <= probeY) {
        visibleLayer = layer;
      }
    });

    const themeClass = Array.from(visibleLayer.classList).find((name) => CHROME_COLORS[name]);
    if (themeClass) themeMeta.setAttribute("content", CHROME_COLORS[themeClass]);
  }

  function update() {
    ticking = false;
    updateProjectThemeColor();
    if (!active) return;

    const viewportHeight = window.innerHeight;
    for (let index = 0; index < layers.length; index += 1) {
      if (index === 0) {
        layers[index].style.transform = "translate3d(0, 0, 0)";
        continue;
      }
      const rect = scenes[index].getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, 1 - rect.top / viewportHeight));
      layers[index].style.transform = `translate3d(0, ${((1 - progress) * 100).toFixed(3)}%, 0)`;
    }
  }

  function schedule() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  function activate(on) {
    active = on;
    if (on) {
      schedule();
    } else if (supportsCssWipe()) {
      layers.forEach((layer) => {
        layer.style.transform = "";
      });
    } else {
      layers.forEach((layer, index) => {
        layer.style.transform = index === 0 ? "translate3d(0, 0, 0)" : "translate3d(0, 100%, 0)";
      });
    }
  }

  const shouldUseJs = () => mq.matches || !supportsCssWipe();
  const updateMode = () => activate(shouldUseJs());

  updateMode();
  if (mq.addEventListener) mq.addEventListener("change", updateMode);
  else if (mq.addListener) mq.addListener(updateMode);
  if (cssWipeMq.addEventListener) cssWipeMq.addEventListener("change", updateMode);
  else if (cssWipeMq.addListener) cssWipeMq.addListener(updateMode);

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
}
