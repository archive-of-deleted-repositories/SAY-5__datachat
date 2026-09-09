import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const version = "2.35.3";
const sha256 = "fc84e3cfa55d23d3654c562ea5deb3c274eb6972a6adf66941d1a821e34825e4";
const virtualId = "\0datachat:plotly-attribution";

// Both bundled map engines receive attribution from remote style/source JSON.
// Patch their final HTML sinks so those paths also pass through the sanitizer.
// Re-review the upstream bundle and browser regressions before changing this pin.
export function patchPlotlyBundle(source, installedVersion) {
  if (installedVersion !== version || createHash("sha256").update(source).digest("hex") !== sha256) {
    throw new Error("Plotly attribution mitigation requires the reviewed 2.35.3 bundle. Review the upstream code and browser regressions before updating its version/hash.");
  }
  for (const value of ["o", "r"]) {
    const sink = `this._innerContainer.innerHTML=${value},`;
    if (source.split(sink).length !== 2) {
      throw new Error(`Expected exactly one reviewed Plotly attribution sink: ${sink}`);
    }
    source = source.replace(sink, `this._innerContainer.innerHTML=__datachatSanitizeAttribution(${value}),`);
  }
  return `import DOMPurify from "dompurify";
const __datachatSanitizeAttribution = (html) => DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ["a", "span", "strong", "b", "em", "i", "br"],
  ALLOWED_ATTR: ["href", "title", "class", "rel", "target"],
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false,
});
// Keep the original UMD bundle and its license notice inside a local CJS scope.
const module = { exports: {} };
const exports = module.exports;
${source}
export default module.exports;
`;
}

export function plotlyAttributionPatch() {
  return {
    name: "datachat-plotly-attribution-sanitizer",
    enforce: "pre",
    config() {
      // Otherwise Vite's dev dependency optimizer can bypass this loader.
      return { optimizeDeps: { exclude: ["plotly.js-dist-min"] } };
    },
    resolveId(id) {
      if (id === "plotly.js-dist-min") return virtualId;
    },
    load(id) {
      if (id !== virtualId) return;
      const manifest = require.resolve("plotly.js-dist-min/package.json");
      const installed = JSON.parse(readFileSync(manifest, "utf8"));
      const source = readFileSync(join(dirname(manifest), "plotly.min.js"), "utf8");
      return patchPlotlyBundle(source, installed.version);
    },
    generateBundle() {
      const plotlyLicense = readFileSync(join(dirname(require.resolve("plotly.js-dist-min/package.json")), "LICENSE"), "utf8");
      const purifierLicense = readFileSync(join(dirname(require.resolve("dompurify")), "../LICENSE"), "utf8");
      this.emitFile({ type: "asset", fileName: "THIRD-PARTY-LICENSES.txt", source: `Plotly.js ${version}\n\n${plotlyLicense}\n\nDOMPurify\n\n${purifierLicense}` });
    },
  };
}
