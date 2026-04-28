import { getGlobalApi, init, registerPlugin } from "react-grab";

window.__PORTFOLIO_REACT_GRAB__ = {
  enabled: true,
  loadedAt: new Date().toISOString(),
};

const UI_ATTR = "data-portfolio-edit-ui";
const EDITABLE_TAG_BLOCKLIST = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "SELECT", "OPTION"]);
let authChecked = false;
let isAuthenticated = false;
let activeTarget = null;
let panel = null;
let overlay = null;
const adminModeRequested = new URLSearchParams(window.location.search).get("admin") === "1";
let editTextMode = false;
let reactGrabApi = null;

function injectStyles() {
  if (document.getElementById("portfolio-text-editor-style")) return;
  const style = document.createElement("style");
  style.id = "portfolio-text-editor-style";
  style.textContent = `
    [${UI_ATTR}] { box-sizing: border-box; font-family: "Inter", "Pretendard Variable", Pretendard, system-ui, sans-serif; }
    .portfolio-edit-outline {
      position: fixed;
      z-index: 2147483600;
      pointer-events: none;
      border: 2px solid hsl(216 100% 52%);
      box-shadow: 0 0 0 4px hsl(216 100% 52% / .16);
      border-radius: 8px;
    }
    .portfolio-edit-panel {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 2147483601;
      width: min(420px, calc(100vw - 36px));
      background: hsl(0 0% 100%);
      color: hsl(0 0% 8%);
      border: 1px solid hsl(0 0% 86%);
      border-radius: 12px;
      box-shadow: 0 12px 40px -12px rgba(0,0,0,.18);
      padding: 14px;
    }
    .portfolio-edit-panel__top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .portfolio-edit-panel__label {
      flex: 1;
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 11px;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: hsl(0 0% 53%);
    }
    .portfolio-edit-panel__close {
      width: 28px;
      height: 28px;
      border: 1px solid hsl(0 0% 86%);
      border-radius: 8px;
      background: transparent;
      color: hsl(0 0% 8%);
      cursor: pointer;
    }
    .portfolio-edit-panel textarea {
      width: 100%;
      min-height: 138px;
      resize: vertical;
      border: 1px solid hsl(0 0% 86%);
      border-radius: 8px;
      background: hsl(0 0% 96%);
      color: hsl(0 0% 8%);
      padding: 10px 12px;
      font: inherit;
      line-height: 1.55;
      outline: none;
    }
    .portfolio-edit-panel__select {
      width: 100%;
      height: 36px;
      margin-bottom: 10px;
      border: 1px solid hsl(0 0% 86%);
      border-radius: 8px;
      background: hsl(0 0% 96%);
      color: hsl(0 0% 8%);
      padding: 0 10px;
      font: inherit;
      font-size: 13px;
      outline: none;
    }
    .portfolio-edit-panel__select:focus { background: #fff; border-color: hsl(0 0% 8%); }
    .portfolio-edit-panel textarea:focus { background: #fff; border-color: hsl(0 0% 8%); }
    .portfolio-edit-panel__actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 10px; }
    .portfolio-edit-panel button {
      height: 34px;
      padding: 0 12px;
      border-radius: 8px;
      border: 1px solid transparent;
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .portfolio-edit-panel__save { background: hsl(0 0% 8%); color: white; }
    .portfolio-edit-panel__cancel { background: white; border-color: hsl(0 0% 86%) !important; color: hsl(0 0% 8%); }
    .portfolio-edit-panel__message { margin-top: 9px; color: hsl(0 0% 44%); font-size: 12px; line-height: 1.45; }
    .portfolio-edit-panel__message[data-tone="error"] { color: hsl(18 100% 44%); }
    .portfolio-admin-dock {
      position: fixed;
      left: 50%;
      bottom: 18px;
      transform: translateX(-50%);
      z-index: 2147483599;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      min-height: 38px;
      padding: 0 10px 0 14px;
      border: 1px solid hsl(0 0% 86%);
      border-radius: 8px;
      background: hsl(0 0% 100% / .92);
      color: hsl(0 0% 8%);
      box-shadow: 0 12px 40px -12px rgba(0,0,0,.18);
      backdrop-filter: saturate(160%) blur(14px);
      font-size: 13px;
      font-weight: 600;
    }
    .portfolio-admin-dock__dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: hsl(150 70% 38%);
    }
    .portfolio-admin-dock__dot[data-tone="locked"] { background: hsl(18 100% 52%); }
    .portfolio-admin-dock a {
      height: 28px;
      display: inline-flex;
      align-items: center;
      padding: 0 9px;
      border: 1px solid hsl(0 0% 86%);
      border-radius: 6px;
      color: inherit;
      text-decoration: none;
      background: hsl(0 0% 96%);
    }
  `;
  document.head.appendChild(style);
}

