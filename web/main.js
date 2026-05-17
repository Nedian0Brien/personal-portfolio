/* ================================================================
   Theme toggle + persistence
   ================================================================ */
(function(){
  const KEY = 'portfolio-theme';
  const root = document.documentElement;
  const btn  = document.getElementById('themeBtn');
  const sun  = document.getElementById('themeSun');
  const moon = document.getElementById('themeMoon');

  function setTheme(t){
    root.setAttribute('data-theme', t);
    try { localStorage.setItem(KEY, t); } catch(e){}
    const dark = t === 'dark';
    sun.style.display  = dark ? 'none' : 'block';
    moon.style.display = dark ? 'block' : 'none';
  }
  // init from localStorage or system
  let initial = null;
  try { initial = localStorage.getItem(KEY); } catch(e){}
  if (!initial) {
    initial = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  setTheme(initial);

  btn.addEventListener('click', () => {
    setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
})();

/* ================================================================
   Apple-style scroll reveal (IntersectionObserver-based)
   ================================================================ */
(function(){
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // assign stagger index for any .reveal-group children
  document.querySelectorAll('.reveal-group').forEach(group => {
    const items = group.querySelectorAll(':scope > .reveal, :scope .bento > .reveal, :scope .exp-list > .reveal, :scope .study-grid > .reveal');
    items.forEach((el, i) => el.style.setProperty('--i', i));
  });

  if (reduced) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();

/* ================================================================
   Section nav scroll-spy
   ================================================================ */
(function(){
  const navLinks = document.querySelectorAll('#topnavNav a[href^="#"]');
  if (!navLinks.length) return;

  const sectionMap = new Map();
  navLinks.forEach(a => {
    const id = a.getAttribute('href').slice(1);
    const sec = document.getElementById(id);
    if (sec) sectionMap.set(sec, a);
  });

  const visibility = new Map();
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(e => visibility.set(e.target, e.intersectionRatio));

    let bestSec = null;
    let bestRatio = 0;
    visibility.forEach((ratio, sec) => {
      if (ratio > bestRatio) { bestRatio = ratio; bestSec = sec; }
    });

    navLinks.forEach(a => a.removeAttribute('aria-current'));
    if (bestSec && bestRatio > 0) {
      const link = sectionMap.get(bestSec);
      if (link) link.setAttribute('aria-current', 'page');
    }
  }, {
    threshold: [0, 0.2, 0.4, 0.6, 0.8, 1],
    rootMargin: '-56px 0px -40% 0px'
  });

  sectionMap.forEach((_, sec) => spy.observe(sec));
})();

/* ================================================================
   Hero parallax (Apple-style scroll-driven fade-out)
   ================================================================ */
(function(){
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;
  const hero = document.querySelector('.hero');
  if (!hero) return;
  let ticking = false;
  function update() {
    const y = window.scrollY;
    const max = hero.offsetHeight || 1;
    const p = Math.min(1, Math.max(0, y / max));
    hero.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
    hero.style.opacity = String(1 - p * 0.6);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
})();

/* ---------- Cover mouse parallax + spotlight ---------- */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;
  const covers = document.querySelectorAll('.cover');
  if (!covers.length) return;
  covers.forEach((cover) => {
    let rafId = 0;
    let pendingX = 0, pendingY = 0;
    const apply = () => {
      cover.style.setProperty('--mx', pendingX.toFixed(2) + 'px');
      cover.style.setProperty('--my', pendingY.toFixed(2) + 'px');
      rafId = 0;
    };
    cover.addEventListener('mousemove', (e) => {
      const rect = cover.getBoundingClientRect();
      pendingX = e.clientX - rect.left - rect.width / 2;
      pendingY = e.clientY - rect.top - rect.height / 2;
      if (!rafId) rafId = requestAnimationFrame(apply);
    }, { passive: true });
    cover.addEventListener('mouseenter', () => {
      cover.style.setProperty('--m-active', '1');
    });
    cover.addEventListener('mouseleave', () => {
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      cover.style.setProperty('--mx', '0px');
      cover.style.setProperty('--my', '0px');
      cover.style.setProperty('--m-active', '0');
    });
  });
})();

if (import.meta.env?.DEV) {
  import('/src/react-grab-dev.js');
}

(function () {
  const WORKER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const PDF_PATH   = '/pdf/' + encodeURIComponent(
    'Predicting Drug–Side Effect Relationships From Parametric Knowledge Embedded in Biomedical BERT Models.pdf'
  );

  async function renderPaperCover() {
    const canvases = Array.from(document.querySelectorAll('.pdf-page'));
    if (!canvases.length) return;
    const container = canvases[0].parentElement;
    const cw = container.offsetWidth;
    const ch = container.offsetHeight;
    if (!cw || !ch) return;

    const pdfjs = window.pdfjsLib;
    if (!pdfjs) return;

    pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
    try {
      const pdf = await pdfjs.getDocument(PDF_PATH).promise;

      await Promise.all(canvases.map(async (canvas) => {
        const pageNum = parseInt(canvas.dataset.pdfPage, 10) || 1;
        if (pageNum > pdf.numPages) return;
        const page = await pdf.getPage(pageNum);
        const base = page.getViewport({ scale: 1 });
        const scale    = Math.max(cw / base.width, ch / base.height);
        const viewport = page.getViewport({ scale });

        canvas.width  = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        canvas.style.top  = '0px';
        canvas.style.left = Math.round((cw - viewport.width) / 2) + 'px';

        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        canvas.classList.add('ready');
      }));
    } catch (e) {
      console.warn('PDF preview unavailable:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderPaperCover);
  } else {
    renderPaperCover();
  }
})();

/* ================================================================
   §03 PROJECT — Carousel + scroll-active scene
   ================================================================ */
(function () {
  if (!window.visualViewport) return;
  const root = document.documentElement;
  let raf = 0;

  function syncBrowserChromeInset() {
    raf = 0;
    const vv = window.visualViewport;
    const bottom = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    root.style.setProperty('--browser-chrome-bottom', bottom.toFixed(2) + 'px');
  }

  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(syncBrowserChromeInset);
  }

  syncBrowserChromeInset();
  window.visualViewport.addEventListener('resize', schedule);
  window.visualViewport.addEventListener('scroll', schedule);
  window.addEventListener('orientationchange', schedule);
})();

(function(){
  document.querySelectorAll('[data-carousel]').forEach(root => {
    const slides = root.querySelectorAll('.proj-carousel__slide');
    if (!slides.length) return;
    const dotsBox = root.querySelector('.proj-carousel__dots');
    const cur = root.querySelector('.cur');
    const tot = root.querySelector('.tot');
    const cardRoot = root.closest('.proj-card') || root;
    let idx = Math.max(0, [...slides].findIndex(s => s.classList.contains('on')));
    if (idx < 0) idx = 0;
    const pad = slides.length > 9 ? 2 : 1;
    if (tot) tot.textContent = String(slides.length).padStart(pad, '0');
    if (cur) cur.textContent = String(idx + 1).padStart(pad, '0');
    const initialTitleEl = root.querySelector('.proj-carousel__title');
    if (initialTitleEl) {
      const t0 = slides[idx].dataset.title;
      if (t0) initialTitleEl.textContent = t0;
    }
    const initialDescEl = cardRoot.querySelector('[data-carousel-desc]');
    if (initialDescEl) {
      const d0 = slides[idx].dataset.desc;
      if (d0) initialDescEl.textContent = d0;
    }

    if (dotsBox) {
      slides.forEach((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', '슬라이드 ' + (i + 1));
        if (i === idx) b.classList.add('on');
        b.addEventListener('click', e => { e.stopPropagation(); show(i); });
        dotsBox.appendChild(b);
      });
    }
    const dots = dotsBox ? dotsBox.querySelectorAll('button') : [];

    function show(n) {
      const next = (n + slides.length) % slides.length;
      slides.forEach((s, k) => {
        s.classList.remove('on', 'prev');
        if (k === next) s.classList.add('on');
        else if (k === idx) s.classList.add('prev');
      });
      dots.forEach((d, k) => d.classList.toggle('on', k === next));
      if (cur) cur.textContent = String(next + 1).padStart(pad, '0');
      const titleEl = root.querySelector('.proj-carousel__title');
      if (titleEl) {
        const t = slides[next].dataset.title;
        if (t) titleEl.textContent = t;
      }
      const descEl = cardRoot.querySelector('[data-carousel-desc]');
      if (descEl) {
        const d = slides[next].dataset.desc;
        if (d) descEl.textContent = d;
      }
      idx = next;
    }
    root.querySelectorAll('.proj-carousel__nav.prev').forEach(b =>
      b.addEventListener('click', e => { e.stopPropagation(); show(idx - 1); }));
    root.querySelectorAll('.proj-carousel__nav.next').forEach(b =>
      b.addEventListener('click', e => { e.stopPropagation(); show(idx + 1); }));
    root.querySelectorAll('.proj-carousel__half').forEach(half =>
      half.addEventListener('click', e => {
        e.stopPropagation();
        show(half.dataset.act === 'prev' ? idx - 1 : idx + 1);
      }));

    let sx = 0, sy = 0, st = 0;
    root.addEventListener('touchstart', e => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      st = Date.now();
    }, { passive: true });
    root.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      const dt = Date.now() - st;
      if (dt < 500 && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        show(idx + (dx < 0 ? 1 : -1));
      }
    }, { passive: true });

    root.addEventListener('mouseenter', () => root.dataset.hover = '1');
    root.addEventListener('mouseleave', () => delete root.dataset.hover);
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const hover = document.querySelector('[data-carousel][data-hover]');
    if (!hover) return;
    const slides = hover.querySelectorAll('.proj-carousel__slide');
    const cur = [...slides].findIndex(s => s.classList.contains('on'));
    const next = (cur + (e.key === 'ArrowLeft' ? -1 : 1) + slides.length) % slides.length;
    const dots = hover.querySelectorAll('.proj-carousel__dots button');
    if (dots[next]) dots[next].click();
  });

  const scenes = document.querySelectorAll('.proj-scene');
  if (!scenes.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    scenes.forEach(s => s.classList.add('is-active'));
    return;
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.intersectionRatio > 0.45) e.target.classList.add('is-active');
      else if (e.intersectionRatio < 0.15) e.target.classList.remove('is-active');
    });
  }, { threshold: [0, 0.15, 0.3, 0.45, 0.6, 0.85, 1] });

  scenes.forEach(s => obs.observe(s));
})();

