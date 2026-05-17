(function(){
  var hero = document.getElementById('bento-bars');
  if (!hero) return;
  var fills = hero.querySelectorAll('.bc__bar-fill');
  var obs = new IntersectionObserver(function(e){
    if (e[0].isIntersecting) {
      fills.forEach(function(f){ f.style.width = f.dataset.w; });
      obs.disconnect();
    }
  }, { threshold: 0.4 });
  obs.observe(hero);
})();

/* ================================================================
   Theme toggle
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
    sun.style.display = dark ? 'none' : 'block';
    moon.style.display = dark ? 'block' : 'none';
  }
  let initial = null;
  try { initial = localStorage.getItem(KEY); } catch(e){}
  if (!initial) initial = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  setTheme(initial);
  btn.addEventListener('click', () => setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
})();

/* ================================================================
   Reveal observer
   ================================================================ */
(function(){
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.reveal-group').forEach(group => {
    const items = group.querySelectorAll(':scope > .reveal');
    items.forEach((el, i) => el.style.setProperty('--i', i));
  });
  if (reduced) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    document.querySelectorAll('[data-anim]').forEach(el => el.classList.add('is-anim'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        if (e.target.hasAttribute('data-anim')) e.target.classList.add('is-anim');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal, [data-anim]').forEach(el => io.observe(el));
})();

/* ================================================================
   Cover mouse parallax + spotlight
   ================================================================ */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;
  const covers = document.querySelectorAll('.cover');
  covers.forEach((cover) => {
    let rafId = 0, pendingX = 0, pendingY = 0;
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
    cover.addEventListener('mouseenter', () => cover.style.setProperty('--m-active', '1'));
    cover.addEventListener('mouseleave', () => {
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      cover.style.setProperty('--mx', '0px');
      cover.style.setProperty('--my', '0px');
      cover.style.setProperty('--m-active', '0');
    });
  });
})();

/* ================================================================
   Hero PDF first-page preview
   ================================================================ */
(function () {
  const canvas = document.querySelector('.paper-hero__pdf-canvas');
  if (!canvas || !window.pdfjsLib) return;

  const WORKER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const PDF_PATH = '/pdf/' + encodeURIComponent(
    'Predicting Drug–Side Effect Relationships From Parametric Knowledge Embedded in Biomedical BERT Models.pdf'
  );

  async function renderHeroPdf() {
    const frame = canvas.parentElement;
    const cssWidth = frame?.clientWidth || 320;
    const cssHeight = frame?.clientHeight || Math.round(cssWidth * 1.294);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_SRC;

    try {
      const pdf = await pdfjsLib.getDocument(PDF_PATH).promise;
      const page = await pdf.getPage(1);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.max(cssWidth / base.width, cssHeight / base.height) * dpr;
      const viewport = page.getViewport({ scale });
      const ctx = canvas.getContext('2d');

      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;

      await page.render({ canvasContext: ctx, viewport }).promise;
      canvas.classList.add('ready');
    } catch (e) {
      console.warn('Hero PDF preview unavailable:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHeroPdf);
  } else {
    renderHeroPdf();
  }
})();

/* ================================================================
   Contents nav scroll spy
   ================================================================ */
(function(){
  const links = document.querySelectorAll('#contentsNav a[href^="#"]');
  if (!links.length) return;
  const map = new Map();
  links.forEach(a => {
    const sec = document.getElementById(a.getAttribute('href').slice(1));
    if (sec) map.set(sec, a);
  });
  const visibility = new Map();
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(e => visibility.set(e.target, e.intersectionRatio));
    let bestSec = null, bestRatio = 0;
    visibility.forEach((r, sec) => { if (r > bestRatio) { bestRatio = r; bestSec = sec; } });
    links.forEach(a => a.classList.remove('active'));
    if (bestSec && bestRatio > 0) {
      const link = map.get(bestSec);
      if (link) link.classList.add('active');
    }
  }, { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1], rootMargin: '-120px 0px -50% 0px' });
  map.forEach((_, sec) => spy.observe(sec));
})();

/* ================================================================
   Citation tabs + copy
   ================================================================ */
(function(){
  const tabs = document.querySelectorAll('.citation__tab');
  const panes = document.querySelectorAll('.citation__panel');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('active'));
    panes.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    const target = t.dataset.cite;
    const pane = document.querySelector(`.citation__panel[data-pane="${target}"]`);
    if (pane) pane.classList.add('active');
  }));
  document.querySelectorAll('.citation__copy').forEach(btn => {
    btn.addEventListener('click', async () => {
      const which = btn.dataset.copy;
      const pane = document.querySelector(`.citation__panel[data-pane="${which}"]`);
      const code = pane?.querySelector('.citation__code');
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code.textContent.trim());
        const original = btn.textContent;
        btn.textContent = 'Copied ✓';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = original; btn.classList.remove('copied'); }, 1600);
      } catch (e) {
        const r = document.createRange();
        r.selectNode(code);
        const sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(r);
      }
    });
  });
})();
