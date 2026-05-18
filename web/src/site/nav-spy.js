export function initSectionNavSpy({
  linkSelector,
  activeAttribute = "aria-current",
  activeAttributeValue = "page",
  activeClass = null,
  activationRatio = 0.32,
  minActivationOffset = 96,
} = {}) {
  const links = Array.from(document.querySelectorAll(linkSelector));
  if (!links.length) return;

  const targets = links.flatMap((link) => {
    const id = link.getAttribute("href")?.slice(1);
    const section = id ? document.getElementById(id) : null;
    return section ? [{ link, section }] : [];
  });
  if (!targets.length) return;

  let scheduled = false;
  const setActive = (activeLink) => {
    links.forEach((link) => {
      if (activeClass) link.classList.toggle(activeClass, link === activeLink);
      else if (link === activeLink) link.setAttribute(activeAttribute, activeAttributeValue);
      else link.removeAttribute(activeAttribute);
    });
  };

  const update = () => {
    scheduled = false;
    const activationY = Math.max(window.innerHeight * activationRatio, minActivationOffset);
    let current = null;

    for (const target of targets) {
      if (target.section.getBoundingClientRect().top <= activationY) current = target;
      else break;
    }

    setActive(current?.link || null);
  };

  const requestUpdate = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  window.addEventListener("hashchange", requestUpdate);
  requestUpdate();
}
