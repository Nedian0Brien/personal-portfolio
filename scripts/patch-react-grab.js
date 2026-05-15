#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MARKER = "data-react-grab-portfolio-edit-text";
const EVENT_NAME = "portfolio-react-grab-edit-text-mode";
const toolbarTemplateOriginal = String.raw`<div><div><div><div><div><div></div></div><div><div></div></div><div><div></div></div></div><div class="relative shrink-0 overflow-visible">`;
const toolbarTemplateWithEditSlot = String.raw`<div><div><div><div><div><div></div></div><div><div></div></div><div><div></div></div><div><div></div></div></div><div class="relative shrink-0 overflow-visible">`;

const legacyTextButtonTemplate = String.raw`<button data-react-grab-ignore-events data-react-grab-portfolio-edit-text title="Edit text" aria-label="Edit text" class="contain-layout flex items-center justify-center cursor-pointer interactive-scale touch-hitbox min-w-[58px] h-[22px] mt-1 rounded-md border border-black/10 bg-black text-white text-[11px] font-sans font-semibold leading-none">Edit text`;
const legacyStackedIconButtonTemplate = String.raw`<button data-react-grab-ignore-events data-react-grab-portfolio-edit-text title="Edit text" aria-label="Edit text" class="contain-layout flex items-center justify-center cursor-pointer interactive-scale touch-hitbox size-[22px] mt-1 rounded-md border-none bg-transparent p-0 text-black/70 hover:bg-black/10 hover:text-black"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>`;
const legacyTightIconButtonTemplate = String.raw`<button data-react-grab-ignore-events data-react-grab-portfolio-edit-text title="Edit text" aria-label="Edit text" class="contain-layout shrink-0 flex items-center justify-center cursor-pointer interactive-scale touch-hitbox size-[22px] rounded-sm border-none bg-transparent p-0 text-black/70 hover:bg-black/10 hover:text-black"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>`;
const legacyFloatingIconButtonTemplate = String.raw`<button data-react-grab-ignore-events data-react-grab-portfolio-edit-text title="Edit text" aria-label="Edit text" class="contain-layout shrink-0 flex items-center justify-center cursor-pointer interactive-scale mx-[2px] size-[24px] rounded-sm border-none bg-transparent p-0 text-black/70 hover:bg-black/10 hover:text-black"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>`;
const buttonTemplate = String.raw`<button data-react-grab-ignore-events data-react-grab-portfolio-edit-text title="Edit text" aria-label="Edit text" class="contain-layout flex items-center justify-center cursor-pointer interactive-scale touch-hitbox mr-1.5 before:!min-w-full text-black/70 hover:text-black"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>`;
const compactIdentityFormatter = "portfolioFormatElementIdentity=(e,t)=>{let n=String(e||`element`).trim()||`element`,r=String(t||``).trim().split(/\\s+/).filter(Boolean)[0];return r?n+`.`+r:n}";
const formattedIdentityFormatter = String.raw`const portfolioFormatElementIdentity = (kind, className) => {
	const safeKind = String(kind || "element").trim() || "element";
	const firstClassName = String(className || "").trim().split(/\s+/).filter(Boolean)[0];
	return firstClassName ? safeKind + "." + firstClassName : safeKind;
};
`;

function listRendererFiles() {
  const dirs = [
    path.join(ROOT, "node_modules/react-grab/dist"),
    path.join(ROOT, "node_modules/.vite/deps"),
  ];

  return dirs.flatMap((dir) => {
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((file) => /^renderer-.*\.js$/.test(file))
      .map((file) => path.join(dir, file));
  });
}

function listCoreFiles() {
  const distDir = path.join(ROOT, "node_modules/react-grab/dist");
  const viteDepsDir = path.join(ROOT, "node_modules/.vite/deps");
  const files = [];

  if (fs.existsSync(distDir)) {
    files.push(
      ...fs
        .readdirSync(distDir)
        .filter((file) => /^core-.*\.js$/.test(file))
        .map((file) => path.join(distDir, file)),
    );
  }

  const viteEntry = path.join(viteDepsDir, "react-grab.js");
  if (fs.existsSync(viteEntry)) files.push(viteEntry);

  return files;
}

function replaceOnce(source, from, to, file, label) {
  if (!source.includes(from)) return source;
  return source.replace(from, to);
}

