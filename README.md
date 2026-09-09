# DataChat

An AI-powered data analysis chat. Ask a question in English; the
assistant streams Python code; the backend executes it in a sandboxed
subprocess; the React UI renders the resulting Plotly chart inline.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the design writeup
(sandbox model, streaming protocol, performance targets).

## Quick start

```bash
pip install -e ".[dev]"
datachat serve --port 8080
cd frontend && npm ci && npm run dev
```

Open http://localhost:5173. The mock LLM is the default — no API key
required. The 10k-row `demo_orders` dataset is seeded on first run.

For real OpenAI:

```bash
pip install -e ".[dev,openai]"
export OPENAI_API_KEY=...
DATACHAT_LLM=openai datachat serve
```

## Companion projects

Part of a seven-repo set:

- **[canvaslive](https://github.com/SAY-5/canvaslive)** — multiplayer OT whiteboard
- **[pluginforge](https://github.com/SAY-5/pluginforge)** — Web Worker plugin sandbox
- **[agentlab](https://github.com/SAY-5/agentlab)** — AI agent eval harness
- **[payflow](https://github.com/SAY-5/payflow)** — payments API
- **[queryflow](https://github.com/SAY-5/queryflow)** — natural-language SQL
- **[datachat](https://github.com/SAY-5/datachat)** — you're here. AI data analysis.
- **[distributedkv](https://github.com/SAY-5/distributedkv)** — sharded KV with Raft

## License

MIT.

## Frontend checks and chart security

Use Node.js 20.19+, 22.13+, or 24+ for the frontend toolchain. Vite 7 targets modern browsers by default (Chrome/Edge 107+, Firefox 104+, Safari 16+).

```bash
cd frontend
npm ci
npm test
npx playwright install chromium
npm run test:browser
npm run build
```

The browser tests use synthetic map styles and block external requests. They exercise the full Plotly bundle through both the development server and a production fixture build. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` only when using an existing compatible Chromium installation.

Plotly's prebuilt bundle embeds map engines that are invisible to `npm audit`. The frontend pins the full `plotly.js-dist-min@2.35.3` bundle to preserve existing map and legacy Mapbox trace types. Its Vite loader applies DOMPurify 3.4.15+ at the final attribution HTML sink in each embedded map engine, including attribution received through remote styles/sources. This follows the attribution-sanitization workaround described in [GHSA-jrc7-96c5-q579](https://github.com/maplibre/maplibre-gl-js/security/advisories/GHSA-jrc7-96c5-q579). It is an application-maintained mitigation; the embedded engines have not been upgraded to a patched upstream release. A clean package audit alone does not establish their safety.

The loader checks the exact package version, SHA-256, and both sink occurrences and stops the build if they change. Do not update the version/hash or bypass the loader without reviewing the new bundle and rerunning the security regressions. The tests cover malicious adjacent event attributes, JavaScript URLs, image handlers, legitimate attribution links, map cleanup, and a cartesian chart. The production build includes `THIRD-PARTY-LICENSES.txt` for Plotly and DOMPurify. This mitigation covers attribution insertion; it is not a general audit of every embedded map feature.
