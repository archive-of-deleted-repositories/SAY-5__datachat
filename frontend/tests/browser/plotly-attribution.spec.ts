import { expect, test } from "@playwright/test";

const attribution = '<a href="https://example.test/credit" title="Map credit">Synthetic credit</a>'
  + '<a href="javascript:window.__unsafeAttribution=true" onclick="window.__unsafeAttribution=true" onmouseover="window.__unsafeAttribution=true">Bad link</a>'
  + '<img src="/synthetic-missing-image" onerror="window.__unsafeAttribution=true">';

for (const engine of ["map", "mapbox"] as const) {
  test(`${engine} sanitizes attribution fetched from a remote style`, async ({ page, baseURL }) => {
    let styleRequests = 0;
    await page.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (url.pathname === "/synthetic-style.json") {
        styleRequests += 1;
        return route.fulfill({ json: {
          version: 8,
          sources: { synthetic: {
            type: "geojson",
            data: { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [0, 0] } }] },
            attribution,
          } },
          layers: [{ id: "synthetic", type: "circle", source: "synthetic", paint: { "circle-color": "#b23b20", "circle-radius": 10 } }],
        } });
      }
      if (url.pathname === "/synthetic-missing-image") return route.fulfill({ status: 404, body: "" });
      if (url.origin === baseURL) return route.continue();
      return route.abort();
    });
    await page.goto("/tests/fixtures/plotly.html");
    await page.waitForFunction(() => typeof (window as any).renderFigure === "function");
    await page.evaluate(async kind => {
      await (window as any).renderFigure([{ type: `scatter${kind}`, lon: [0], lat: [0], mode: "markers" }], {
        [kind]: { style: `${location.origin}/synthetic-style.json`, center: { lon: 0, lat: 0 }, zoom: 1 },
        margin: { t: 0, b: 0, l: 0, r: 0 },
      });
    }, engine);
    const control = page.locator(engine === "map" ? ".maplibregl-ctrl-attrib-inner" : ".mapboxgl-ctrl-attrib-inner");
    await expect(control).toContainText("Synthetic credit");
    expect(styleRequests).toBeGreaterThan(0);
    await expect(control.locator('a[href="https://example.test/credit"]')).toHaveAttribute("title", "Map credit");
    expect(await control.locator('img, [onclick], [onmouseover], a[href^="javascript:"]').count()).toBe(0);
    expect(await page.evaluate(() => (window as any).__unsafeAttribution)).toBeUndefined();
    await page.evaluate(() => (window as any).purgeFigure());
    await expect(page.locator("canvas")).toHaveCount(0);
  });
}

test("the full chart bundle still renders a cartesian figure", async ({ page, baseURL }) => {
  await page.route("**/*", route => new URL(route.request().url()).origin === baseURL ? route.continue() : route.abort());
  await page.goto("/tests/fixtures/plotly.html");
  await page.waitForFunction(() => typeof (window as any).renderFigure === "function");
  await page.evaluate(() => (window as any).renderFigure([{ type: "bar", x: ["One", "Two"], y: [1, 2] }], { title: "Synthetic chart" }));
  await expect(page.locator(".barlayer .point")).toHaveCount(2);
  await expect(page.locator(".gtitle")).toHaveText("Synthetic chart");
});
