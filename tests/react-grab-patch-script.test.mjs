import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import test from "node:test";

test("react-grab patch carries selected element class into the discard prompt label", () => {
  execFileSync("node", ["scripts/patch-react-grab.js"], { stdio: "pipe" });

  const distIndex = readFileSync("node_modules/react-grab/dist/index.js", "utf8");
  const runtimeCoreFile = distIndex.match(/from"\.\/(core-[^"]+\.js)"/)?.[1];
  assert.ok(runtimeCoreFile, "expected the react-grab dist entry to import a runtime core bundle");

  const runtimeCoreSource = readFileSync(`node_modules/react-grab/dist/${runtimeCoreFile}`, "utf8");
  assert.equal(
    runtimeCoreSource.includes("selectionClassName"),
    true,
    "runtime core passes the selected element class name to the renderer",
  );

  const runtimeRendererFile = runtimeCoreSource.match(/import\(`\.\/(renderer-[^`]+\.js)`\)/)?.[1];
  assert.ok(runtimeRendererFile, "expected the runtime core to import a renderer bundle");

  const runtimeRendererSource = readFileSync(`node_modules/react-grab/dist/${runtimeRendererFile}`, "utf8");
  assert.equal(
    runtimeRendererSource.includes("selectionClassName"),
    true,
    "runtime renderer receives the selected element class name",
  );
  assert.equal(
    runtimeRendererSource.includes("portfolioFormatElementIdentity"),
    true,
    "runtime renderer formats the discard prompt label as an element identity",
  );

  const distFiles = readdirSync("node_modules/react-grab/dist");
  const rendererSource = distFiles
    .filter((file) => /^renderer-.*\.js$/.test(file))
    .map((file) => readFileSync(`node_modules/react-grab/dist/${file}`, "utf8"))
    .find((source) => source.includes("data-react-grab-discard-prompt"));

  assert.ok(rendererSource, "expected a react-grab renderer bundle");
  assert.equal(
    rendererSource.includes("selectionClassName"),
    true,
    "renderer receives the selected element class name",
  );
  assert.equal(
    rendererSource.includes("portfolioFormatElementIdentity"),
    true,
    "renderer formats the discard prompt label as an element identity",
  );

  const coreSource = distFiles
    .filter((file) => /^core-.*\.js$/.test(file))
    .map((file) => readFileSync(`node_modules/react-grab/dist/${file}`, "utf8"))
    .find((source) => source.includes("selectionComponentName"));

  assert.ok(coreSource, "expected a react-grab core bundle");
  assert.equal(
    coreSource.includes("selectionClassName"),
    true,
    "core passes the selected element class name to the renderer",
  );

  const viteCore = "node_modules/.vite/deps/react-grab.js";
  if (existsSync("node_modules/.vite/deps")) {
    const viteRendererSource = readdirSync("node_modules/.vite/deps")
      .filter((file) => /^renderer-.*\.js$/.test(file))
      .map((file) => readFileSync(`node_modules/.vite/deps/${file}`, "utf8"))
      .find((source) => source.includes("data-react-grab-discard-prompt"));

    assert.ok(viteRendererSource, "expected a Vite renderer bundle");
    assert.equal(
      viteRendererSource.includes("selectionClassName"),
      true,
      "Vite renderer receives the selected element class name",
    );
    assert.equal(
      viteRendererSource.includes("portfolioFormatElementIdentity"),
      true,
      "Vite renderer formats the discard prompt label as an element identity",
    );
  }
  if (existsSync(viteCore)) {
    const viteCoreSource = readFileSync(viteCore, "utf8");
    assert.equal(
      viteCoreSource.includes("selectionClassName"),
      true,
      "Vite core passes the selected element class name to the renderer",
    );
  }
});
