export function initBrowserChromeInset() {
  if (!window.visualViewport) return;

  const root = document.documentElement;
  let raf = 0;

  function syncBrowserChromeInset() {
    raf = 0;
    const viewport = window.visualViewport;
    const bottom = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
    root.style.setProperty("--browser-chrome-bottom", `${bottom.toFixed(2)}px`);
  }

  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(syncBrowserChromeInset);
  }

  syncBrowserChromeInset();
  window.visualViewport.addEventListener("resize", schedule);
  window.visualViewport.addEventListener("scroll", schedule);
  window.addEventListener("orientationchange", schedule);
}
