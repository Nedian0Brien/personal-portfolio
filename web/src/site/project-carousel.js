export function initProjectCarousel() {
  document.querySelectorAll("[data-carousel]").forEach((root) => {
    const slides = root.querySelectorAll(".proj-carousel__slide");
    if (!slides.length) return;

    const dotsBox = root.querySelector(".proj-carousel__dots");
    const cur = root.querySelector(".cur");
    const tot = root.querySelector(".tot");
    const cardRoot = root.closest(".proj-card") || root;
    let idx = Math.max(0, [...slides].findIndex((slide) => slide.classList.contains("on")));
    if (idx < 0) idx = 0;

    const pad = slides.length > 9 ? 2 : 1;
    if (tot) tot.textContent = String(slides.length).padStart(pad, "0");
    if (cur) cur.textContent = String(idx + 1).padStart(pad, "0");

    const initialTitleEl = root.querySelector(".proj-carousel__title");
    if (initialTitleEl) {
      const title = slides[idx].dataset.title;
      if (title) initialTitleEl.textContent = title;
    }

    const initialDescEl = cardRoot.querySelector("[data-carousel-desc]");
    if (initialDescEl) {
      const desc = slides[idx].dataset.desc;
      if (desc) initialDescEl.textContent = desc;
    }

    if (dotsBox) {
      slides.forEach((_, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("aria-label", `슬라이드 ${index + 1}`);
        if (index === idx) button.classList.add("on");
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          show(index);
        });
        dotsBox.appendChild(button);
      });
    }
    const dots = dotsBox ? dotsBox.querySelectorAll("button") : [];

    function show(n) {
      const next = (n + slides.length) % slides.length;
      slides.forEach((slide, index) => {
        slide.classList.remove("on", "prev");
        if (index === next) slide.classList.add("on");
        else if (index === idx) slide.classList.add("prev");
      });
      dots.forEach((dot, index) => dot.classList.toggle("on", index === next));
      if (cur) cur.textContent = String(next + 1).padStart(pad, "0");

      const titleEl = root.querySelector(".proj-carousel__title");
      if (titleEl) {
        const title = slides[next].dataset.title;
        if (title) titleEl.textContent = title;
      }

      const descEl = cardRoot.querySelector("[data-carousel-desc]");
      if (descEl) {
        const desc = slides[next].dataset.desc;
        if (desc) descEl.textContent = desc;
      }
      idx = next;
    }

    root.querySelectorAll(".proj-carousel__nav.prev").forEach((button) =>
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        show(idx - 1);
      }),
    );
    root.querySelectorAll(".proj-carousel__nav.next").forEach((button) =>
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        show(idx + 1);
      }),
    );
    root.querySelectorAll(".proj-carousel__half").forEach((half) =>
      half.addEventListener("click", (event) => {
        event.stopPropagation();
        show(half.dataset.act === "prev" ? idx - 1 : idx + 1);
      }),
    );

    let sx = 0;
    let sy = 0;
    let st = 0;
    root.addEventListener(
      "touchstart",
      (event) => {
        sx = event.touches[0].clientX;
        sy = event.touches[0].clientY;
        st = Date.now();
      },
      { passive: true },
    );
    root.addEventListener(
      "touchend",
      (event) => {
        const dx = event.changedTouches[0].clientX - sx;
        const dy = event.changedTouches[0].clientY - sy;
        const dt = Date.now() - st;
        if (dt < 500 && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
          show(idx + (dx < 0 ? 1 : -1));
        }
      },
      { passive: true },
    );

    root.addEventListener("mouseenter", () => {
      root.dataset.hover = "1";
    });
    root.addEventListener("mouseleave", () => {
      delete root.dataset.hover;
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const hover = document.querySelector("[data-carousel][data-hover]");
    if (!hover) return;

    const slides = hover.querySelectorAll(".proj-carousel__slide");
    const current = [...slides].findIndex((slide) => slide.classList.contains("on"));
    const next = (current + (event.key === "ArrowLeft" ? -1 : 1) + slides.length) % slides.length;
    const dots = hover.querySelectorAll(".proj-carousel__dots button");
    if (dots[next]) dots[next].click();
  });
}

export function initProjectSceneActivation() {
  const scenes = document.querySelectorAll(".proj-scene");
  if (!scenes.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    scenes.forEach((scene) => scene.classList.add("is-active"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio > 0.45) entry.target.classList.add("is-active");
        else if (entry.intersectionRatio < 0.15) entry.target.classList.remove("is-active");
      });
    },
    { threshold: [0, 0.15, 0.3, 0.45, 0.6, 0.85, 1] },
  );

  scenes.forEach((scene) => observer.observe(scene));
}
