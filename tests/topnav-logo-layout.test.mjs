import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../web/index.html", import.meta.url), "utf8");
const stylesEntry = readFileSync(new URL("../web/styles.css", import.meta.url), "utf8");
const importedStyles = [...stylesEntry.matchAll(/@import\s+["'](.+?)["'];/g)].map((match) => {
  const importPath = match[1].replace(/^\.\//, "");
  return readFileSync(new URL(`../web/${importPath}`, import.meta.url), "utf8");
});
const source = [html, stylesEntry, ...importedStyles].join("\n");

function getCssBlock(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, "s"));
  assert.ok(match, `Expected CSS block for ${selector}`);
  return match[1];
}

function hasDeclaration(block, property, valuePattern) {
  return new RegExp(`${property}\\s*:\\s*${valuePattern}\\s*;`, "s").test(block);
}

test("topnav logo remains a fixed-width inline cluster", () => {
  const logoBlock = getCssBlock(".topnav__logo");
  assert.ok(
    hasDeclaration(logoBlock, "flex", "0\\s+0\\s+auto") ||
      hasDeclaration(logoBlock, "flex-shrink", "0"),
    "Expected .topnav__logo to opt out of shrinking",
  );

  const logoMarkBlock = getCssBlock(".topnav__logo-mark");
  assert.ok(
    hasDeclaration(logoMarkBlock, "flex-shrink", "0"),
    "Expected .topnav__logo-mark to keep its square shape",
  );
});

test("topnav logo text stays on one line while search takes the squeeze", () => {
  const logoTextBlock = getCssBlock(".topnav__logo .full");
  assert.ok(
    hasDeclaration(logoTextBlock, "white-space", "nowrap"),
    "Expected the full logo text to stay on one line",
  );
  assert.ok(
    hasDeclaration(logoTextBlock, "flex-shrink", "0"),
    "Expected the full logo text to avoid shrinking",
  );

  const searchBlock = getCssBlock(".topnav__search");
  assert.ok(
    hasDeclaration(searchBlock, "min-width", "0"),
    "Expected .topnav__search to allow the row to compress before the logo wraps",
  );
});
