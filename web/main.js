import { initCoverSpotlight, initHeroParallax } from "./src/site/hero-effects.js";
import { initSectionNavSpy } from "./src/site/nav-spy.js";
import { initPaperCoverPreview } from "./src/site/pdf-preview.js";
import { initBrowserChromeInset } from "./src/site/project-browser-chrome.js";
import { initProjectBackground } from "./src/site/project-background.js";
import { initProjectCarousel, initProjectSceneActivation } from "./src/site/project-carousel.js";
import { initProjectPreviewFit } from "./src/site/project-preview-fit.js";
import { initProjectWheelSnap } from "./src/site/project-wheel-snap.js";
import { initScrollReveal } from "./src/site/reveal.js";
import { initThemeToggle } from "./src/site/theme.js";

initThemeToggle();
initScrollReveal();
initSectionNavSpy({
  linkSelector: '#topnavNav a[href^="#"]',
  rootMargin: "-56px 0px -40% 0px",
});
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
