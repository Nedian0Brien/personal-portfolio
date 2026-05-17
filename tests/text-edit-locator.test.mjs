import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { applyTextEditToSource, resolveEditableHtmlPath } from "../scripts/admin-auth-plugin.js";

test("locator-based text edit replaces the selected duplicate text only", () => {
  const source = `<!doctype html>
<html>
<head>
  <title>AI</title>
  <style>.ai::after { content: "AI"; }</style>
</head>
<body>
  <main>
    <p>AI</p>
    <section><span>AI</span></section>
  </main>
  <script>const label = "AI";</script>
</body>
</html>`;

  const legacyResult = applyTextEditToSource(source, {
    sourceText: "AI",
    replacementText: "Machine Learning",
  });

  assert.equal(legacyResult.ok, false);
  assert.equal(legacyResult.error, "source_text_not_unique");

  const result = applyTextEditToSource(source, {
    sourceText: "AI",
    replacementText: "Machine Learning",
    locator: {
      root: "body",
      elementPath: [0, 1, 0],
      textNodeIndex: 0,
    },
  });

  assert.equal(result.ok, true);
  assert.match(result.source, /<p>AI<\/p>/);
  assert.match(result.source, /<section><span>Machine Learning<\/span><\/section>/);
  assert.match(result.source, /<script>const label = "AI";<\/script>/);
});

test("locator-based text edit preserves outer whitespace and escapes replacement text", () => {
  const source = `<!doctype html><html><body><main><p> A &amp; B </p></main></body></html>`;

  const result = applyTextEditToSource(source, {
    sourceText: " A & B ",
    replacementText: "C < D",
    locator: {
      root: "body",
      elementPath: [0, 0],
      textNodeIndex: 0,
    },
  });

  assert.equal(result.ok, true);
  assert.match(result.source, /<p> C &lt; D <\/p>/);
});

test("research detail page is an allowed edit target and loads the editor bootstrap", () => {
  const detailPath = resolveEditableHtmlPath("/research/biomedical-bert-adr.html");
  assert.ok(detailPath?.endsWith("web/research/biomedical-bert-adr.html"));
  assert.equal(resolveEditableHtmlPath("/../package.json"), null);

  const detailHtml = readFileSync(detailPath, "utf8");
  assert.match(detailHtml, /import\('\/src\/react-grab-dev\.js'\)/);
  assert.match(detailHtml, /href="\/research\/biomedical-bert-adr\.css"/);
  assert.match(detailHtml, /src="\/research\/biomedical-bert-adr\.js"/);
  assert.doesNotMatch(detailHtml, /<style>/);

  const detailCss = readFileSync(new URL("../web/research/biomedical-bert-adr.css", import.meta.url), "utf8");
  const detailJs = readFileSync(new URL("../web/research/biomedical-bert-adr.js", import.meta.url), "utf8");
  assert.match(detailCss, /Reset \+ Tokens/);
  assert.match(detailJs, /Theme toggle/);
  assert.doesNotThrow(() => new Function(detailJs));
});
