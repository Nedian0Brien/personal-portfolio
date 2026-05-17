export function initHeroParallax() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  const hero = document.querySelector(".hero");
  if (!hero) return;

  const intro = hero.querySelector(".hero__intro");
  const scrollCue = hero.querySelector(".hero__scroll-cue");

  let ticking = false;
  function update() {
    const y = window.scrollY;
    const max = hero.offsetHeight || 1;
    const progress = Math.min(1, Math.max(0, y / max));

    if (intro) {
      intro.style.transform = `translate3d(0, ${y * 0.14}px, 0)`;
      intro.style.opacity = String(1 - progress * 0.9);
    }

    if (scrollCue) {
      const cueProgress = Math.min(1, Math.max(0, y / Math.max(1, window.innerHeight * 0.18)));
      scrollCue.style.pointerEvents = cueProgress >= 0.95 ? "none" : "";
      hero.style.setProperty("--hero-cue-opacity", String(0.6 * (1 - cueProgress)));
      hero.style.setProperty("--hero-cue-y", `${(cueProgress * 14).toFixed(2)}px`);
    }

    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      requestAnimationFrame(update);
      ticking = true;
    },
    { passive: true },
  );
  update();
}

export function initCoverSpotlight() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const covers = document.querySelectorAll(".cover");
  if (!covers.length) return;

  covers.forEach((cover) => {
    let rafId = 0;
    let pendingX = 0;
    let pendingY = 0;

    const apply = () => {
      cover.style.setProperty("--mx", `${pendingX.toFixed(2)}px`);
      cover.style.setProperty("--my", `${pendingY.toFixed(2)}px`);
      rafId = 0;
    };

    cover.addEventListener(
      "mousemove",
      (event) => {
        const rect = cover.getBoundingClientRect();
        pendingX = event.clientX - rect.left - rect.width / 2;
        pendingY = event.clientY - rect.top - rect.height / 2;
        if (!rafId) rafId = requestAnimationFrame(apply);
      },
      { passive: true },
    );
    cover.addEventListener("mouseenter", () => {
      cover.style.setProperty("--m-active", "1");
    });
    cover.addEventListener("mouseleave", () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      cover.style.setProperty("--mx", "0px");
      cover.style.setProperty("--my", "0px");
      cover.style.setProperty("--m-active", "0");
    });
  });
}
