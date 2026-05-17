export function initHeroTraceField({ canvasSelector = ".hero__trace-field" } = {}) {
  const canvas = document.querySelector(canvasSelector);
  const ctx = canvas?.getContext?.("2d");
  const hero = canvas?.closest?.(".hero");
  if (!canvas || !ctx || !hero) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const anchors = [
    { x: 0.06, y: 0.34 },
    { x: 0.14, y: 0.68 },
    { x: 0.22, y: 0.18 },
    { x: 0.32, y: 0.42 },
    { x: 0.41, y: 0.72 },
    { x: 0.5, y: 0.26 },
    { x: 0.58, y: 0.58 },
    { x: 0.69, y: 0.2 },
    { x: 0.78, y: 0.48 },
    { x: 0.87, y: 0.75 },
    { x: 0.94, y: 0.31 },
    { x: 0.73, y: 0.82 },
  ];
  const edges = [
    [0, 2], [0, 3], [1, 3], [1, 4], [2, 5], [3, 5], [3, 6],
    [4, 6], [4, 11], [5, 7], [5, 8], [6, 8], [7, 10], [8, 10],
    [8, 9], [9, 11],
  ];
  const paths = [
    [0, 3, 5, 8, 10],
    [2, 5, 6, 4, 11],
    [1, 3, 6, 8, 9],
  ];

  let width = 0;
  let height = 0;
  let dpr = 1;
  let rafId = 0;
  let visible = true;
  let pointer = { x: 0, y: 0, active: false };

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

  function projectedNodes(time) {
    return anchors.map((node, index) => {
      const drift = reduced ? 0 : Math.sin(time * 0.00028 + index * 1.73) * 8;
      let x = node.x * width + drift;
      let y = node.y * height + Math.cos(time * 0.00022 + index * 1.11) * 6;

      if (pointer.active) {
        const dx = pointer.x - x;
        const dy = pointer.y - y;
        const distance = Math.hypot(dx, dy);
        const radius = Math.min(210, Math.max(130, width * 0.16));
        if (distance > 1 && distance < radius) {
          const pull = (1 - distance / radius) * 18;
          x += (dx / distance) * pull;
          y += (dy / distance) * pull;
        }
      }

      return { x, y };
    });
  }

  function pointOnPath(nodes, path, progress) {
    const segments = [];
    let total = 0;
    for (let index = 0; index < path.length - 1; index += 1) {
      const from = nodes[path[index]];
      const to = nodes[path[index + 1]];
      const length = Math.hypot(to.x - from.x, to.y - from.y);
      segments.push({ from, to, length });
      total += length;
    }

    let target = progress * total;
    for (const segment of segments) {
      if (target <= segment.length) {
        const ratio = segment.length ? target / segment.length : 0;
        return {
          x: segment.from.x + (segment.to.x - segment.from.x) * ratio,
          y: segment.from.y + (segment.to.y - segment.from.y) * ratio,
          from: segment.from,
        };
      }
      target -= segment.length;
    }

    const last = nodes[path[path.length - 1]];
    return { x: last.x, y: last.y, from: last };
  }

  function draw(time) {
    const dark = isDark();
    const nodes = projectedNodes(time);
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const fade = 1 - Math.min(0.72, window.scrollY / Math.max(1, height * 0.85));
    ctx.globalAlpha = fade;

    edges.forEach(([fromIndex, toIndex], index) => {
      const from = nodes[fromIndex];
      const to = nodes[toIndex];
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.lineWidth = index % 3 === 0 ? 1.2 : 0.8;
      ctx.strokeStyle = dark ? "rgba(142, 184, 255, 0.18)" : "rgba(0, 87, 190, 0.13)";
      ctx.setLineDash(index % 4 === 0 ? [5, 12] : []);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    paths.forEach((path, index) => {
      const progress = reduced ? 0.58 : (time * 0.0001 + index * 0.29) % 1;
      const point = pointOnPath(nodes, path, progress);
      const from = point.from;
      const accent = index === 1
        ? (dark ? "rgba(150, 92, 255, 0.62)" : "rgba(102, 45, 210, 0.4)")
        : (dark ? "rgba(112, 166, 255, 0.62)" : "rgba(0, 98, 220, 0.42)");

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(point.x, point.y);
      ctx.lineWidth = 1.45;
      ctx.strokeStyle = accent;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(point.x, point.y, dark ? 3.2 : 2.8, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.shadowBlur = dark ? 18 : 10;
      ctx.shadowColor = accent;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    nodes.forEach((node, index) => {
      const emphasized = index % 4 === 0;
      ctx.beginPath();
      ctx.arc(node.x, node.y, emphasized ? 2.3 : 1.55, 0, Math.PI * 2);
      ctx.fillStyle = dark ? "rgba(236, 244, 255, 0.5)" : "rgba(18, 24, 38, 0.32)";
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
