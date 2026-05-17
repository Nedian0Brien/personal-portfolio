export function initHeroTraceField({ canvasSelector = ".hero__trace-field" } = {}) {
  const canvas = document.querySelector(canvasSelector);
  const ctx = canvas?.getContext?.("2d");
  const hero = canvas?.closest?.(".hero");
  if (!canvas || !ctx || !hero) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const seed = 90217;
  const layers = [
    { count: 18, radius: 1.15, drift: 7, depth: 0.55 },
    { count: 24, radius: 0.95, drift: 12, depth: 0.8 },
    { count: 28, radius: 0.7, drift: 18, depth: 1 },
  ];
  const contourCenters = [
    { x: 0.2, y: 0.28, rx: 0.26, ry: 0.16, phase: 0.2 },
    { x: 0.78, y: 0.34, rx: 0.3, ry: 0.18, phase: 1.9 },
    { x: 0.5, y: 0.72, rx: 0.34, ry: 0.13, phase: 3.1 },
  ];

  let width = 0;
  let height = 0;
  let dpr = 1;
  let rafId = 0;
  let visible = true;
  let pointer = { x: 0, y: 0, active: false };
  let points = [];

  const isDark = () => root.getAttribute("data-theme") === "dark";

  function random(seedValue) {
    const value = Math.sin(seedValue * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  }

  function makePoints() {
    const nextPoints = [];
    let cursor = seed;
    layers.forEach((layer, layerIndex) => {
      const scale = width < 640 ? 0.58 : 1;
      const count = Math.max(10, Math.round(layer.count * scale));
      for (let index = 0; index < count; index += 1) {
        cursor += 1;
        const x = random(cursor);
        cursor += 1;
        const y = random(cursor);
        cursor += 1;
        nextPoints.push({
          x,
          y,
          depth: layer.depth,
          drift: layer.drift,
          layer: layerIndex,
          phase: random(cursor) * Math.PI * 2,
          radius: layer.radius,
        });
      }
    });
    points = nextPoints;
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
    makePoints();
    draw(performance.now());
  }

  function textFade(x, y) {
    const nx = x / Math.max(1, width);
    const ny = y / Math.max(1, height);
    const dx = Math.abs(nx - 0.5) / 0.34;
    const dy = Math.abs(ny - 0.48) / 0.24;
    const distance = Math.max(dx, dy);
    if (distance < 0.72) return 0.14;
    if (distance < 1.08) return 0.14 + (distance - 0.72) * 1.55;
    return 1;
  }

  function projectedPoint(point, time) {
    const slowTime = reduced ? 0 : time * 0.00006;
    let x = point.x * width + Math.sin(slowTime + point.phase) * point.drift;
    let y = point.y * height + Math.cos(slowTime * 0.82 + point.phase * 1.4) * point.drift * 0.72;

    if (pointer.active && !reduced) {
      const dx = pointer.x - x;
      const dy = pointer.y - y;
      const distance = Math.hypot(dx, dy);
      const radius = Math.min(260, Math.max(150, width * 0.18));
      if (distance > 1 && distance < radius) {
        const pull = (1 - distance / radius) * 7 * point.depth;
        x -= (dx / distance) * pull;
        y -= (dy / distance) * pull;
      }
    }

    return { x, y };
  }

  function drawContour(center, contourIndex, time, dark) {
    const slowTime = reduced ? 0 : time * 0.000045;
    const cx = (center.x + Math.sin(slowTime + center.phase) * 0.018) * width;
    const cy = (center.y + Math.cos(slowTime * 0.9 + center.phase) * 0.016) * height;
    const rx = center.rx * width * (0.72 + contourIndex * 0.18);
    const ry = center.ry * height * (0.72 + contourIndex * 0.18);
    const steps = 96;

    ctx.beginPath();
    for (let index = 0; index <= steps; index += 1) {
      const angle = (index / steps) * Math.PI * 2;
      const wobble = 1 + Math.sin(angle * 3 + center.phase + slowTime * 4) * 0.025;
      const x = cx + Math.cos(angle) * rx * wobble;
      const y = cy + Math.sin(angle) * ry * wobble;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    const alpha = (dark ? 0.08 : 0.06) * (1 - contourIndex * 0.16);
    ctx.lineWidth = contourIndex === 0 ? 0.9 : 0.65;
    ctx.strokeStyle = dark
      ? `rgba(120, 160, 230, ${alpha})`
      : `rgba(42, 91, 160, ${alpha})`;
    ctx.stroke();
  }

  function draw(time) {
    const dark = isDark();
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const fade = 1 - Math.min(0.72, window.scrollY / Math.max(1, height * 0.85));
    ctx.globalAlpha = fade;

    contourCenters.forEach((center) => {
      for (let contourIndex = 0; contourIndex < 3; contourIndex += 1) {
        drawContour(center, contourIndex, time, dark);
      }
    });

    const projected = points.map((point) => ({
      ...point,
      ...projectedPoint(point, time),
    }));

    projected.forEach((from, index) => {
      for (let nextIndex = index + 1; nextIndex < projected.length; nextIndex += 1) {
        const to = projected[nextIndex];
        if (from.layer !== to.layer) continue;
        const distance = Math.hypot(from.x - to.x, from.y - to.y);
        const maxDistance = width < 640 ? 74 : 110;
        if (distance > maxDistance) continue;
        const alpha = (1 - distance / maxDistance) * (dark ? 0.045 : 0.035) * textFade((from.x + to.x) / 2, (from.y + to.y) / 2);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.lineWidth = 0.55;
        ctx.strokeStyle = dark
          ? `rgba(146, 177, 232, ${alpha})`
          : `rgba(36, 82, 148, ${alpha})`;
        ctx.stroke();
      }
    });

    projected.forEach((point) => {
      const alpha = (dark ? 0.22 : 0.18) * point.depth * textFade(point.x, point.y);
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      ctx.fillStyle = dark
        ? `rgba(214, 228, 255, ${alpha})`
        : `rgba(23, 55, 108, ${alpha})`;
      ctx.fill();
    });

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

  window.addEventListener(
    "pointermove",
    (event) => {
      const rect = hero.getBoundingClientRect();
      pointer = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        active:
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom,
      };
    },
    { passive: true },
  );
  window.addEventListener("pointerleave", () => {
    pointer.active = false;
  });
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
