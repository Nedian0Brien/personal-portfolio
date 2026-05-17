export function initScrollReveal({
  groupSelector = ".reveal-group",
  itemSelector = ":scope > .reveal, :scope .bento > .reveal, :scope .exp-list > .reveal, :scope .study-grid > .reveal",
  revealSelector = ".reveal",
  animatedSelector = null,
  rootMargin = "0px 0px -10% 0px",
} = {}) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll(groupSelector).forEach((group) => {
    const items = group.querySelectorAll(itemSelector);
    items.forEach((el, index) => el.style.setProperty("--i", index));
  });

  if (reduced) {
    document.querySelectorAll(revealSelector).forEach((el) => el.classList.add("is-visible"));
    if (animatedSelector) {
      document.querySelectorAll(animatedSelector).forEach((el) => el.classList.add("is-anim"));
    }
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        if (animatedSelector && entry.target.matches(animatedSelector)) entry.target.classList.add("is-anim");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin },
  );

  const selectors = animatedSelector ? `${revealSelector}, ${animatedSelector}` : revealSelector;
  document.querySelectorAll(selectors).forEach((el) => observer.observe(el));
}
