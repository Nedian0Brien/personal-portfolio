import fs from "node:fs";
import path from "node:path";

import { EDIT_BACKUP_DIR, INDEX_HTML_PATH, REPO_ROOT, RESEARCH_DETAIL_PATH, WEB_ROOT } from "./paths.js";

const EDITABLE_TAG_BLOCKLIST = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "SELECT", "OPTION"]);
const RAW_TEXT_TAGS = new Set(["script", "style"]);
const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

function escapeHtmlText(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function decodeHtmlText(value) {
  const namedEntities = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: "\u00a0",
    quot: '"',
  };

  return value.replace(/&(#x[\da-f]+|#\d+|amp|apos|gt|lt|nbsp|quot);/gi, (entity, body) => {
    const normalized = body.toLowerCase();
    if (normalized.startsWith("#x")) return String.fromCodePoint(Number.parseInt(normalized.slice(2), 16));
    if (normalized.startsWith("#")) return String.fromCodePoint(Number.parseInt(normalized.slice(1), 10));
    return namedEntities[normalized] || entity;
  });
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let count = 0;
  let position = 0;
  while (true) {
    const next = haystack.indexOf(needle, position);
    if (next === -1) return count;
    count += 1;
    position = next + needle.length;
  }
}

function preserveOuterWhitespace(sourceText, replacementText) {
  const leading = sourceText.match(/^\s*/)?.[0] || "";
  const trailing = sourceText.match(/\s*$/)?.[0] || "";
  return `${leading}${escapeHtmlText(replacementText)}${trailing}`;
}

function findTagEnd(source, start) {
  let quote = null;
  for (let index = start + 1; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === ">") return index;
  }
  return -1;
}

function appendTextNode(parent, start, end) {
  if (end <= start) return;
  parent.children.push({ type: "text", start, end, parent });
}

function parseHtmlSource(source) {
  const root = { type: "element", tagName: "#document", children: [], parent: null };
  const stack = [root];
  let position = 0;
  const lowerSource = source.toLowerCase();

  while (position < source.length) {
    const tagStart = source.indexOf("<", position);
    if (tagStart === -1) {
      appendTextNode(stack[stack.length - 1], position, source.length);
      break;
    }

    appendTextNode(stack[stack.length - 1], position, tagStart);

    if (source.startsWith("<!--", tagStart)) {
      const commentEnd = source.indexOf("-->", tagStart + 4);
      position = commentEnd === -1 ? source.length : commentEnd + 3;
      continue;
    }

    const tagEnd = findTagEnd(source, tagStart);
    if (tagEnd === -1) {
      appendTextNode(stack[stack.length - 1], tagStart, source.length);
      break;
    }

    const nextChar = source[tagStart + 1];
    if (nextChar === "!" || nextChar === "?") {
      position = tagEnd + 1;
      continue;
    }

    if (nextChar === "/") {
      const tagName = source.slice(tagStart + 2, tagEnd).trim().split(/\s+/)[0]?.toLowerCase();
      for (let index = stack.length - 1; index > 0; index -= 1) {
        if (stack[index].tagName === tagName) {
          stack[index].endTagStart = tagStart;
          stack[index].endTagEnd = tagEnd + 1;
          stack.length = index;
          break;
        }
      }
      position = tagEnd + 1;
      continue;
    }

    const openTag = source.slice(tagStart + 1, tagEnd).trim();
    const tagName = openTag.match(/^([^\s/>]+)/)?.[1]?.toLowerCase();
    if (!tagName) {
      position = tagEnd + 1;
      continue;
    }

    const element = {
      type: "element",
      tagName,
      startTagStart: tagStart,
      startTagEnd: tagEnd + 1,
      children: [],
      parent: stack[stack.length - 1],
    };
    stack[stack.length - 1].children.push(element);

    const selfClosing = /\/\s*$/.test(openTag) || VOID_TAGS.has(tagName);
    if (selfClosing) {
      position = tagEnd + 1;
      continue;
    }

    if (RAW_TEXT_TAGS.has(tagName)) {
      const closeStart = lowerSource.indexOf(`</${tagName}`, tagEnd + 1);
      if (closeStart === -1) {
        appendTextNode(element, tagEnd + 1, source.length);
        position = source.length;
        continue;
      }
      appendTextNode(element, tagEnd + 1, closeStart);
      const closeEnd = findTagEnd(source, closeStart);
      element.endTagStart = closeStart;
      element.endTagEnd = closeEnd === -1 ? source.length : closeEnd + 1;
      position = element.endTagEnd;
      continue;
    }

    stack.push(element);
    position = tagEnd + 1;
  }

  return root;
}