function activateEditTextMode() {
  if (!isAuthenticated) {
    window.location.href = "/admin/login";
    return;
  }
  editTextMode = true;
  reactGrabApi?.activate?.();
}

function ensureReactGrabApi() {
  if (reactGrabApi) return reactGrabApi;
  reactGrabApi = getGlobalApi?.() || init?.() || null;
  return reactGrabApi;
}

function showAdminDock(authenticated) {
  if (authenticated) return;
  if (!adminModeRequested || document.querySelector(".portfolio-admin-dock")) return;
  injectStyles();

  const dock = document.createElement("div");
  dock.className = "portfolio-admin-dock";
  dock.setAttribute(UI_ATTR, "");
  dock.innerHTML = '<span class="portfolio-admin-dock__dot" data-tone="locked" aria-hidden="true"></span><span>Login required for edit mode</span><a href="/admin/login">Login</a>';
  document.body.appendChild(dock);
}

function syncAdminNav(authenticated) {
  const loginLinks = Array.from(document.querySelectorAll('a[href="/admin/login"]'));
  if (!authenticated) return;

  loginLinks.forEach((link) => {
    link.textContent = "Logout";
    link.setAttribute("href", "/admin/logout");
    link.addEventListener("click", async (event) => {
      event.preventDefault();
      await fetch("/admin/logout", { method: "POST", credentials: "same-origin" });
      window.location.href = "/admin/login";
    });
  });
}

function significantTextNodes(element) {
  const nodes = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || EDITABLE_TAG_BLOCKLIST.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}

function makeTarget(element, textNode) {
  const sourceText = textNode.nodeValue || "";
  return {
    element,
    textNode,
    sourceText,
    displayText: sourceText.trim(),
  };
}

function findEditableCandidates(element) {
  if (!(element instanceof Element)) return null;
  if (element.closest(`[${UI_ATTR}]`) || EDITABLE_TAG_BLOCKLIST.has(element.tagName)) return null;

  const directNodes = significantTextNodes(element);
  if (directNodes.length > 0) {
    return directNodes.map((node) => makeTarget(element, node));
  }

  let current = element.parentElement;
  while (current && current !== document.body) {
    const nodes = significantTextNodes(current);
    if (nodes.length > 0) return nodes.map((node) => makeTarget(current, node));
    current = current.parentElement;
  }

  return [];
}

function setMessage(message, tone = "info") {
  const node = panel?.querySelector(".portfolio-edit-panel__message");
  if (!node) return;
  node.textContent = message;
  node.dataset.tone = tone;
}

