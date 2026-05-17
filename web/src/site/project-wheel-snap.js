export function initProjectWheelSnap() {
  const project = document.getElementById("project");
  if (!project) return;

  const scenes = Array.from(project.querySelectorAll(".proj-scene"));
  if (!scenes.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const TOPNAV = 64;
  const DURATION = 700;
  const GESTURE_GAP_MS = 140;
  const REACCELERATION_FACTOR = 1.8;
  const REACCELERATION_MIN_DELTA = 24;
  const SETTLE_TOLERANCE = 36;
  let busy = false;
  let lastWheelAt = null;
  let lastWheelDelta = 0;
  let gestureDir = 0;
  let gestureConsumed = false;

  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const snapCenterY = () => TOPNAV + (window.innerHeight - TOPNAV) / 2;

  function inProjectArea() {
    const rect = project.getBoundingClientRect();
    const probe = window.innerHeight * 0.4;
    return rect.top < probe && rect.bottom > probe;
  }

  function currentIdx() {
    const mid = window.innerHeight / 2;
    let best = -1;
    let bestDist = Infinity;
    scenes.forEach((scene, index) => {
      const rect = scene.getBoundingClientRect();
      const distance = Math.abs((rect.top + rect.bottom) / 2 - mid);
      if (distance < bestDist) {
        bestDist = distance;
        best = index;
      }
    });
    return best;
  }

  function tweenTo(targetY) {
    const startY = window.scrollY;
    const diff = targetY - startY;
    if (Math.abs(diff) < 1) return;

    const html = document.documentElement;
    const prevSnap = html.style.scrollSnapType;
    const prevBehavior = html.style.scrollBehavior;
    html.style.scrollSnapType = "none";
    html.style.scrollBehavior = "auto";
    const startedAt = performance.now();
    busy = true;

    function tick(now) {
      const progress = Math.min((now - startedAt) / DURATION, 1);
      const y = startY + diff * easeInOutCubic(progress);
      window.scrollTo({ top: y, left: 0, behavior: "instant" });
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        html.style.scrollSnapType = prevSnap;
        html.style.scrollBehavior = prevBehavior;
        busy = false;
      }
    }

    requestAnimationFrame(tick);
  }

  function cardTargetY(scene) {
    const card = scene.querySelector(".proj-card") || scene;
    const prevSceneTransition = scene.style.transition;
    const prevSceneTransform = scene.style.transform;
    const prevTransition = card.style.transition;
    const prevTransform = card.style.transform;

    scene.style.transition = "none";
    scene.style.transform = "none";
    card.style.transition = "none";
    card.style.transform = "none";
    const rect = card.getBoundingClientRect();
    scene.style.transition = prevSceneTransition;
    scene.style.transform = prevSceneTransform;
    card.style.transition = prevTransition;
    card.style.transform = prevTransform;

    return rect.top + rect.height / 2 + window.scrollY - snapCenterY();
  }

  function wheelTarget(dir) {
    const index = currentIdx();
    if (index < 0) return null;

    const startY = window.scrollY;
    const currentY = cardTargetY(scenes[index]);
    const distanceToCurrent = currentY - startY;
    let targetIndex = index + dir;

    if (dir > 0 && distanceToCurrent > SETTLE_TOLERANCE) targetIndex = index;
    if (dir < 0 && distanceToCurrent < -SETTLE_TOLERANCE) targetIndex = index;

    while (targetIndex >= 0 && targetIndex < scenes.length) {
      const targetY = targetIndex === index ? currentY : cardTargetY(scenes[targetIndex]);
      const movesInWheelDirection = dir > 0 ? targetY > startY + 1 : targetY < startY - 1;
      if (movesInWheelDirection) return { y: targetY };
      targetIndex += dir;
    }

    return null;
  }

  function updateGesture(now, dir, delta) {
    const gap = lastWheelAt === null ? Infinity : now - lastWheelAt;
    const acceleratedAgain =
      gestureConsumed && delta >= REACCELERATION_MIN_DELTA && delta > lastWheelDelta * REACCELERATION_FACTOR;
    const isNewGesture = lastWheelAt === null || gap > GESTURE_GAP_MS || dir !== gestureDir || acceleratedAgain;

    if (isNewGesture) {
      gestureConsumed = false;
      gestureDir = dir;
    }

    lastWheelAt = now;
    lastWheelDelta = delta;
  }

  window.addEventListener(
    "wheel",
    (event) => {
      if (!inProjectArea()) return;
      const deltaY = Math.abs(event.deltaY);
      if (deltaY <= Math.abs(event.deltaX)) return;

      const dir = event.deltaY > 0 ? 1 : -1;
      updateGesture(performance.now(), dir, deltaY);

      if (busy || gestureConsumed) {
        gestureConsumed = true;
        event.preventDefault();
        return;
      }

      const target = wheelTarget(dir);
      if (!target) return;

      event.preventDefault();
      gestureConsumed = true;
      tweenTo(target.y);
    },
    { passive: false },
  );
}
