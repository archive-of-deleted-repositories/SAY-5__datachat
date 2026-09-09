import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { patchPlotlyBundle } from "../security/plotly-attribution-patch.mjs";

const require = createRequire(import.meta.url);
const source = readFileSync(require.resolve("plotly.js-dist-min"), "utf8");

test("the pinned full bundle preserves its license and patches both attribution sinks", () => {
  const output = patchPlotlyBundle(source, "2.35.3");
  assert.ok(output.includes(source.slice(0, source.indexOf("!function"))));
  assert.equal((output.match(/innerHTML=__datachatSanitizeAttribution\(/g) ?? []).length, 2);
  assert.ok(!output.includes("this._innerContainer.innerHTML=o,"));
  assert.ok(!output.includes("this._innerContainer.innerHTML=r,"));
});

test("a different upstream version fails closed", () => {
  assert.throws(() => patchPlotlyBundle(source, "2.35.4"), /requires the reviewed 2.35.3 bundle/);
});

test("changed bytes under the same version fail closed", () => {
  assert.throws(() => patchPlotlyBundle(source + "\n", "2.35.3"), /requires the reviewed 2.35.3 bundle/);
});
