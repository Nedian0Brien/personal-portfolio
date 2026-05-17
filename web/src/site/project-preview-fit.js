export function initProjectPreviewFit() {
  const previews = document.querySelectorAll(".proj-preview");
  if (!previews.length) return;

  function fit() {
    previews.forEach((wrap) => {
      const frame = wrap.querySelector(".aris-screen, .proj-preview__frame");
      if (!frame) return;

      const baseWidth = parseFloat(wrap.dataset.baseWidth || "1440");
      const width = wrap.clientWidth;
      if (!width) return;

      frame.style.transform = `scale(${width / baseWidth})`;
    });
  }

  let raf = 0;
  function schedule() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(fit);
  }

  window.addEventListener("resize", schedule);
  if (document.readyState === "complete") fit();
  else window.addEventListener("load", fit);
  setTimeout(fit, 50);
  setTimeout(fit, 300);
}