/* §03 PROJECT — Desktop full-screen background slide transition.
   Each project's gradient layer rises from the bottom of the viewport
   as its scene scrolls into view, covering the previous one. */
(function(){
  const stage = document.querySelector('.proj-bg-stage');
  if (!stage) return;
  const layers = Array.from(stage.querySelectorAll('.proj-bg-layer'));
  const scenes = Array.from(document.querySelectorAll('#project .proj-scene'));
  if (!layers.length || layers.length !== scenes.length) return;

  const mq = window.matchMedia('(min-width: 981px)');
  const cssWipeMq = window.matchMedia('(max-width: 980px)');
  const root = document.documentElement;
  let themeMeta = document.querySelector('meta[name="theme-color"]');
  if (!themeMeta) {
    themeMeta = document.createElement('meta');
    themeMeta.name = 'theme-color';
    document.head.appendChild(themeMeta);
  }
  const defaultThemeColor = themeMeta.getAttribute('content') || '#ffffff';
  const chromeColors = {
    'theme-blue': '#006be8',
    'theme-red': '#f04a0f',
    'theme-yellow': '#f5aa00',
    'theme-green': '#16865a',
    'theme-purple': '#4f2fc7',
    'theme-pink': '#bb55d7',
    'theme-orange': '#f05a16',
  };
  let active = false;
  let ticking = false;

  function supportsCssWipe() {
    return cssWipeMq.matches
      && window.CSS
      && CSS.supports('animation-timeline: --project-bg')
      && CSS.supports('view-timeline-name: --project-bg')
      && CSS.supports('timeline-scope: --project-bg');
  }

  function clearProjectThemeColor() {
    themeMeta.setAttribute('content', defaultThemeColor);
  }

  function updateProjectThemeColor() {
    if (!root.classList.contains('device-mobile-or-tablet')) {
      clearProjectThemeColor();
      return;
    }
    const project = stage.closest('#project');
    const projectRect = project ? project.getBoundingClientRect() : null;
    if (!projectRect || projectRect.top >= window.innerHeight || projectRect.bottom <= 0) {
      clearProjectThemeColor();
      return;
    }

    const probeY = window.innerHeight - 1;
    let visibleLayer = layers[0];
    layers.forEach((layer, i) => {
      if (i === 0 || layer.getBoundingClientRect().top <= probeY) {
        visibleLayer = layer;
      }
    });

    const themeClass = Array.from(visibleLayer.classList).find(name => chromeColors[name]);
    if (themeClass) themeMeta.setAttribute('content', chromeColors[themeClass]);
  }

  function update(){
    ticking = false;
    updateProjectThemeColor();
    if (!active) return;
    const vh = window.innerHeight;
    const animateFirstLayer = root.classList.contains('device-mobile-or-tablet');
    for (let i = 0; i < layers.length; i++) {
      if (i === 0 && !animateFirstLayer) { layers[i].style.transform = 'translate3d(0, 0, 0)'; continue; }
      const r = scenes[i].getBoundingClientRect();
      const p = Math.max(0, Math.min(1, 1 - r.top / vh));
      layers[i].style.transform = 'translate3d(0, ' + ((1 - p) * 100).toFixed(3) + '%, 0)';
    }
  }
  function schedule(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }
  function activate(on){
    active = on;
    if (on) {
      schedule();
    } else if (supportsCssWipe()) {
      layers.forEach(l => { l.style.transform = ''; });
    } else {
      layers.forEach((l, i) => {
        l.style.transform = i === 0 && !root.classList.contains('device-mobile-or-tablet') ? 'translate3d(0, 0, 0)' : 'translate3d(0, 100%, 0)';
      });
    }
  }

  const shouldUseJs = () => mq.matches || !supportsCssWipe();
  const updateMode = () => activate(shouldUseJs());

  updateMode();
  if (mq.addEventListener) mq.addEventListener('change', updateMode);
  else if (mq.addListener) mq.addListener(updateMode);
  if (cssWipeMq.addEventListener) cssWipeMq.addEventListener('change', updateMode);
  else if (cssWipeMq.addListener) cssWipeMq.addListener(updateMode);

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
})();