function positionOverlay(target) {
  if (!overlay || !target) return;
  const rect = target.element.getBoundingClientRect();
  overlay.style.left = `${rect.left}px`;
  overlay.style.top = `${rect.top}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
}

function closeEditor() {
  activeTarget = null;
  panel?.remove();
  overlay?.remove();
  panel = null;
  overlay = null;
  window.removeEventListener("scroll", updateOverlay, true);
  window.removeEventListener("resize", updateOverlay);
}

function updateOverlay() {
  positionOverlay(activeTarget);
}

async function saveEdit(textarea) {
  if (!activeTarget) return;
  const replacementText = textarea.value.trim();
  if (!replacementText) {
    setMessage("빈 텍스트는 저장할 수 없습니다.", "error");
    return;
  }

  setMessage("Saving...");
  const response = await fetch("/__portfolio_admin/text-edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      sourceText: activeTarget.sourceText,
      replacementText,
    }),
  });
  const result = await response.json().catch(() => ({ ok: false, error: "invalid_response" }));
  if (!response.ok || !result.ok) {
    const detail = result.matches !== undefined ? ` (${result.matches} matches)` : "";
    setMessage(`저장 실패: ${result.error || response.status}${detail}`, "error");
    return;
  }

  const prefix = activeTarget.sourceText.match(/^\s*/)?.[0] || "";
  const suffix = activeTarget.sourceText.match(/\s*$/)?.[0] || "";
  activeTarget.textNode.nodeValue = `${prefix}${replacementText}${suffix}`;
  activeTarget.sourceText = activeTarget.textNode.nodeValue;
  setMessage("Saved to web/index.html");
  setTimeout(closeEditor, 650);
}

function openEditor(element) {
  const candidates = findEditableCandidates(element);
  if (!candidates || candidates.length === 0) {
    closeEditor();
    injectStyles();
    panel = document.createElement("section");
    panel.className = "portfolio-edit-panel";
    panel.setAttribute(UI_ATTR, "");
    panel.innerHTML = `
      <div class="portfolio-edit-panel__top">
        <div class="portfolio-edit-panel__label">Edit selected text</div>
        <button class="portfolio-edit-panel__close" type="button" aria-label="Close">×</button>
      </div>
      <div class="portfolio-edit-panel__message" data-tone="error">수정할 수 있는 텍스트가 없습니다. 텍스트가 포함된 영역을 선택해주세요.</div>
    `;
    document.body.appendChild(panel);
    panel.querySelector(".portfolio-edit-panel__close").addEventListener("click", closeEditor);
    return;
  }

  closeEditor();
  activeTarget = candidates[0];
  injectStyles();

  overlay = document.createElement("div");
  overlay.className = "portfolio-edit-outline";
  overlay.setAttribute(UI_ATTR, "");
  document.body.appendChild(overlay);
  positionOverlay(activeTarget);

  panel = document.createElement("section");
  panel.className = "portfolio-edit-panel";
  panel.setAttribute(UI_ATTR, "");
  panel.innerHTML = `
    <div class="portfolio-edit-panel__top">
      <div class="portfolio-edit-panel__label">Edit selected text</div>
      <button class="portfolio-edit-panel__close" type="button" aria-label="Close">×</button>
    </div>
    ${
      candidates.length > 1
        ? `<select class="portfolio-edit-panel__select" aria-label="Text segment">
            ${candidates
              .map((candidate, index) => {
                const label = candidate.displayText.replace(/\s+/g, " ").slice(0, 80);
                return `<option value="${index}">${index + 1}. ${label}</option>`;
              })
              .join("")}
          </select>`
        : ""
    }
    <textarea aria-label="Selected text"></textarea>
    <div class="portfolio-edit-panel__actions">
      <button class="portfolio-edit-panel__cancel" type="button">Cancel</button>
      <button class="portfolio-edit-panel__save" type="button">Save</button>
    </div>
    <div class="portfolio-edit-panel__message">저장하면 web/index.html에 바로 반영됩니다.</div>
  `;
  document.body.appendChild(panel);

  const textarea = panel.querySelector("textarea");
  const select = panel.querySelector(".portfolio-edit-panel__select");
  const setActiveCandidate = (index) => {
    activeTarget = candidates[index];
    textarea.value = activeTarget.displayText;
    textarea.focus();
    textarea.select();
    positionOverlay(activeTarget);
    setMessage(candidates.length > 1 ? "여러 텍스트가 감지되어 선택한 항목만 저장합니다." : "저장하면 web/index.html에 바로 반영됩니다.");
  };
  if (select) {
    select.addEventListener("change", () => setActiveCandidate(Number(select.value)));
  }
  setActiveCandidate(0);
  textarea.focus();
  textarea.select();
  panel.querySelector(".portfolio-edit-panel__close").addEventListener("click", closeEditor);
  panel.querySelector(".portfolio-edit-panel__cancel").addEventListener("click", closeEditor);
  panel.querySelector(".portfolio-edit-panel__save").addEventListener("click", () => saveEdit(textarea));
  window.addEventListener("scroll", updateOverlay, true);
  window.addEventListener("resize", updateOverlay);
}

async function checkAuth() {
  if (authChecked) return isAuthenticated;
  authChecked = true;
  try {
    const response = await fetch("/admin/status", { credentials: "same-origin" });
    const status = await response.json();
    isAuthenticated = Boolean(status.authenticated);
  } catch {
    isAuthenticated = false;
  }
  return isAuthenticated;
}

async function initPortfolioTextEditor() {
  const authenticated = await checkAuth();
  showAdminDock(authenticated);
  syncAdminNav(authenticated);
  injectStyles();

  registerPlugin({
    name: "portfolio-text-editor",
    actions: [
      {
        id: "portfolio-edit-text",
        label: "Edit text",
        shortcut: "E",
        target: "toolbar",
        showInToolbarMenu: true,
        onAction(context) {
          if (!isAuthenticated) {
            window.location.href = "/admin/login";
            return;
          }
          activateEditTextMode();
          openEditor(context.element);
          context.hideContextMenu?.();
        },
      },
    ],
    hooks: {
      onElementSelect(element) {
        if (!editTextMode || !isAuthenticated) return false;
        openEditor(element);
        return true;
      },
    },
  });

  reactGrabApi = ensureReactGrabApi();
  if (adminModeRequested) {
    reactGrabApi?.setEnabled?.(true);
    reactGrabApi?.activate?.();
  }
  window.addEventListener("portfolio-react-grab-edit-text-mode", activateEditTextMode);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeTarget) closeEditor();
  });

  window.__PORTFOLIO_TEXT_EDITOR__ = {
    enabled: true,
    authenticated,
    adminModeRequested,
    reactGrabReady: Boolean(reactGrabApi),
    openEditor,
  };
}

initPortfolioTextEditor();
