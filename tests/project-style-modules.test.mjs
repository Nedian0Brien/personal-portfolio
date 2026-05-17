import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readCssWithImports(path, seen = new Set()) {
  const url = new URL(path, import.meta.url);
  if (seen.has(url.href)) return "";
  seen.add(url.href);

  const source = readFileSync(url, "utf8");
  const imported = [...source.matchAll(/@import\s+["'](.+?)["'];/g)]
    .map((match) => new URL(match[1], url))
    .map((importUrl) => readCssWithImports(importUrl.href, seen))
    .join("\n");

  return [source, imported].join("\n");
}

test("project styles are split into ordered behavior modules", () => {
  const entry = readFileSync(new URL("../web/styles/projects.css", import.meta.url), "utf8");
  const imports = [...entry.matchAll(/@import\s+["'](.+?)["'];/g)].map((match) => match[1]);

  assert.deepEqual(imports, [
    "./projects/base.css",
    "./projects/previews.css",
    "./projects/responsive.css",
    "./projects/background.css",
    "./projects/mobile-device.css",
  ]);
  assert.equal(entry.trim().split("\n").length, 5);
});

test("project style import graph still includes desktop and mobile project behavior", () => {
  const source = readCssWithImports("../web/styles/projects.css");

  assert.match(source, /\.proj-card\s*\{/);
  assert.match(source, /\.proj-carousel__slide\.on\s*\{/);
  assert.match(source, /\.proj-bg-layer\[data-idx="6"\]/);
  assert.match(source, /:root\.device-mobile-or-tablet \.proj-scene__bg-plane\.theme-orange/);
  assert.match(source, /:root\.device-mobile-or-tablet \.aris-thread-frame \.aris-thread/);
});
