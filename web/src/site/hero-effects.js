export function initHeroTraceField({ canvasSelector = ".hero__trace-field" } = {}) {
  const canvas = document.querySelector(canvasSelector);
  const ctx = canvas?.getContext?.("2d");
  const hero = canvas?.closest?.(".hero");
  if (!canvas || !ctx || !hero) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const pulseMs = 3600;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let rafId = 0;
  let visible = true;
  let sphere = { points: [], nodeIndexes: [], routes: [] };

  const isDark = () => root.getAttribute("data-theme") === "dark";

  function random(seedValue) {
    const value = Math.sin(seedValue * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  }

  function smoothstep(value) {
    const x = Math.max(0, Math.min(1, value));
    return x * x * (3 - 2 * x);
  }

  function dot3(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  function normalize3(point) {
    const length = Math.hypot(point.x, point.y, point.z) || 1;
    return {
      x: point.x / length,
      y: point.y / length,
      z: point.z / length,
    };
  }

  function slerp3(a, b, progress) {
    const dot = Math.max(-0.98, Math.min(0.98, dot3(a, b)));
    const theta = Math.acos(dot);
    const sinTheta = Math.sin(theta);
    if (sinTheta < 0.001) {
      return normalize3({
        x: a.x + (b.x - a.x) * progress,
        y: a.y + (b.y - a.y) * progress,
        z: a.z + (b.z - a.z) * progress,
      });
    }
    const fromScale = Math.sin((1 - progress) * theta) / sinTheta;
    const toScale = Math.sin(progress * theta) / sinTheta;
    return normalize3({
      x: a.x * fromScale + b.x * toScale,
      y: a.y * fromScale + b.y * toScale,
      z: a.z * fromScale + b.z * toScale,
    });
  }

  function nearestSurfacePoint(points, target, used) {
    let bestIndex = -1;
    let bestScore = -Infinity;
    points.forEach((point, index) => {
      if (used.has(index)) return;
      const score = dot3(point, target);
      if (score > bestScore) {
        bestIndex = index;
        bestScore = score;
      }
    });
    return bestIndex;
  }

  function makeSurfaceRoute(points, from, to, hopCount) {
    const route = [from];
    const used = new Set(route);
    const start = points[from];
    const end = points[to];

    for (let hop = 1; hop < hopCount; hop += 1) {
      const target = slerp3(start, end, hop / hopCount);
      const nearest = nearestSurfacePoint(points, target, used);
      if (nearest >= 0) {
        route.push(nearest);
        used.add(nearest);
      }
    }

    if (!used.has(to)) route.push(to);
    return route.filter((pointIndex, index) => index === 0 || pointIndex !== route[index - 1]);
  }

  function makePulseRoute(points, mainRoute, branchTarget, hopCount, shouldBranch, branchAt) {
    const paths = [mainRoute];
    if (shouldBranch && mainRoute.length > 4) {
      const splitIndex = Math.max(2, Math.min(mainRoute.length - 2, Math.floor(mainRoute.length * branchAt)));
      const splitNode = mainRoute[splitIndex];
      const branchRoute = makeSurfaceRoute(points, splitNode, branchTarget, Math.max(3, hopCount - 2));
      if (branchRoute.length > 2) paths.push(branchRoute);
    }
    return { paths, branchAt };
  }

  function makeSphere() {
    const mobile = width < 640;
    const count = mobile ? 168 : 260;
    const nodeCount = mobile ? 10 : 14;
    const hopCount = mobile ? 5 : 7;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const nodes = [];

    for (let index = 0; index < count; index += 1) {
      const t = count === 1 ? 0 : index / (count - 1);
      const y = 1 - t * 2;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = index * goldenAngle;
      nodes.push({
        x: Math.cos(theta) * radius,
        y,
        z: Math.sin(theta) * radius,
        size: mobile ? 1.15 + random(index + 15) * 0.6 : 1.2 + random(index + 15) * 0.75,
        tone: random(index + 43),
      });
    }

    const nodeIndexes = [];
    for (let index = 0; index < nodeCount; index += 1) {
      const step = Math.floor((count - 18) / nodeCount);
      nodeIndexes.push(9 + index * step + Math.floor(random(index + 97) * Math.max(1, step * 0.45)));
    }

    const routes = [];
    for (let index = 0; index < nodeIndexes.length; index += 1) {
      const from = nodeIndexes[index];
      const to = nodeIndexes[(index + 3 + (index % 2)) % nodeIndexes.length];
      const alt = nodeIndexes[(index + 5) % nodeIndexes.length];
      const branchAt = 0.42 + random(index + 211) * 0.12;
      const shouldBranch = index % (mobile ? 3 : 4) === 1;
      routes.push(makePulseRoute(nodes, makeSurfaceRoute(nodes, from, to, hopCount), alt, hopCount, shouldBranch, branchAt));
      if (!mobile && index % 3 === 1) {
        routes.push(makePulseRoute(nodes, makeSurfaceRoute(nodes, from, alt, hopCount + 1), to, hopCount, false, branchAt));
      }
    }

    sphere = { points: nodes, nodeIndexes, routes };
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
    makeSphere();
    draw(performance.now());
  }

  function palette(dark) {
    return dark
      ? {
          dot: "rgba(174, 193, 226,",
          node: "rgba(222, 232, 252,",
          edge: "rgba(134, 172, 244,",
          packet: "rgba(237, 243, 255,",
        }
      : {
          dot: "rgba(24, 58, 105,",
          node: "rgba(17, 45, 91,",
          edge: "rgba(17, 90, 199,",
          packet: "rgba(13, 65, 166,",
        };
  }

  function layout() {
    const mobile = width < 640;
    return {
      cx: width * 0.5,
      cy: height * (mobile ? 0.5 : 0.52),
      radius: Math.min(width * (mobile ? 0.58 : 0.42), height * (mobile ? 0.37 : 0.43)),
      perspective: mobile ? 2.9 : 3.2,
      quietRx: width * (mobile ? 0.34 : 0.32),
      quietRy: height * (mobile ? 0.24 : 0.2),
    };
  }

  function projectPoint(point, time, still = false) {
    const specs = layout();
    const seconds = still ? 1.4 : time / 1000;
    const yaw = seconds * 0.13;
    const pitch = -0.18 + Math.sin(seconds * 0.11) * 0.08;
    const roll = Math.sin(seconds * 0.07) * 0.05;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosX = Math.cos(pitch);
    const sinX = Math.sin(pitch);
    const cosZ = Math.cos(roll);
    const sinZ = Math.sin(roll);

    let x = point.x * cosY + point.z * sinY;
    let z = -point.x * sinY + point.z * cosY;
    let y = point.y * cosX - z * sinX;
    z = point.y * sinX + z * cosX;

    const rolledX = x * cosZ - y * sinZ;
    const rolledY = x * sinZ + y * cosZ;
    x = rolledX;
    y = rolledY;

    const scale = specs.perspective / (specs.perspective - z);
    const px = specs.cx + x * specs.radius * scale;
    const py = specs.cy + y * specs.radius * scale;
    const quietX = (px - specs.cx) / Math.max(1, specs.quietRx);
    const quietY = (py - specs.cy) / Math.max(1, specs.quietRy);
    const quietDistance = Math.sqrt(quietX * quietX + quietY * quietY);
    const textFade = quietDistance < 0.75 ? 0.16 : quietDistance < 1.14 ? 0.16 + smoothstep((quietDistance - 0.75) / 0.39) * 0.84 : 1;

    return {
      x: px,
      y: py,
      z,
      scale,
      textFade,
      front: (z + 1) / 2,
      size: point.size * scale,
    };
  }

  function activePulse(time) {
    if (!sphere.routes.length) return null;
    const cycle = reduced ? 0.56 : (time % pulseMs) / pulseMs;
    const activeWindow = reduced ? 0.48 : Math.max(0, Math.min(1, (cycle - 0.08) / 0.68));
    if (!reduced && (cycle < 0.08 || cycle > 0.84)) return null;
    const startIndex = Math.floor(time / pulseMs) % sphere.routes.length;
    return {
      startIndex,
      progress: smoothstep(activeWindow),
      alpha: Math.sin(Math.PI * activeWindow),
    };
  }

  function pickPulseRoute(projected, startIndex) {
    let best = null;
    let bestScore = 0;
    const specs = layout();

    for (let offset = 0; offset < sphere.routes.length; offset += 1) {
      const routeGroup = sphere.routes[(startIndex + offset) % sphere.routes.length];
      const points = routeGroup.paths.flatMap((route) => route.map((pointIndex) => projected[pointIndex]).filter(Boolean));
      if (points.length < 2) continue;
      const visible = points.reduce((sum, point) => sum + point.textFade * (0.26 + point.front * 0.74), 0) / points.length;
      const length = routeGroup.paths.reduce((sum, route) => {
        const routePoints = route.map((pointIndex) => projected[pointIndex]).filter(Boolean);
        return sum + routePoints.reduce((routeSum, point, index) => {
          if (index === 0) return routeSum;
          const previous = routePoints[index - 1];
          return routeSum + Math.hypot(point.x - previous.x, point.y - previous.y);
        }, 0);
      }, 0);
      const distanceScore = Math.min(1, length / Math.max(1, specs.radius * 0.54));
      const score = visible * distanceScore;
      if (score > bestScore) {
        best = routeGroup;
        bestScore = score;
      }
      if (score > 0.34) return routeGroup;
    }

    return best;
  }

  function routeSegments(route, projected) {
    return route.slice(1).map((pointIndex, index) => {
      const fromIndex = route[index];
      const from = projected[fromIndex];
      const to = projected[pointIndex];
      const length = from && to ? Math.hypot(to.x - from.x, to.y - from.y) : 0;
      return { from, to, fromIndex, toIndex: pointIndex, length };
    }).filter((segment) => segment.from && segment.to && segment.length > 0.5);
  }

  function drawSegment(from, to, progress, alpha, colors, dark, active = false) {
    const textFade = Math.min(from.textFade, to.textFade);
    const depthFade = 0.28 + Math.min(from.front, to.front) * 0.72;
    const segmentAlpha = alpha * textFade * depthFade;
    if (segmentAlpha <= 0.025) return null;
    const x = from.x + (to.x - from.x) * progress;
    const y = from.y + (to.y - from.y) * progress;
    if (active) {
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(x, y);
      ctx.lineWidth = width < 640 ? 2.8 : 3.2;
      ctx.strokeStyle = `${colors.edge} ${Math.min(0.34, segmentAlpha * (dark ? 0.42 : 0.32))})`;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(x, y);
    ctx.lineWidth = active ? (width < 640 ? 1.45 : 1.75) : (width < 640 ? 0.7 : 0.85);
    ctx.strokeStyle = `${colors.edge} ${Math.min(0.95, segmentAlpha * (active ? (dark ? 1.48 : 1.08) : (dark ? 0.28 : 0.22)))})`;
    ctx.stroke();
    return { x, y, alpha: segmentAlpha };
  }

  function drawSurfacePath(route, projected, pulse, colors, dark) {
    const segments = routeSegments(route, projected);
    if (!segments.length) return new Set();
    const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
    const traveled = totalLength * pulse.progress;
    let covered = 0;
    let packet = null;
    const activeIndexes = new Set([route[0]]);

    segments.forEach((segment) => {
      drawSegment(segment.from, segment.to, 1, pulse.alpha, colors, dark, false);
    });

    for (const segment of segments) {
      const localStart = covered;
      const localEnd = covered + segment.length;
      if (traveled >= localStart) {
        const localProgress = Math.max(0, Math.min(1, (traveled - localStart) / segment.length));
        const partial = drawSegment(segment.from, segment.to, localProgress, pulse.alpha, colors, dark, true);
        if (localProgress > 0) activeIndexes.add(segment.fromIndex);
        if (localProgress >= 1) activeIndexes.add(segment.toIndex);
        if (traveled <= localEnd && partial) packet = partial;
      }
      covered = localEnd;
    }

    if (packet) {
      ctx.beginPath();
      ctx.arc(packet.x, packet.y, width < 640 ? 2.3 : 2.75, 0, Math.PI * 2);
      ctx.fillStyle = `${colors.packet} ${packet.alpha * (dark ? 0.9 : 1)})`;
      ctx.fill();
    }

    return activeIndexes;
  }

  function mergeIndexes(target, source) {
    source.forEach((pointIndex) => target.add(pointIndex));
    return target;
  }

  function drawSurfaceRoute(routeGroup, projected, pulse, colors, dark) {
    const activeIndexes = new Set();
    const [mainRoute, branchRoute] = routeGroup.paths;
    mergeIndexes(activeIndexes, drawSurfacePath(mainRoute, projected, pulse, colors, dark));

    if (branchRoute && pulse.progress > routeGroup.branchAt) {
      const branchProgress = smoothstep((pulse.progress - routeGroup.branchAt) / Math.max(0.1, 1 - routeGroup.branchAt));
      const branchAlpha = pulse.alpha * Math.min(1, (pulse.progress - routeGroup.branchAt) / 0.18) * 0.92;
      mergeIndexes(activeIndexes, drawSurfacePath(branchRoute, projected, { progress: branchProgress, alpha: branchAlpha }, colors, dark));
    }

    return activeIndexes;
  }

  function draw(time) {
    const dark = isDark();
    const colors = palette(dark);
    const projected = sphere.points.map((point) => projectPoint(point, time, reduced));
    const active = activePulse(time);

    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const fade = 1 - Math.min(0.72, window.scrollY / Math.max(1, height * 0.85));
    ctx.globalAlpha = fade;

    projected
      .map((point, index) => ({ ...point, index }))
      .sort((a, b) => a.z - b.z)
      .forEach((point) => {
        const depthAlpha = 0.16 + point.front * 0.52;
        const alpha = depthAlpha * point.textFade * (dark ? 0.82 : 0.9);
        if (alpha <= 0.02) return;
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        ctx.fillStyle = `${colors.dot} ${alpha})`;
        ctx.fill();
      });

    const activeRoute = active ? pickPulseRoute(projected, active.startIndex) : null;
    const activeIndexes = activeRoute ? drawSurfaceRoute(activeRoute, projected, active, colors, dark) : new Set();

    activeIndexes.forEach((pointIndex) => {
      const point = projected[pointIndex];
      if (!point) return;
      const radius = (width < 640 ? 2.35 : 2.8) * point.scale;
      const alpha = point.textFade * (0.42 + point.front * 0.58) * (active?.alpha || 0);
      if (alpha <= 0.03) return;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `${colors.packet} ${Math.min(0.95, alpha)})`;
      ctx.fill();
    });

    sphere.nodeIndexes.forEach((pointIndex) => {
      const point = projected[pointIndex];
      if (!point) return;
      const isActive = activeIndexes.has(pointIndex);
      const radius = (width < 640 ? 2.1 : 2.45) * point.scale * (isActive ? 1.32 : 1);
      const alpha = point.textFade * (0.34 + point.front * 0.48) * (isActive ? 1 : 0.72);
      if (alpha <= 0.02) return;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `${colors.node} ${alpha})`;
      ctx.fill();
      if (isActive) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius * 2.05, 0, Math.PI * 2);
        ctx.lineWidth = 0.85;
        ctx.strokeStyle = `${colors.edge} ${alpha * 0.28})`;
        ctx.stroke();
      }
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
