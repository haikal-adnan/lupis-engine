# Getting started

Set up Lupis Engine for local development and run the test suites.

## Requirements

- Node.js `^20.19.0` or `>=22.12.0`
- npm `>=10.0.0`
- Docker and Docker Compose (optional, for the containerized setup)
- A browser with WebGL 2.0 support (Chrome, Firefox, or Edge)

## Run with Docker Compose

```bash
git clone https://github.com/haikal-adnan/lupis-engine.git
cd lupis-engine
docker compose -f start.yml up
```

| Service | URL | Purpose |
| :--- | :--- | :--- |
| Editor | `http://localhost:6500` | Visual editor |
| Core runtime | `http://localhost:8080` | Standalone engine runtime |
| Backend service | `http://localhost:4000` | MSDF font conversion and export packaging |

Run the containerized E2E suite:

```bash
docker compose -f start.yml --profile testing up e2e
```

## Run without Docker

Start each component in its own terminal.

**Backend service**

```bash
cd service
npm install
npm run dev     # http://localhost:4000
```

**Core runtime.** `core/` is static ES modules plus an `index.html`. Any static file server works.

```bash
cd core
npx serve -l 8080 .     # http://localhost:8080
```

**Editor**

```bash
cd editor
npm install
npm run dev     # http://localhost:6500
```

## Run the tests

**Editor unit tests (Vitest)**

```bash
cd editor
npm run test:run     # single run
npm run test         # watch mode
```

**E2E standard check.** Static check that every E2E spec follows the project rules (no hardcoded timeouts, fixtures used correctly).

```bash
node tests/scripts/check-standard.mjs
```

**E2E tests (Playwright)**

```bash
cd tests
npm install
npx playwright install chromium

npm run test             # all Chromium specs
npm run test:ui          # Playwright UI mode
npm run test:blueprint   # visual scripting specs only
```

## Next steps

- [Architecture Overview](architecture.md): explore the 3-tier system design and runtime loop.
- [Visual scripting](visual-scripting.md): build behavior with the 10 domain modules and 128 nodes.
- [Context System](context-system.md): inspect runtime facades and execution context contracts.
- [Visual Editor Guide](editor-guide.md): master editor panels, gizmos, and workflows.
- [Core API](core-api.md): create scenes and entities programmatically.
- [`examples/`](../examples/): explore standalone runnable demos.
