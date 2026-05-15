import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("logged-in React Grab startup stays inactive even when admin mode is requested", () => {
  const source = readFileSync("web/src/react-grab-dev.js", "utf8");
  const autoActivatesFromAdminFlag = /if\s*\(\s*adminModeRequested\s*\)\s*\{[\s\S]*?reactGrabApi\?\.\s*activate\?\.\(\)/.test(
    source,
  );

  assert.equal(
    autoActivatesFromAdminFlag,
    false,
    "startup must not auto-activate React Grab from the admin query flag",
  );
  assert.match(
    source,
    /reactGrabApi\?\.\s*setEnabled\?\.\(true\);\s*reactGrabApi\?\.\s*deactivate\?\.\(\);/,
    "authenticated startup should enable the toolbar but immediately deactivate selection mode",
  );
});
