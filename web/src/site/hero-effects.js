export function initHeroTraceField({ canvasSelector = ".hero__trace-field" } = {}) {
  const canvas = document.querySelector(canvasSelector);
  const ctx = canvas?.getContext?.("2d");
  const hero = canvas?.closest?.(".hero");
  if (!canvas || !ctx || !hero) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const anchors = [
    { x: 0.04, y: 0.36, terminal: true },
    { x: 0.11, y: 0.68, terminal: true },
    { x: 0.2, y: 0.16, terminal: true },
    { x: 0.28, y: 0.4 },
    { x: 0.34, y: 0.62 },
    { x: 0.43, y: 0.25 },
    { x: 0.5, y: 0.5 },
    { x: 0.56, y: 0.73 },
    { x: 0.64, y: 0.2, terminal: true },
    { x: 0.7, y: 0.43 },
    { x: 0.78, y: 0.6 },
    { x: 0.86, y: 0.18, terminal: true },
    { x: 0.95, y: 0.33, terminal: true },
    { x: 0.91, y: 0.76, terminal: true },
    { x: 0.75, y: 0.84, terminal: true },
    { x: 0.52, y: 0.86, terminal: true },
    { x: 0.23, y: 0.78, terminal: true },
    { x: 0.16, y: 0.48 },
    { x: 0.66, y: 0.64 },
  ];
  const edges = [
    [0, 2], [0, 3], [0, 17], [1, 4], [1, 16], [1, 17],
    [2, 3], [2, 5], [3, 5], [3, 6], [3, 17], [4, 6],
    [4, 7], [4, 16], [5, 6], [5, 8], [5, 9], [6, 7],
    [6, 9], [6, 18], [7, 10], [7, 15], [7, 18], [8, 9],
    [8, 11], [9, 11], [9, 12], [9, 18], [10, 13], [10, 14],
    [10, 18], [11, 12], [12, 13], [13, 14], [14, 15],
    [14, 18], [15, 16], [16, 17],
  ];
  const adjacency = anchors.map(() => []);
  edges.forEach(([from, to]) => {
    adjacency[from].push(to);
    adjacency[to].push(from);
  });
  const edgeNodeIndexes = anchors
    .map((node, index) => ({ index, node }))
    .filter(({ node }) => node.terminal)
    .map(({ index }) => index);
  const internalNodeIndexes = anchors
    .map((node, index) => ({ index, node }))
    .filter(({ node }) => !node.terminal)
    .map(({ index }) => index);
  const heartbeatPeriodMs = 1800;
  const heartbeatFlowMs = 680;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let rafId = 0;
  let visible = true;
  let pointer = { x: 0, y: 0, active: false };
  let activePulse = null;

  const isDark = () => root.getAttribute("data-theme") === "dark";

  function shuffledIndexes(items) {
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function findRandomPath(start, end, { blocked = new Set() } = {}) {
    const queue = [[start]];
    const visited = new Set([start]);

    while (queue.length) {
      const path = queue.shift();
      const current = path[path.length - 1];
      if (current === end) return path;

      shuffledIndexes(adjacency[current]).forEach((next) => {
        if (blocked.has(next) && next !== end) return;
        if (visited.has(next)) return;
        visited.add(next);
        queue.push([...path, next]);
      });
    }

    return [start, end];
  }

  function chooseRandomPulseBranches() {
    const start = edgeNodeIndexes[Math.floor(Math.random() * edgeNodeIndexes.length)];
    let trunk = null;
    let split = null;

    for (const candidate of shuffledIndexes(internalNodeIndexes)) {
      const candidatePath = findRandomPath(start, candidate);
      if (candidatePath.length >= 3) {
        trunk = candidatePath;
        split = candidate;
        break;
      }
    }

    if (!trunk || split === null) {
      split = internalNodeIndexes[Math.floor(Math.random() * internalNodeIndexes.length)];
      trunk = findRandomPath(start, split);
    }

    const targets = shuffledIndexes(edgeNodeIndexes.filter((index) => index !== start));
    const maxBranches = Math.min(4, targets.length);
    const branchCount = Math.min(maxBranches, 2 + Math.floor(Math.random() * Math.max(1, maxBranches - 1)));
    const branches = targets.slice(0, branchCount).map((end, index) => {
      const path = findRandomPath(split, end, { blocked: new Set([start]) });
      const duration = heartbeatFlowMs + Math.min(180, path.length * 28);
      return {
        delay: index * 78 + Math.random() * 42,
        duration,
        path,
      };
    });

    return {
      branches,
      split,
      start,
      trunk,
      trunkDuration: 390 + Math.min(180, trunk.length * 36),
    };
  }

  function resetPulse(time, { immediate = false } = {}) {
    const nextStartTime = immediate
      ? time - 90
      : Math.max(time, activePulse.startTime + heartbeatPeriodMs);
    const burst = chooseRandomPulseBranches();
    activePulse = {
      branches: burst.branches,
      hue: Math.random() < 0.36 ? "agent" : "retrieval",
      origin: burst.start,
      split: burst.split,
      startTime: nextStartTime,
      totalDuration: burst.trunkDuration + Math.max(...burst.branches.map((branch) => branch.delay + branch.duration)),
      trunk: burst.trunk,
      trunkDuration: burst.trunkDuration,
    };
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

  function samplePath(nodes, path, fromProgress, toProgress) {
    const points = [];
    const steps = Math.max(5, Math.ceil((toProgress - fromProgress) * 34));
    for (let index = 0; index <= steps; index += 1) {
      const progress = fromProgress + (toProgress - fromProgress) * (index / steps);
      points.push(pointOnPath(nodes, path, progress));
    }
    return points;
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
      ctx.lineWidth = index % 3 === 0 ? 1.35 : 0.95;
      ctx.strokeStyle = dark ? "rgba(142, 184, 255, 0.23)" : "rgba(0, 68, 164, 0.22)";
      ctx.setLineDash(index % 4 === 0 ? [5, 12] : []);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    if (!activePulse) resetPulse(time, { immediate: true });
    if (!reduced && time >= activePulse.startTime + activePulse.totalDuration) {
      resetPulse(time);
    }

    if (reduced || time >= activePulse.startTime) {
      const elapsed = reduced
        ? activePulse.trunkDuration + heartbeatFlowMs * 0.58
        : time - activePulse.startTime;
      const origin = nodes[activePulse.origin];
      const split = nodes[activePulse.split];
      const accent = activePulse.hue === "agent"
        ? (dark ? "rgba(170, 112, 255, 0.88)" : "rgba(102, 42, 220, 0.86)")
        : (dark ? "rgba(124, 184, 255, 0.9)" : "rgba(0, 88, 216, 0.88)");
      const glow = activePulse.hue === "agent"
        ? (dark ? "rgba(170, 112, 255, 0.4)" : "rgba(102, 42, 220, 0.3)")
        : (dark ? "rgba(124, 184, 255, 0.4)" : "rgba(0, 88, 216, 0.32)");

      if (elapsed >= 0 && elapsed <= activePulse.trunkDuration + 140) {
        const rawTrunkProgress = Math.min(1, Math.max(0, elapsed / activePulse.trunkDuration));
        const trunkProgress = 1 - Math.pow(1 - rawTrunkProgress, 2.1);
        const trunkTrailStart = Math.max(0, trunkProgress - 0.28);
        const trunkTrail = samplePath(nodes, activePulse.trunk, trunkTrailStart, trunkProgress);
        const head = trunkTrail[trunkTrail.length - 1];
        const tail = trunkTrail[0];
        const gradient = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
        gradient.addColorStop(0, dark ? "rgba(255, 255, 255, 0)" : "rgba(255, 255, 255, 0)");
        gradient.addColorStop(0.42, glow);
        gradient.addColorStop(1, accent);

        ctx.beginPath();
        trunkTrail.forEach((point, index) => {
          if (index === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.lineWidth = dark ? 2.55 : 2.45;
        ctx.strokeStyle = gradient;
        ctx.shadowBlur = dark ? 22 : 15;
        ctx.shadowColor = accent;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(head.x, head.y, dark ? 4.1 : 3.7, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.shadowBlur = dark ? 28 : 18;
        ctx.shadowColor = accent;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      activePulse.branches.forEach((branch) => {
        const branchTime = reduced
          ? branch.duration * 0.68
          : elapsed - activePulse.trunkDuration - branch.delay;
        if (branchTime < 0 || branchTime > branch.duration) return;

        const rawProgress = Math.min(1, Math.max(0, branchTime / branch.duration));
        const progress = 1 - Math.pow(1 - rawProgress, 2.35);
        const trail = samplePath(nodes, branch.path, 0, progress);
        const head = trail[trail.length - 1];
        const tail = trail[0];

        const gradient = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
        gradient.addColorStop(0, dark ? "rgba(255, 255, 255, 0)" : "rgba(255, 255, 255, 0)");
        gradient.addColorStop(0.42, glow);
        gradient.addColorStop(1, accent);

        ctx.beginPath();
        trail.forEach((point, index) => {
          if (index === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.lineWidth = dark ? 2.45 : 2.35;
        ctx.strokeStyle = gradient;
        ctx.shadowBlur = dark ? 20 : 14;
        ctx.shadowColor = accent;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(head.x, head.y, dark ? 4.2 : 3.8, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.shadowBlur = dark ? 28 : 18;
        ctx.shadowColor = accent;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      const originAge = reduced ? 260 : elapsed;
      if (originAge >= 0 && originAge <= 420) {
        const originProgress = originAge / 420;
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, 4 + originProgress * 10, 0, Math.PI * 2);
        ctx.lineWidth = dark ? 1.4 : 1.25;
        ctx.strokeStyle = activePulse.hue === "agent"
          ? (dark ? `rgba(170, 112, 255, ${0.42 * (1 - originProgress)})` : `rgba(102, 42, 220, ${0.5 * (1 - originProgress)})`)
          : (dark ? `rgba(124, 184, 255, ${0.42 * (1 - originProgress)})` : `rgba(0, 88, 216, ${0.52 * (1 - originProgress)})`);
        ctx.stroke();
      }

      const splitAge = reduced ? 180 : elapsed - activePulse.trunkDuration;
      if (splitAge >= 0 && splitAge <= 480) {
        const splitProgress = splitAge / 480;
        ctx.beginPath();
        ctx.arc(split.x, split.y, 4 + splitProgress * 12, 0, Math.PI * 2);
        ctx.lineWidth = dark ? 1.6 : 1.45;
        ctx.strokeStyle = activePulse.hue === "agent"
          ? (dark ? `rgba(170, 112, 255, ${0.52 * (1 - splitProgress)})` : `rgba(102, 42, 220, ${0.58 * (1 - splitProgress)})`)
          : (dark ? `rgba(124, 184, 255, ${0.52 * (1 - splitProgress)})` : `rgba(0, 88, 216, ${0.6 * (1 - splitProgress)})`);
        ctx.stroke();
      }
    }

    nodes.forEach((node, index) => {
      const emphasized = index % 4 === 0;
      ctx.beginPath();
      ctx.arc(node.x, node.y, emphasized ? 2.3 : 1.55, 0, Math.PI * 2);
      ctx.fillStyle = dark ? "rgba(236, 244, 255, 0.58)" : "rgba(14, 28, 56, 0.52)";
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
