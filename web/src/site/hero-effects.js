export function initHeroTraceField({ canvasSelector = ".hero__trace-field" } = {}) {
  const canvas = document.querySelector(canvasSelector);
  const ctx = canvas?.getContext?.("2d");
  const hero = canvas?.closest?.(".hero");
  if (!canvas || !ctx || !hero) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const seed = 130271;
  const heartbeatMs = 3600;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let rafId = 0;
  let visible = true;
  let particles = [];

  const isDark = () => root.getAttribute("data-theme") === "dark";

  function random(seedValue) {
    const value = Math.sin(seedValue * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  }

  function smoothstep(value) {
    const x = Math.max(0, Math.min(1, value));
    return x * x * (3 - 2 * x);
  }

  function getCenter() {
    return {
      x: width * 0.5,
      y: height * (width < 640 ? 0.47 : 0.52),
    };
  }

  function getRadiusRange() {
    const shortSide = Math.min(width, height);
    const longSide = Math.max(width, height);
    return {
      inner: Math.max(58, shortSide * (width < 640 ? 0.13 : 0.12)),
      outer: Math.max(shortSide * 0.48, longSide * (width < 640 ? 0.58 : 0.42)),
    };
  }

  function makeParticles() {
    const nextParticles = [];
    const ringCount = width < 640 ? 6 : 7;
    const { inner, outer } = getRadiusRange();
    let cursor = seed;
    for (let ringIndex = 0; ringIndex < ringCount; ringIndex += 1) {
      const ringProgress = ringCount <= 1 ? 0 : ringIndex / (ringCount - 1);
      const radius = inner + (outer - inner) * smoothstep(ringProgress);
      const count = Math.round((width < 640 ? 72 : 132) + ringIndex * (width < 640 ? 18 : 34));
      const bandHalfWidth = (width < 640 ? 13 : 22) + ringIndex * (width < 640 ? 2.4 : 3.5);
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      for (let index = 0; index < count; index += 1) {
        cursor += 1;
        const angleJitter = (random(cursor) - 0.5) * 0.22;
        cursor += 1;
        const radiusJitter = (random(cursor) + random(cursor + 17) + random(cursor + 31) - 1.5) * bandHalfWidth;
        cursor += 1;
        nextParticles.push({
          angle: index * goldenAngle + angleJitter,
          baseRadius: radius + radiusJitter,
          depth: 0.54 + ringProgress * 0.46,
          haloOffset: radiusJitter / Math.max(1, outer - inner),
          phase: random(cursor) * Math.PI * 2,
          ringIndex,
          ringProgress,
          size: (width < 640 ? 1.18 : 1.08) + random(cursor + 1) * (width < 640 ? 1.16 : 1.18),
          twinkle: 0.78 + random(cursor + 2) * 0.22,
        });
      }
    }
    particles = nextParticles;
  }

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
    makeParticles();
    draw(performance.now());
  }

  function textFade(x, y) {
    const nx = x / Math.max(1, width);
    const ny = y / Math.max(1, height);
    const dx = Math.abs(nx - 0.5) / 0.34;
    const dy = Math.abs(ny - (width < 640 ? 0.46 : 0.5)) / 0.26;
    const distance = Math.max(dx, dy);
    if (distance < 0.68) return 0.82;
    if (distance < 1.04) return 0.82 + (distance - 0.68) * 0.5;
    return 1;
  }

  function cycleState(time) {
    if (reduced) return { cycle: 0.52, breath: 0.35 };
    const cycle = (time % heartbeatMs) / heartbeatMs;
    const pauseFade = cycle > 0.86 ? 1 - smoothstep((cycle - 0.86) / 0.14) : 1;
    return {
      cycle,
      breath: pauseFade,
    };
  }

  function waveStrength(particle, cycle, breath) {
    const delay = particle.ringProgress * 0.5 + particle.haloOffset * 0.12;
    let local = cycle - delay;
    while (local < 0) local += 1;
    if (local > 0.68) return 0;
    const pulse = Math.sin((local / 0.68) * Math.PI);
    const particleVariance = 0.88 + Math.sin(particle.phase) * 0.12;
    return smoothstep(pulse) * breath * particleVariance;
  }

  function drawParticleField(time, dark) {
    const { x: cx, y: cy } = getCenter();
    const { outer } = getRadiusRange();
    const { cycle, breath } = cycleState(time);
    const slowTime = reduced ? 0 : time * 0.00018;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, outer * 0.92);

    gradient.addColorStop(0, dark ? "rgba(76, 119, 202, 0.2)" : "rgba(45, 113, 224, 0.16)");
    gradient.addColorStop(0.46, dark ? "rgba(76, 119, 202, 0.075)" : "rgba(45, 113, 224, 0.065)");
    gradient.addColorStop(1, "rgba(45, 113, 224, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    particles.forEach((particle) => {
      const strength = waveStrength(particle, cycle, breath);
      const drift = Math.sin(slowTime + particle.phase) * (1.8 + particle.depth * 2.4);
      const outward = strength * (width < 640 ? 16 : 25) * particle.depth;
      const radialEase = Math.sin(strength * Math.PI) * (width < 640 ? 5 : 8);
      const radius = particle.baseRadius + drift + outward + radialEase;
      const angle = particle.angle + Math.sin(slowTime * 0.72 + particle.phase) * 0.006 * (1 + strength);
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const blue = dark ? "142, 182, 244" : "18, 91, 203";
      const purple = dark ? "158, 122, 235" : "96, 52, 199";
      const color = particle.ringIndex % 4 === 2 ? purple : blue;
      const alphaBase = dark ? 0.56 : 0.64;
      const alphaActive = dark ? 0.055 : 0.04;
      const alpha = (alphaBase + strength * alphaActive) * particle.depth * particle.twinkle * textFade(x, y);
      const size = particle.size * (1 + strength * 0.22);

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color}, ${alpha})`;
      ctx.fill();
    });
  }

  function draw(time) {
    const dark = isDark();
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const fade = 1 - Math.min(0.72, window.scrollY / Math.max(1, height * 0.85));
    ctx.globalAlpha = fade;

    drawParticleField(time, dark);

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
