export function initHeroTraceField({ canvasSelector = ".hero__trace-field" } = {}) {
  const canvas = document.querySelector(canvasSelector);
  const ctx = canvas?.getContext?.("2d");
  const hero = canvas?.closest?.(".hero");
  if (!canvas || !ctx || !hero) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let rafId = 0;
  let visible = true;

  const isDark = () => root.getAttribute("data-theme") === "dark";

  function resize() {
    const rect = hero.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    draw(performance.now());
  }

  function getCenter() {
    return {
      x: width * 0.5,
      y: height * (width < 640 ? 0.49 : 0.52),
    };
  }

  function getWaveBounds() {
    const shortSide = Math.min(width, height);
    const longSide = Math.max(width, height);
    return {
      min: Math.max(54, shortSide * (width < 640 ? 0.12 : 0.13)),
      max: Math.max(shortSide * 0.57, longSide * (width < 640 ? 0.72 : 0.5)),
    };
  }

  function smoothstep(value) {
    const x = Math.max(0, Math.min(1, value));
    return x * x * (3 - 2 * x);
  }

  function drawDottedRing({ cx, cy, radius, cycle, ringIndex, ringCount, time, dark }) {
    const position = ringCount <= 1 ? 0 : ringIndex / (ringCount - 1);
    const distance = Math.abs(position - cycle);
    const wave = smoothstep(1 - Math.min(1, distance / 0.24));
    const afterglow = smoothstep(1 - Math.min(1, Math.max(0, cycle - position) / 0.42)) * 0.28;
    const baseAlpha = dark ? 0.12 : 0.14;
    const activeAlpha = dark ? 0.34 : 0.42;
    const dotAlpha = baseAlpha + wave * activeAlpha + afterglow * (dark ? 0.12 : 0.14);
    const dotSize = (width < 640 ? 1.15 : 1.25) + wave * (width < 640 ? 1.35 : 1.55);
    const circumference = Math.PI * 2 * radius;
    const dotCount = Math.max(42, Math.round(circumference / (width < 640 ? 12 : 14)));
    const drift = reduced ? 0 : time * 0.00012;
    const color = ringIndex % 4 === 2
      ? dark
        ? "154, 118, 235"
        : "96, 52, 199"
      : dark
        ? "134, 176, 244"
        : "18, 91, 203";

    for (let index = 0; index < dotCount; index += 1) {
      const angle = (index / dotCount) * Math.PI * 2;
      const shimmer = 0.78 + Math.sin(angle * 2 - drift + ringIndex * 0.55) * 0.11 + Math.cos(angle * 5 + drift * 0.7) * 0.08;
      const ripple = 1 + Math.sin(angle * 3 + ringIndex * 0.8 + drift) * 0.006 * (0.45 + wave);
      const x = cx + Math.cos(angle) * radius * ripple;
      const y = cy + Math.sin(angle) * radius * ripple;
      ctx.beginPath();
      ctx.arc(x, y, dotSize * (0.86 + shimmer * 0.14), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color}, ${dotAlpha * shimmer})`;
      ctx.fill();
    }
  }

  function drawCenterWash(cx, cy, maxRadius, dark) {
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * 0.72);
    gradient.addColorStop(0, dark ? "rgba(82, 125, 206, 0.15)" : "rgba(44, 111, 224, 0.12)");
    gradient.addColorStop(0.36, dark ? "rgba(82, 125, 206, 0.06)" : "rgba(44, 111, 224, 0.05)");
    gradient.addColorStop(1, "rgba(44, 111, 224, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function draw(time) {
    const dark = isDark();
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const fade = 1 - Math.min(0.72, window.scrollY / Math.max(1, height * 0.85));
    ctx.globalAlpha = fade;

    const { x: cx, y: cy } = getCenter();
    const bounds = getWaveBounds();
    const heartbeatMs = 1800;
    const cycle = reduced ? 0.58 : (time % heartbeatMs) / heartbeatMs;
    const ringCount = width < 640 ? 7 : 9;

    drawCenterWash(cx, cy, bounds.max, dark);
    for (let index = 0; index < ringCount; index += 1) {
      const position = ringCount <= 1 ? 0 : index / (ringCount - 1);
      const radius = bounds.min + (bounds.max - bounds.min) * smoothstep(position);
      drawDottedRing({
        cx,
        cy,
        radius,
        cycle,
        ringIndex: index,
        ringCount,
        time,
        dark,
      });
    }

    ctx.globalAlpha = 1;
  }

  function animate(time) {
    draw(time);
    if (!reduced && visible) {
      rafId = requestAnimationFrame(animate);
    }
  }

  function start() {
    if (!reduced && !rafId) {
      rafId = requestAnimationFrame(animate);
    }
  }

  function stop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("scroll", () => draw(performance.now()), { passive: true });

  new ResizeObserver(resize).observe(hero);
  new MutationObserver(() => draw(performance.now())).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    if (visible) start();
    else stop();
  }).observe(hero);

  resize();
  if (!reduced) start();
}

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
