import { initCoverSpotlight, initHeroParallax, initHeroTraceField } from "./src/site/hero-effects.js";
import { initSectionNavSpy } from "./src/site/nav-spy.js";
import { initPaperCoverPreview } from "./src/site/pdf-preview.js";
import { initBrowserChromeInset } from "./src/site/project-browser-chrome.js";
import { initProjectBackground } from "./src/site/project-background.js";
import { initProjectCarousel, initProjectSceneActivation } from "./src/site/project-carousel.js";
import { initProjectPreviewFit } from "./src/site/project-preview-fit.js";
import { initProjectWheelSnap } from "./src/site/project-wheel-snap.js";
import { initScrollReveal } from "./src/site/reveal.js";
import { initThemeToggle } from "./src/site/theme.js";

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

if (window.location.hash === "#hero-details") {
  history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
}

initThemeToggle();
initScrollReveal();
initSectionNavSpy({
  linkSelector: '#topnavNav a[href^="#"]',
  activationRatio: 0.32,
  minActivationOffset: 96,
});
initHeroTraceField();
initHeroParallax();
initCoverSpotlight();

if (import.meta.env?.DEV) {
  import("/src/react-grab-dev.js");
}

initPaperCoverPreview();
initBrowserChromeInset();
initProjectCarousel();
initProjectSceneActivation();
initProjectBackground();
initProjectPreviewFit();
initProjectWheelSnap();