function findFirstElement(root, tagName) {
  if (root.type === "element" && root.tagName === tagName) return root;
  for (const child of root.children || []) {
    const match = findFirstElement(child, tagName);
    if (match) return match;
  }
  return null;
}

function findElementByPath(root, pathSegments) {
  if (!Array.isArray(pathSegments)) return null;
  let current = root;

  for (const segment of pathSegments) {
    if (!Number.isInteger(segment) || segment < 0) return null;
    const elementChildren = current.children.filter((child) => child.type === "element");
    current = elementChildren[segment];
    if (!current) return null;
  }

  return current;
}

function collectSignificantTextNodes(node, source, results = []) {
  if (node.type === "text") {
    const parentTag = node.parent?.tagName?.toUpperCase();
    const rawText = source.slice(node.start, node.end);
    if (parentTag && !EDITABLE_TAG_BLOCKLIST.has(parentTag) && decodeHtmlText(rawText).trim()) {
      results.push(node);
    }
    return results;
  }

  if (EDITABLE_TAG_BLOCKLIST.has(node.tagName.toUpperCase())) return results;

  for (const child of node.children) collectSignificantTextNodes(child, source, results);
  return results;
}

function locateTextEdit(source, locator, sourceText) {
  if (
    !locator ||
    locator.root !== "body" ||
    !Array.isArray(locator.elementPath) ||
    !Number.isInteger(locator.textNodeIndex)
  ) {
    return { ok: false, status: 400, error: "invalid_text_locator" };
  }

  const documentRoot = parseHtmlSource(source);
  const body = findFirstElement(documentRoot, "body");
  const element = body ? findElementByPath(body, locator.elementPath) : null;
  if (!element) return { ok: false, status: 409, error: "text_locator_not_found" };

  const textNodes = collectSignificantTextNodes(element, source);
  const targetTextNode = textNodes[locator.textNodeIndex];
  if (!targetTextNode) return { ok: false, status: 409, error: "text_locator_not_found" };

  const rawText = source.slice(targetTextNode.start, targetTextNode.end);
  const decodedText = decodeHtmlText(rawText);
  if (decodedText !== sourceText && decodedText.trim() !== sourceText.trim()) {
    return { ok: false, status: 409, error: "text_locator_mismatch" };
  }

  return {
    ok: true,
    start: targetTextNode.start,
    end: targetTextNode.end,
    rawText,
  };
}

export function applyTextEditToSource(source, { sourceText, replacementText, locator }) {
  if (!sourceText || !replacementText || replacementText.length > 2000) {
    return { ok: false, status: 400, error: "invalid_text_payload" };
  }

  if (locator) {
    const target = locateTextEdit(source, locator, sourceText);
    if (!target.ok) return target;
    const replacement = preserveOuterWhitespace(target.rawText, replacementText);
    return {
      ok: true,
      source: `${source.slice(0, target.start)}${replacement}${source.slice(target.end)}`,
    };
  }

  const matches = countOccurrences(source, sourceText);
  if (matches !== 1) {
    return { ok: false, status: 409, error: "source_text_not_unique", matches };
  }

  return { ok: true, source: source.replace(sourceText, preserveOuterWhitespace(sourceText, replacementText)) };
}

export function resolveEditableHtmlPath(pagePath = "/") {
  let pathname = "/";
  try {
    pathname = new URL(pagePath, "http://portfolio.local").pathname;
  } catch {
    return null;
  }

  const editableFiles = new Map([
    ["/", INDEX_HTML_PATH],
    ["/index.html", INDEX_HTML_PATH],
    ["/research/biomedical-bert-adr.html", RESEARCH_DETAIL_PATH],
  ]);
  const filePath = editableFiles.get(pathname);
  if (!filePath || !filePath.startsWith(`${WEB_ROOT}${path.sep}`)) return null;
  return filePath;
}

function backupNameForFile(filePath) {
  const relativePath = path.relative(WEB_ROOT, filePath).replaceAll(path.sep, "__");
  return `${relativePath}-${Date.now()}.html`;
}

export function writeTextEdit(payload) {
  const htmlPath = resolveEditableHtmlPath(payload.pagePath);
  if (!htmlPath) return { ok: false, status: 400, error: "invalid_edit_target" };

  const source = fs.readFileSync(htmlPath, "utf8");
  const result = applyTextEditToSource(source, payload);
  if (!result.ok) return result;

  fs.mkdirSync(EDIT_BACKUP_DIR, { recursive: true });
  fs.copyFileSync(htmlPath, path.join(EDIT_BACKUP_DIR, backupNameForFile(htmlPath)));
  fs.writeFileSync(htmlPath, result.source);

  return { ok: true, file: path.relative(REPO_ROOT, htmlPath) };
}