function patchCompactRenderer(source, file) {
  let next = source;

  next = next
    .replaceAll(legacyTextButtonTemplate, buttonTemplate)
    .replaceAll(legacyStackedIconButtonTemplate, buttonTemplate)
    .replaceAll(legacyTightIconButtonTemplate, buttonTemplate)
    .replaceAll(legacyFloatingIconButtonTemplate, buttonTemplate)
    .replaceAll(toolbarTemplateOriginal, toolbarTemplateWithEditSlot)
    .replaceAll(
      "A(m,()=>e.selectButton),A(m,()=>e.editTextButton===!1?null:e.editTextButton??portfolioEditTextButton(),null),A(_,()=>e.commentsButton),",
      "A(m,()=>e.selectButton),A(d,()=>e.editTextButton===!1?null:e.editTextButton??portfolioEditTextButton(),_),A(_,()=>e.commentsButton),",
    );

  next = next.replaceAll(
    "var t=Zt(),i=t.firstChild,l=i.firstChild,d=l.firstChild,f=d.firstChild,m=f.firstChild,g=f.nextSibling,_=g.firstChild,v=g.nextSibling,y=v.firstChild,b=d.nextSibling;return A(t,`click`,e.onPanelClick,!0),A(t,`animationend`,e.onAnimationEnd),L(t2=>e.onExpandableButtonsRef?.(t2),d),A(m,()=>e.selectButton),A(d,()=>e.editTextButton===!1?null:e.editTextButton??portfolioEditTextButton(),_),A(_,()=>e.commentsButton),A(y,()=>e.copyAllButton),A(b,()=>e.toggleButton),A(t,()=>e.collapseButton??u2(),null),M((u3)=>{var h=",
    "var t=Zt(),i=t.firstChild,l=i.firstChild,d=l.firstChild,f=d.firstChild,m=f.firstChild,g=f.nextSibling,_=g.firstChild,v=g.nextSibling,y=v.firstChild,q2=v.nextSibling,K2=q2.firstChild,P=d.nextSibling;return A(t,`click`,e.onPanelClick,!0),A(t,`animationend`,e.onAnimationEnd),L(t2=>e.onExpandableButtonsRef?.(t2),d),A(m,()=>e.selectButton),A(_,()=>e.editTextButton===!1?null:e.editTextButton??portfolioEditTextButton()),A(y,()=>e.commentsButton),A(K2,()=>e.copyAllButton),A(P,()=>e.toggleButton),A(t,()=>e.collapseButton??u2(),null),M((u3)=>{var h=",
  );
  next = next
    .replaceAll(
      "v=g.nextSibling,y=v.firstChild,b=d.nextSibling;",
      "v=g.nextSibling,y=v.firstChild,q2=v.nextSibling,K2=q2.firstChild,P=d.nextSibling;",
    )
    .replaceAll(
      "v=g.nextSibling,y=v.firstChild,b=v.nextSibling,k=b.firstChild,P=d.nextSibling;",
      "v=g.nextSibling,y=v.firstChild,q2=v.nextSibling,K2=q2.firstChild,P=d.nextSibling;",
    )
    .replaceAll(
      "A(m,()=>e.selectButton),A(d,()=>e.editTextButton===!1?null:e.editTextButton??portfolioEditTextButton(),_),A(_,()=>e.commentsButton),A(y,()=>e.copyAllButton),A(b,()=>e.toggleButton),",
      "A(m,()=>e.selectButton),A(_,()=>e.editTextButton===!1?null:e.editTextButton??portfolioEditTextButton()),A(y,()=>e.commentsButton),A(K2,()=>e.copyAllButton),A(P,()=>e.toggleButton),",
    )
    .replaceAll(
      "A(m,()=>e.selectButton),A(_,()=>e.editTextButton===!1?null:e.editTextButton??portfolioEditTextButton()),A(y,()=>e.commentsButton),A(k,()=>e.copyAllButton),A(P,()=>e.toggleButton),",
      "A(m,()=>e.selectButton),A(_,()=>e.editTextButton===!1?null:e.editTextButton??portfolioEditTextButton()),A(y,()=>e.commentsButton),A(K2,()=>e.copyAllButton),A(P,()=>e.toggleButton),",
    );

  next = next.replaceAll(
    "w2=G(`grid`,a(),r(!!e.enabled)),T=G(`relative overflow-visible`,s2()),ee2=G(`grid`,a(),r(!!e.enabled&&!!e.isCommentsExpanded,`pointer-events-none`)),te=G(`relative overflow-visible`,s2()),E2=G(`grid`,a(),r(!!e.isCopyAllExpanded,`pointer-events-none`)),ne2=G(`relative overflow-visible`,s2());return h!==u3.e&&R(t,u3.e=h),b2!==u3.t&&H(t,`transform-origin`,u3.t=b2),x2!==u3.a&&R(i,u3.a=x2),S2!==u3.o&&R(l,u3.o=S2),C2!==u3.i&&R(d,u3.i=C2),w2!==u3.n&&R(f,u3.n=w2),T!==u3.s&&R(m,u3.s=T),ee2!==u3.h&&R(g,u3.h=ee2),te!==u3.r&&R(_,u3.r=te),E2!==u3.d&&R(v,u3.d=E2),ne2!==u3.l&&R(y,u3.l=ne2),u3",
    "w2=G(`grid`,a(),r(!!e.enabled)),T=G(`relative overflow-visible`,s2()),ee2=G(`grid`,a(),r(!!e.enabled)),te=G(`relative overflow-visible`,s2()),E2=G(`grid`,a(),r(!!e.enabled&&!!e.isCommentsExpanded,`pointer-events-none`)),ne2=G(`relative overflow-visible`,s2()),re2=G(`grid`,a(),r(!!e.isCopyAllExpanded,`pointer-events-none`)),oe2=G(`relative overflow-visible`,s2());return h!==u3.e&&R(t,u3.e=h),b2!==u3.t&&H(t,`transform-origin`,u3.t=b2),x2!==u3.a&&R(i,u3.a=x2),S2!==u3.o&&R(l,u3.o=S2),C2!==u3.i&&R(d,u3.i=C2),w2!==u3.n&&R(f,u3.n=w2),T!==u3.s&&R(m,u3.s=T),ee2!==u3.h&&R(g,u3.h=ee2),te!==u3.r&&R(_,u3.r=te),E2!==u3.d&&R(v,u3.d=E2),ne2!==u3.l&&R(y,u3.l=ne2),re2!==u3.c&&R(q2,u3.c=re2),oe2!==u3.u&&R(K2,u3.u=oe2),u3",
  );
  next = next.replaceAll(
    "w=G(`grid`,a(),r(!!e.enabled)),T=G(`relative overflow-visible`,s()),ee=G(`grid`,a(),r(!!e.enabled&&!!e.isCommentsExpanded,`pointer-events-none`)),te=G(`relative overflow-visible`,s()),E=G(`grid`,a(),r(!!e.isCopyAllExpanded,`pointer-events-none`)),ne=G(`relative overflow-visible`,s());return h!==u.e&&j(t,u.e=h),b!==u.t&&p(t,`transform-origin`,u.t=b),x!==u.a&&j(i,u.a=x),S!==u.o&&j(l,u.o=S),C!==u.i&&j(d,u.i=C),w!==u.n&&j(f,u.n=w),T!==u.s&&j(m,u.s=T),ee!==u.h&&j(g,u.h=ee),te!==u.r&&j(_,u.r=te),E!==u.d&&j(v,u.d=E),ne!==u.l&&j(y,u.l=ne),u",
    "w=G(`grid`,a(),r(!!e.enabled)),T=G(`relative overflow-visible`,s()),ee=G(`grid`,a(),r(!!e.enabled)),te=G(`relative overflow-visible`,s()),E=G(`grid`,a(),r(!!e.enabled&&!!e.isCommentsExpanded,`pointer-events-none`)),ne=G(`relative overflow-visible`,s()),re=G(`grid`,a(),r(!!e.isCopyAllExpanded,`pointer-events-none`)),oe=G(`relative overflow-visible`,s());return h!==u.e&&j(t,u.e=h),b!==u.t&&p(t,`transform-origin`,u.t=b),x!==u.a&&j(i,u.a=x),S!==u.o&&j(l,u.o=S),C!==u.i&&j(d,u.i=C),w!==u.n&&j(f,u.n=w),T!==u.s&&j(m,u.s=T),ee!==u.h&&j(g,u.h=ee),te!==u.r&&j(_,u.r=te),E!==u.d&&j(v,u.d=E),ne!==u.l&&j(y,u.l=ne),re!==u.c&&j(q2,u.c=re),oe!==u.u&&j(K2,u.u=oe),u",
  );
  next = next.replaceAll(
    "re!==u.c&&j(b,u.c=re),oe!==u.u&&j(k,u.u=oe)",
    "re!==u.c&&j(q2,u.c=re),oe!==u.u&&j(K2,u.u=oe)",
  );

  next = replaceOnce(
    next,
    "var Xt=l(`<button data-react-grab-ignore-events data-react-grab-toolbar-collapse class=\"contain-layout shrink-0 flex items-center justify-center cursor-pointer interactive-scale\">`),Zt=",
    `var Xt=l(\`<button data-react-grab-ignore-events data-react-grab-toolbar-collapse class="contain-layout shrink-0 flex items-center justify-center cursor-pointer interactive-scale">\`),PortfolioEditTextButtonTemplate=l(\`${buttonTemplate}\`),Zt=`,
    file,
    "compact template",
  );

  next = replaceOnce(
    next,
    "M(()=>k(t,`aria-label`,e.isCollapsed?`Expand toolbar`:`Collapse toolbar`)),t})();return(()=>{var t=Zt()",
    `M(()=>k(t,\`aria-label\`,e.isCollapsed?\`Expand toolbar\`:\`Collapse toolbar\`)),t})(),portfolioEditTextButton=()=>(()=>{var t=PortfolioEditTextButtonTemplate();return t.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),window.dispatchEvent(new CustomEvent("${EVENT_NAME}"))}),t})();return(()=>{var t=Zt()`,
    file,
    "compact button factory",
  );

  next = replaceOnce(
    next,
    "A(m,()=>e.selectButton),A(_,()=>e.commentsButton),",
    "A(m,()=>e.selectButton),A(d,()=>e.editTextButton===!1?null:e.editTextButton??portfolioEditTextButton(),_),A(_,()=>e.commentsButton),",
    file,
    "compact insert button",
  );

  next = replaceOnce(
    next,
    "get onToggleToolbarMenu(){return e.onToggleToolbarMenu},get isToolbarMenuOpen(){",
    "get onToggleToolbarMenu(){return e.onToggleToolbarMenu},get editTextButton(){return(e.actions??[]).some(e=>e.id===`portfolio-edit-text`)?void 0:!1},get isToolbarMenuOpen(){",
    file,
    "compact renderer prop",
  );

  if (!next.includes("portfolioFormatElementIdentity")) {
    next = next.replace(
      /(componentName:e\.tagName\?e\.componentName:void 0\}),([A-Za-z_$][\w$]*=e=>e===`Enter`\?)/,
      `$1,${compactIdentityFormatter},$2`,
    );
    next = next.replace(
      /(var [A-Za-z_$][\w$]* = \(e\) => e\.elementsCount && e\.elementsCount > 1 \? \{ tagName: `\$\{e\.elementsCount\} elements`, componentName: void 0 \} : \{ tagName: e\.tagName \|\| e\.componentName \|\| `element`, componentName: e\.tagName \? e\.componentName : void 0 \};)/,
      `$1\nvar ${compactIdentityFormatter};`,
    );
  }

  const tagDisplayFunction =
    next.match(
      /([A-Za-z_$][\w$]*)=\(\)=>[A-Za-z_$][\w$]*\(\{tagName:e\.tagName,componentName:e\.componentName,elementsCount:e\.elementsCount\}\)/,
    )?.[1] ??
    next.match(
      /([A-Za-z_$][\w$]*)\s*=\s*\(\)\s*=>\s*[A-Za-z_$][\w$]*\(\{\s*tagName:\s*e\.tagName,\s*componentName:\s*e\.componentName,\s*elementsCount:\s*e\.elementsCount\s*\}\)/,
    )?.[1];
  if (tagDisplayFunction) {
    next = next.replace(
      /get children\(\)\{return i\(([A-Za-z_$][\w$]*),\{get onConfirm\(\)\{return e\.onConfirmDismiss\},/,
      `get children(){return i($1,{get label(){return portfolioFormatElementIdentity(${tagDisplayFunction}().componentName||${tagDisplayFunction}().tagName,e.selectionClassName)},get onConfirm(){return e.onConfirmDismiss},`,
    );
    next = next.replace(
      /return he\(([A-Za-z_$][\w$]*), \{ get onConfirm\(\) \{\n\s+return e\.onConfirmDismiss;\n\s+\},/,
      `return he($1, { get label() {\n        const display = ${tagDisplayFunction}();\n        return portfolioFormatElementIdentity(display.componentName || display.tagName, e.selectionClassName);\n      }, get onConfirm() {\n        return e.onConfirmDismiss;\n      },`,
    );
  }

  next = next.replace(
    "get componentName(){return e.selectionComponentName},get elementsCount(){",
    "get componentName(){return e.selectionComponentName},get selectionClassName(){return e.selectionClassName},get elementsCount(){",
  );
  next = next.replace(
    "get componentName() {\n    return e.selectionComponentName;\n  }, get elementsCount() {",
    "get componentName() {\n    return e.selectionComponentName;\n  }, get selectionClassName() {\n    return e.selectionClassName;\n  }, get elementsCount() {",
  );

  return next;
}

function patchFormattedRenderer(source, file) {
  let next = source;

  next = next
    .replaceAll(legacyTextButtonTemplate, buttonTemplate)
    .replaceAll(legacyStackedIconButtonTemplate, buttonTemplate)
    .replaceAll(legacyTightIconButtonTemplate, buttonTemplate)
    .replaceAll(legacyFloatingIconButtonTemplate, buttonTemplate)
    .replaceAll(toolbarTemplateOriginal, toolbarTemplateWithEditSlot)
    .replaceAll(
      "Ge(m2, () => e.selectButton), Ge(m2, () => e.editTextButton === false ? null : e.editTextButton ?? portfolioEditTextButton(), null), Ge(_, () => e.commentsButton),",
      "Ge(m2, () => e.selectButton), Ge(d, () => e.editTextButton === false ? null : e.editTextButton ?? portfolioEditTextButton(), _), Ge(_, () => e.commentsButton),",
    );

  next = next.replaceAll(
    "var t3 = Zt(), i = t3.firstChild, l3 = i.firstChild, d = l3.firstChild, f = d.firstChild, m2 = f.firstChild, g = f.nextSibling, _ = g.firstChild, v = g.nextSibling, y = v.firstChild, b = d.nextSibling;\n    return ze(t3, `click`, e.onPanelClick, true), ze(t3, `animationend`, e.onAnimationEnd), We((t4) => e.onExpandableButtonsRef?.(t4), d), Ge(m2, () => e.selectButton), Ge(d, () => e.editTextButton === false ? null : e.editTextButton ?? portfolioEditTextButton(), _), Ge(_, () => e.commentsButton), Ge(y, () => e.copyAllButton), Ge(b, () => e.toggleButton), Ge(t3, () => e.collapseButton ?? u2(), null), S((u3) => {",
    "var t3 = Zt(), i = t3.firstChild, l3 = i.firstChild, d = l3.firstChild, f = d.firstChild, m2 = f.firstChild, g = f.nextSibling, _ = g.firstChild, v = g.nextSibling, y = v.firstChild, q2 = v.nextSibling, K2 = q2.firstChild, P2 = d.nextSibling;\n    return ze(t3, `click`, e.onPanelClick, true), ze(t3, `animationend`, e.onAnimationEnd), We((t4) => e.onExpandableButtonsRef?.(t4), d), Ge(m2, () => e.selectButton), Ge(_, () => e.editTextButton === false ? null : e.editTextButton ?? portfolioEditTextButton()), Ge(y, () => e.commentsButton), Ge(K2, () => e.copyAllButton), Ge(P2, () => e.toggleButton), Ge(t3, () => e.collapseButton ?? u2(), null), S((u3) => {",
  );
  next = next
    .replaceAll(
      "v = g.nextSibling, y = v.firstChild, b = d.nextSibling;",
      "v = g.nextSibling, y = v.firstChild, q2 = v.nextSibling, K2 = q2.firstChild, P2 = d.nextSibling;",
    )
    .replaceAll(
      "v = g.nextSibling, y = v.firstChild, b = v.nextSibling, k2 = b.firstChild, P2 = d.nextSibling;",
      "v = g.nextSibling, y = v.firstChild, q2 = v.nextSibling, K2 = q2.firstChild, P2 = d.nextSibling;",
    )
    .replaceAll(
      "Ge(m2, () => e.selectButton), Ge(d, () => e.editTextButton === false ? null : e.editTextButton ?? portfolioEditTextButton(), _), Ge(_, () => e.commentsButton), Ge(y, () => e.copyAllButton), Ge(b, () => e.toggleButton),",
      "Ge(m2, () => e.selectButton), Ge(_, () => e.editTextButton === false ? null : e.editTextButton ?? portfolioEditTextButton()), Ge(y, () => e.commentsButton), Ge(K2, () => e.copyAllButton), Ge(P2, () => e.toggleButton),",
    )
    .replaceAll(
      "Ge(m2, () => e.selectButton), Ge(_, () => e.editTextButton === false ? null : e.editTextButton ?? portfolioEditTextButton()), Ge(y, () => e.commentsButton), Ge(k2, () => e.copyAllButton), Ge(P2, () => e.toggleButton),",
      "Ge(m2, () => e.selectButton), Ge(_, () => e.editTextButton === false ? null : e.editTextButton ?? portfolioEditTextButton()), Ge(y, () => e.commentsButton), Ge(K2, () => e.copyAllButton), Ge(P2, () => e.toggleButton),",
    );

  next = next.replaceAll(
    "w2 = G(`grid`, a(), r(!!e.enabled)), T = G(`relative overflow-visible`, s2()), ee2 = G(`grid`, a(), r(!!e.enabled && !!e.isCommentsExpanded, `pointer-events-none`)), te = G(`relative overflow-visible`, s2()), E2 = G(`grid`, a(), r(!!e.isCopyAllExpanded, `pointer-events-none`)), ne2 = G(`relative overflow-visible`, s2());\n      return h !== u3.e && Re(t3, u3.e = h), b2 !== u3.t && He(t3, `transform-origin`, u3.t = b2), x2 !== u3.a && Re(i, u3.a = x2), S2 !== u3.o && Re(l3, u3.o = S2), C2 !== u3.i && Re(d, u3.i = C2), w2 !== u3.n && Re(f, u3.n = w2), T !== u3.s && Re(m2, u3.s = T), ee2 !== u3.h && Re(g, u3.h = ee2), te !== u3.r && Re(_, u3.r = te), E2 !== u3.d && Re(v, u3.d = E2), ne2 !== u3.l && Re(y, u3.l = ne2), u3;",
    "w2 = G(`grid`, a(), r(!!e.enabled)), T = G(`relative overflow-visible`, s2()), ee2 = G(`grid`, a(), r(!!e.enabled)), te = G(`relative overflow-visible`, s2()), E2 = G(`grid`, a(), r(!!e.enabled && !!e.isCommentsExpanded, `pointer-events-none`)), ne2 = G(`relative overflow-visible`, s2()), re2 = G(`grid`, a(), r(!!e.isCopyAllExpanded, `pointer-events-none`)), oe3 = G(`relative overflow-visible`, s2());\n      return h !== u3.e && Re(t3, u3.e = h), b2 !== u3.t && He(t3, `transform-origin`, u3.t = b2), x2 !== u3.a && Re(i, u3.a = x2), S2 !== u3.o && Re(l3, u3.o = S2), C2 !== u3.i && Re(d, u3.i = C2), w2 !== u3.n && Re(f, u3.n = w2), T !== u3.s && Re(m2, u3.s = T), ee2 !== u3.h && Re(g, u3.h = ee2), te !== u3.r && Re(_, u3.r = te), E2 !== u3.d && Re(v, u3.d = E2), ne2 !== u3.l && Re(y, u3.l = ne2), re2 !== u3.c && Re(q2, u3.c = re2), oe3 !== u3.u && Re(K2, u3.u = oe3), u3;",
  );
  next = next.replaceAll(
    "w = G(`grid`, a(), r(!!e.enabled)), T = G(`relative overflow-visible`, s()), ee = G(`grid`, a(), r(!!e.enabled && !!e.isCommentsExpanded, `pointer-events-none`)), te = G(`relative overflow-visible`, s()), E = G(`grid`, a(), r(!!e.isCopyAllExpanded, `pointer-events-none`)), ne = G(`relative overflow-visible`, s());\n      return h !== u.e && j(t, u.e = h), b !== u.t && p(t, `transform-origin`, u.t = b), x !== u.a && j(i, u.a = x), S !== u.o && j(l, u.o = S), C !== u.i && j(d, u.i = C), w !== u.n && j(f, u.n = w), T !== u.s && j(m, u.s = T), ee !== u.h && j(g, u.h = ee), te !== u.r && j(_, u.r = te), E !== u.d && j(v, u.d = E), ne !== u.l && j(y, u.l = ne), u;",
    "w = G(`grid`, a(), r(!!e.enabled)), T = G(`relative overflow-visible`, s()), ee = G(`grid`, a(), r(!!e.enabled)), te = G(`relative overflow-visible`, s()), E = G(`grid`, a(), r(!!e.enabled && !!e.isCommentsExpanded, `pointer-events-none`)), ne = G(`relative overflow-visible`, s()), re = G(`grid`, a(), r(!!e.isCopyAllExpanded, `pointer-events-none`)), oe = G(`relative overflow-visible`, s());\n      return h !== u.e && j(t, u.e = h), b !== u.t && p(t, `transform-origin`, u.t = b), x !== u.a && j(i, u.a = x), S !== u.o && j(l, u.o = S), C !== u.i && j(d, u.i = C), w !== u.n && j(f, u.n = w), T !== u.s && j(m, u.s = T), ee !== u.h && j(g, u.h = ee), te !== u.r && j(_, u.r = te), E !== u.d && j(v, u.d = E), ne !== u.l && j(y, u.l = ne), re !== u.c && j(q2, u.c = re), oe !== u.u && j(K2, u.u = oe), u;",
  );
  next = next.replaceAll(
    "re !== u.c && j(b, u.c = re), oe !== u.u && j(k, u.u = oe)",
    "re !== u.c && j(q2, u.c = re), oe !== u.u && j(K2, u.u = oe)",
  );

  next = replaceOnce(
    next,
    "var Xt = Pe(`<button data-react-grab-ignore-events data-react-grab-toolbar-collapse class=\"contain-layout shrink-0 flex items-center justify-center cursor-pointer interactive-scale\">`);\nvar Zt = Pe(",
    `var Xt = Pe(\`<button data-react-grab-ignore-events data-react-grab-toolbar-collapse class="contain-layout shrink-0 flex items-center justify-center cursor-pointer interactive-scale">\`);\nvar PortfolioEditTextButtonTemplate = Pe(\`${buttonTemplate}\`);\nvar Zt = Pe(`,
    file,
    "formatted template",
  );

  next = replaceOnce(
    next,
    "S(() => K(t3, `aria-label`, e.isCollapsed ? `Expand toolbar` : `Collapse toolbar`)), t3;\n  })();\n  return (() => {",
    `S(() => K(t3, \`aria-label\`, e.isCollapsed ? \`Expand toolbar\` : \`Collapse toolbar\`)), t3;\n  })(), portfolioEditTextButton = () => (() => {\n    var t3 = PortfolioEditTextButtonTemplate();\n    t3.addEventListener("click", (event) => {\n      event.preventDefault();\n      event.stopPropagation();\n      window.dispatchEvent(new CustomEvent("${EVENT_NAME}"));\n    });\n    return t3;\n  })();\n  return (() => {`,
    file,
    "formatted button factory",
  );

  next = replaceOnce(
    next,
    "Ge(m2, () => e.selectButton), Ge(_, () => e.commentsButton),",
    "Ge(m2, () => e.selectButton), Ge(d, () => e.editTextButton === false ? null : e.editTextButton ?? portfolioEditTextButton(), _), Ge(_, () => e.commentsButton),",
    file,
    "formatted insert button",
  );

  next = replaceOnce(
    next,
    "}, get onToggleToolbarMenu() {\n    return e.onToggleToolbarMenu;\n  }, get isToolbarMenuOpen() {",
    "}, get onToggleToolbarMenu() {\n    return e.onToggleToolbarMenu;\n  }, get editTextButton() {\n    return (e.actions ?? []).some((action) => action.id === \"portfolio-edit-text\") ? void 0 : false;\n  }, get isToolbarMenuOpen() {",
    file,
    "formatted renderer prop",
  );

  if (!next.includes("portfolioFormatElementIdentity")) {
    next = replaceOnce(
      next,
      "const getTagDisplay = (input) => {\n\tif (input.elementsCount && input.elementsCount > 1) return {\n\t\ttagName: `${input.elementsCount} elements`,\n\t\tcomponentName: void 0\n\t};\n\treturn {\n\t\ttagName: input.tagName || input.componentName || \"element\",\n\t\tcomponentName: input.tagName ? input.componentName : void 0\n\t};\n};\n",
      `const getTagDisplay = (input) => {\n\tif (input.elementsCount && input.elementsCount > 1) return {\n\t\ttagName: \`\${input.elementsCount} elements\`,\n\t\tcomponentName: void 0\n\t};\n\treturn {\n\t\ttagName: input.tagName || input.componentName || "element",\n\t\tcomponentName: input.tagName ? input.componentName : void 0\n\t};\n};\n${formattedIdentityFormatter}`,
      file,
      "formatted identity formatter",
    );
  }

  next = replaceOnce(
    next,
    "\t\t\t\t\treturn createComponent(DiscardPrompt, {\n\t\t\t\t\t\tget onConfirm() {\n\t\t\t\t\t\t\treturn props.onConfirmDismiss;\n\t\t\t\t\t\t},",
    "\t\t\t\t\treturn createComponent(DiscardPrompt, {\n\t\t\t\t\t\tget label() {\n\t\t\t\t\t\t\tconst display = tagDisplayResult();\n\t\t\t\t\t\t\treturn portfolioFormatElementIdentity(display.componentName || display.tagName, props.selectionClassName);\n\t\t\t\t\t\t},\n\t\t\t\t\t\tget onConfirm() {\n\t\t\t\t\t\t\treturn props.onConfirmDismiss;\n\t\t\t\t\t\t},",
    file,
    "formatted discard prompt label",
  );

  next = replaceOnce(
    next,
    "\t\t\t\t\tget componentName() {\n\t\t\t\t\t\treturn props.selectionComponentName;\n\t\t\t\t\t},\n\t\t\t\t\tget elementsCount() {",
    "\t\t\t\t\tget componentName() {\n\t\t\t\t\t\treturn props.selectionComponentName;\n\t\t\t\t\t},\n\t\t\t\t\tget selectionClassName() {\n\t\t\t\t\t\treturn props.selectionClassName;\n\t\t\t\t\t},\n\t\t\t\t\tget elementsCount() {",
    file,
    "formatted selection class prop",
  );

  return next;
}

function patchCore(source) {
  let next = source;

  const formattedSelectionElement = next.match(
    /const selectionTagName = createMemo\(\(\) => \{\n\t\t\tconst element = ([A-Za-z_$][\w$]*)\(\);\n\t\t\tif \(!element\) return void 0;\n\t\t\treturn [A-Za-z_$][\w$]*\(element\) \|\| void 0;\n\t\t\}\);/,
  )?.[1];
  if (formattedSelectionElement) {
    next = next.replace(
      "\t\t\t\t\tget selectionComponentName() {\n\t\t\t\t\t\treturn resolvedComponentName();\n\t\t\t\t\t},\n\t\t\t\t\tget selectionLabelVisible() {",
      `\t\t\t\t\tget selectionComponentName() {\n\t\t\t\t\t\treturn resolvedComponentName();\n\t\t\t\t\t},\n\t\t\t\t\tget selectionClassName() {\n\t\t\t\t\t\tconst element = ${formattedSelectionElement}();\n\t\t\t\t\t\treturn element?.getAttribute?.("class") || void 0;\n\t\t\t\t\t},\n\t\t\t\t\tget selectionLabelVisible() {`,
    );
  }

  const compactSelectionElement =
    next.match(
      /(?:let\s+|,)([A-Za-z_$][\w$]*)=[A-Za-z_$][\w$]*\(\(\)=>\{let e=([A-Za-z_$][\w$]*)\(\);if\(!e\)return void 0;return [A-Za-z_$][\w$]*\(e\)\|\|void 0\}\);/,
    )?.[2] ??
    next.match(
      /(?:let\s+|,)([A-Za-z_$][\w$]*)=[A-Za-z_$][\w$]*\(\(\)=>\{let e=([A-Za-z_$][\w$]*)\(\);if\(e\)return [A-Za-z_$][\w$]*\(e\)\|\|void 0\}\);/,
    )?.[2];
  if (compactSelectionElement) {
    next = next.replace(
      /(get selectionComponentName\(\)\{return [A-Za-z_$][\w$]*\(\)\},)get selectionLabelVisible\(\)\{/,
      `$1get selectionClassName(){return ${compactSelectionElement}()?.getAttribute?.("class")||void 0},get selectionLabelVisible(){`,
    );
  }

  const viteSelectionElement =
    next.match(
      /var ([A-Za-z_$][\w$]*) = [A-Za-z_$][\w$]*\(\(\) => \{\n\s+let e = ([A-Za-z_$][\w$]*)\(\);\n\s+if \(!e\) return void 0;\n\s+return [A-Za-z_$][\w$]*\(e\) \|\| void 0;\n\s+\}\);/,
    )?.[2] ??
    next.match(
      /([A-Za-z_$][\w$]*) = [A-Za-z_$][\w$]*\(\(\) => \{\n\s+let ([A-Za-z_$][\w$]*) = ([A-Za-z_$][\w$]*)\(\);\n\s+if \(\2\) return [A-Za-z_$][\w$]*\(\2\) \|\| void 0;\n\s+\}\);/,
    )?.[3];
  if (viteSelectionElement) {
    next = next.replace(
      /get selectionComponentName\(\) \{\n(\s+)return ([A-Za-z_$][\w$]*)\(\);\n\s+\}, get selectionLabelVisible\(\) \{/,
      `get selectionComponentName() {\n$1return $2();\n      }, get selectionClassName() {\n$1return ${viteSelectionElement}()?.getAttribute?.("class") || void 0;\n      }, get selectionLabelVisible() {`,
    );
  }

  return next;
}

let patchedCount = 0;

for (const file of listRendererFiles()) {
  const source = fs.readFileSync(file, "utf8");
  const compact = patchCompactRenderer(source, file);
  const formatted = patchFormattedRenderer(compact, file);

  if (formatted !== source) {
    fs.writeFileSync(file, formatted);
    patchedCount += 1;
  }
}

for (const file of listCoreFiles()) {
  const source = fs.readFileSync(file, "utf8");
  const patched = patchCore(source);

  if (patched !== source) {
    fs.writeFileSync(file, patched);
    patchedCount += 1;
  }
}

if (patchedCount === 0) {
  console.log("react-grab patch: already applied or no matching bundle found");
} else {
  console.log(`react-grab patch: applied to ${patchedCount} bundle(s)`);
}
