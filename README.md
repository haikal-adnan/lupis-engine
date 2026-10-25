<div align="center">

<img alt="Lupis Engine logo" width="128" height="128" src="https://github.com/user-attachments/assets/54a69b7c-acfd-4ef6-b4ef-5a9397a169c4" />

# Lupis Engine

**A WebGL game engine written in native JavaScript, with a node-based visual editor.**

[![Version](https://img.shields.io/badge/version-0.1.0_(early_release)-orange)](./CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/haikal-adnan/lupis-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/haikal-adnan/lupis-engine/actions/workflows/ci.yml)

> **Early Release.** v0.1.0 is the first public release. The public API and project file format may change before 1.0.

<!-- TODO: Replace with an actual editor screenshot or GIF -->
<img alt="Lupis Engine Editor preview" width="720" src="https://via.placeholder.com/720x405?text=Editor+Screenshot+Placeholder" />

<br/>

[Quick Start](#quick-start) · [Documentation](#documentation) · [Contributing](#contributing)

</div>

---

## Features

- **Pure WebGL rendering.** All rendering runs on WebGL (2.0 with a 1.0 fallback) and does not use the Canvas 2D API.
- **Visual editor built with Vue 3.** Author scenes with the hierarchy, inspector, and asset browser directly in the browser.
- **Blueprint-style visual scripting.** 100+ production nodes across 10 domains let you build game logic without writing code.
- **In-editor JavaScript scripting.** Write JavaScript directly in the editor for logic that goes beyond the node graph.
- **Built-in 2D engine tools.** Includes built-in editor management for Collision physics, Tilemaps, Geometry Shapes, and Animator systems.
- **MSDF text rendering.** Text stays sharp at any size and does not depend on the Canvas 2D text API.
- **Local-first.** Run the entire stack with a single `docker compose` command or `npm run dev`.
- **Export and packaging.** Export projects as ZIP archives, or package them as desktop applications with Electron.

---

## Project Status

 Lupis Engine v0.1.0 is an early release. While core rendering, the editor, and visual scripting are covered by automated tests, some features may not yet be fully covered. Currently, the editor and desktop tooling are available exclusively on Windows, with cross-platform support planned for future releases. Expect rough edges and breaking changes before 1.0. If you build on top of the engine, pin your dependencies to a specific version. Bug reports and feedback are highly appreciated—if you would like to contribute to the project, please see our Contribution Guidelines.

---

## Quick Start

### Prerequisites

- **Node.js** `^20.19` or `>=22.12`
- **Docker and Docker Compose** (optional, for single-command setup)

### Run with Docker (recommended)

```bash
git clone https://github.com/haikal-adnan/lupis-engine.git
cd lupis-engine
docker compose -f start.yml up
```

Open **http://localhost:6500** to start using the editor.

### Run without Docker

```bash
git clone https://github.com/haikal-adnan/lupis-engine.git
cd lupis-engine

# Terminal 1: backend service
cd service && npm install && npm run dev

# Terminal 2: editor
cd editor && npm install && npm run dev
```

Open **http://localhost:6500**, then load one of the sample projects from the [`examples/`](./examples) folder.

---

## Repository Structure

```
lupis-engine/
├── core/        # Engine runtime: WebGL renderer, physics, audio, ECS, scripting
├── editor/      # Visual editor (Vue 3, Pinia, Vite), served on port 6500
├── service/     # Node.js backend: MSDF font generation, export, Electron packaging
├── tests/       # E2E and integration tests (Playwright)
├── examples/    # Ready-to-run sample projects
└── .github/     # CI workflows and issue templates
```

---

## Documentation

### For Game Developers

The full documentation is available **inside the editor** as a built-in help panel. It can also be read directly from the JSON files in [`editor/public/docs/`](./editor/public/docs).

| Category | Contents |
| --- | --- |
| [Getting Started](./editor/public/docs/getting_started) | Installation, introduction, quick start, projects and export |
| [Interface](./editor/public/docs/interface) | Editor overview, viewport, hierarchy, inspector, shortcuts |
| [Components](./editor/public/docs/components) | Transform, renderers, physics body, audio, animator, and more |
| [Visual Scripting](./editor/public/docs/visual_scripting) | Graph concepts, context system, variables, custom nodes |
| [Behaviour](./editor/public/docs/behaviour) | Movement, physics and collision, UI patterns |
| [Tutorials](./editor/public/docs/tutorials) | First platformer, top-down game, game UI |

### For Contributors

| Document | Description |
| --- | --- |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Development setup, code style, pull request guidelines |
| [`CHANGELOG.md`](./CHANGELOG.md) | Release history |

---

## Security and Scripting Limitations

User scripts (JavaScript and Blueprint) run in the context of the local editor in the browser, **without process or iframe sandboxing**. This is acceptable for local use, but note the following:

- **Do not host the editor on a public URL** where untrusted users can load projects. User scripts have full access to the page.
- Exported games contain user code that runs in the player's browser.

For full details and instructions on reporting vulnerabilities, see [`SECURITY.md`](./SECURITY.md).

---

## Testing

```bash
# Editor unit and integration tests (Vitest)
cd editor && npm run test:run

# Static standards checks
node tests/scripts/check-standard.mjs

# E2E browser tests (Playwright, Chromium)
cd tests && npm test

# Blueprint runtime tests (Playwright)
cd tests && npm run test:blueprint
```

CI runs the full test suite on every push and pull request via GitHub Actions.

---

## Contributing

We welcome **bug reports**, **feedback on the engine and editor**, and **documentation improvements**. For larger features, please open an issue to discuss the proposal first. At this early stage, we want to keep the architecture stable.

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the complete guide.

---

## Roadmap to v0.2.0

The following items are planned and subject to change.

- **Tilemap editor.** Paint tilemaps directly in the viewport.
- **Rendering performance.** Instanced draw calls and frustum culling for large scenes.
- **Physics improvements.** Slope handling, one-way platforms, and physics materials.
- **Plugin system.** An API for custom Blueprint nodes and editor panels.
- **Mobile export.** A Capacitor/TWA wrapper for Android builds.

---

## License

Released under the [MIT License](./LICENSE). Copyright © 2026 Haikal Adnan and contributors.