/* Auto-fit prototype iframes to wrapper width (transform: scale).
   Each .proj-preview has data-base-width (default 1440). */
(function(){
  const previews = document.querySelectorAll('.proj-preview');
  if (!previews.length) return;
  function fit() {
    previews.forEach(wrap => {
      const frame = wrap.querySelector('.aris-screen, .proj-preview__frame');
      if (!frame) return;
      const baseW = parseFloat(wrap.dataset.baseWidth || '1440');
      const w = wrap.clientWidth;
      if (!w) return;
      frame.style.transform = 'scale(' + (w / baseW) + ')';
    });
  }
  let raf = 0;
  function schedule(){ if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(fit); }
  window.addEventListener('resize', schedule);
  if (document.readyState === 'complete') fit();
  else window.addEventListener('load', fit);
  setTimeout(fit, 50);
  setTimeout(fit, 300);
})();

/* Project section — slow, eased card-to-card transition on wheel.
   Intercepts wheel inside the project area and tweens to the next/prev
   .proj-scene with a configurable duration so the snap doesn't feel abrupt.
   Falls back to native scroll for keyboard / touch / reduced-motion. */
(function () {
  const proj = document.getElementById('project');
  if (!proj) return;
  const scenes = Array.from(proj.querySelectorAll('.proj-scene'));
  if (!scenes.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const TOPNAV = 64;
  const DURATION = 700;
  const COOLDOWN = 180;
  const SETTLE_TOLERANCE = 36;
  let busy = false;

  const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const snapCenterY = () => TOPNAV + (window.innerHeight - TOPNAV) / 2;

  function inProjectArea() {
    const r = proj.getBoundingClientRect();
    const probe = window.innerHeight * 0.4;
    return r.top < probe && r.bottom > probe;
  }

  function currentIdx() {
    const mid = window.innerHeight / 2;
    let best = -1, bestDist = Infinity;
    scenes.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const d = Math.abs((r.top + r.bottom) / 2 - mid);
      if (d < bestDist) { bestDist = d; best = i; }
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
    html.style.scrollSnapType = 'none';
    html.style.scrollBehavior = 'auto';
    const t0 = performance.now();
    busy = true;
    function tick(now) {
      const t = Math.min((now - t0) / DURATION, 1);
      const y = startY + diff * easeInOutCubic(t);
      window.scrollTo({ top: y, left: 0, behavior: 'instant' });
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        html.style.scrollSnapType = prevSnap;
        html.style.scrollBehavior = prevBehavior;
        setTimeout(() => { busy = false; }, COOLDOWN);
      }
    }
    requestAnimationFrame(tick);
  }

  function cardTargetY(scene) {
    const card = scene.querySelector('.proj-card') || scene;
    const prevSceneTransition = scene.style.transition;
    const prevSceneTransform = scene.style.transform;
    const prevTransition = card.style.transition;
    const prevTransform = card.style.transform;
    // Measure the final revealed position, not the offscreen reveal transforms.
    scene.style.transition = 'none';
    scene.style.transform = 'none';
    card.style.transition = 'none';
    card.style.transform = 'none';
    const r = card.getBoundingClientRect();
    scene.style.transition = prevSceneTransition;
    scene.style.transform = prevSceneTransform;
    card.style.transition = prevTransition;
    card.style.transform = prevTransform;
    return r.top + r.height / 2 + window.scrollY - snapCenterY();
  }

  function wheelTarget(dir) {
    const i = currentIdx();
    if (i < 0) return null;

    const startY = window.scrollY;
    const currentY = cardTargetY(scenes[i]);
    const distanceToCurrent = currentY - startY;
    let targetIdx = i + dir;

    if (dir > 0 && distanceToCurrent > SETTLE_TOLERANCE) targetIdx = i;
    if (dir < 0 && distanceToCurrent < -SETTLE_TOLERANCE) targetIdx = i;

    while (targetIdx >= 0 && targetIdx < scenes.length) {
      const targetY = targetIdx === i ? currentY : cardTargetY(scenes[targetIdx]);
      const movesInWheelDirection = dir > 0 ? targetY > startY + 1 : targetY < startY - 1;
      if (movesInWheelDirection) return { y: targetY };
      targetIdx += dir;
    }

    return null;
  }

  window.addEventListener('wheel', (e) => {
    if (!inProjectArea()) return;
    if (busy) { e.preventDefault(); return; }
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    const dir = e.deltaY > 0 ? 1 : -1;
    const target = wheelTarget(dir);
    if (!target) return; // let native scroll carry user out of the section
    e.preventDefault();
    tweenTo(target.y);
  }, { passive: false });
})();
