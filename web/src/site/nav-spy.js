export function initSectionNavSpy({
  linkSelector,
  activeAttribute = "aria-current",
  activeAttributeValue = "page",
  activeClass = null,
  rootMargin,
} = {}) {
  const links = document.querySelectorAll(linkSelector);
  if (!links.length) return;

  const sectionMap = new Map();
  links.forEach((link) => {
    const id = link.getAttribute("href")?.slice(1);
    const section = id ? document.getElementById(id) : null;
    if (section) sectionMap.set(section, link);
  });

  const visibility = new Map();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => visibility.set(entry.target, entry.intersectionRatio));

      let bestSection = null;
      let bestRatio = 0;
      visibility.forEach((ratio, section) => {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestSection = section;
        }
      });

      links.forEach((link) => {
        if (activeClass) link.classList.remove(activeClass);
        else link.removeAttribute(activeAttribute);
      });

      if (!bestSection || bestRatio <= 0) return;
      const link = sectionMap.get(bestSection);
      if (!link) return;
      if (activeClass) link.classList.add(activeClass);
      else link.setAttribute(activeAttribute, activeAttributeValue);
    },
    {
      threshold: [0, 0.2, 0.4, 0.6, 0.8, 1],
      rootMargin,
    },
  );

  sectionMap.forEach((_, section) => observer.observe(section));
}
