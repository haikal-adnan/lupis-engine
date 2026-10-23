# Lupis Engine documentation

Lupis Engine is a web-based 2D/2.5D game engine with a visual editor. The runtime uses WebGL 2 and vanilla ES modules, the editor is built on Vue 3, and a small Node.js service handles font conversion and export packaging.

## Documents

| Document | Read it to |
| :--- | :--- |
| [Getting started](getting-started.md) | Install, run, and test the project locally. |
| [Architecture](architecture.md) | Understand how the runtime, editor, and service fit together. |
| [Core API](core-api.md) | Start the engine, create entities, and use the runtime subsystems. |
| [Visual scripting](visual-scripting.md) | Understand blueprint graphs, pins, and script execution. |
| [Blueprint nodes](blueprint-nodes.md) | Reference all 165 built-in blueprint nodes, ports, options, and defaults. |
| [Context System](context-system.md) | Reference the runtime scripting facade, domains, and assertion contracts. |
| [Dashboard & Project Management](markdown/dashboard.md) | Manage projects, import/export archives, and configure OPFS workspace storage. |
| [Scene Hierarchy](markdown/scene-hierarchy.md) | Organize scenes, world and UI layers, entity parent-child trees, and prefabs. |
| [Bottom Dock Panels](markdown/bottom-dock.md) | Manage assets, world/UI prefabs, runtime console diagnostics, and blueprint scripts. |
| [Editor guide](editor-guide.md) | Use the editor: panels, tools, assets, shortcuts. |
| [Editor shortcuts](editor-shortcuts.md) | Look up all keyboard and mouse shortcuts mapped across editor tabs and tools. |
| [Editor menus](editor-menus.md) | Reference all context menus, dropdowns, and burger menus across the editor. |
| [Editor reference](editor-reference.md) | Work on the editor codebase: stores, history, compiler, bridge. |
| [Schema contract](schema-contract.md) | Look up the authoritative data schemas, file formats, bridge events, and REST API. |

When documents disagree, [schema-contract.md](schema-contract.md) wins.

## Repository layout

| Directory | Contents | Default port |
| :--- | :--- | :--- |
| `core/` | Runtime engine (ES modules, WebGL 2) | 8080 |
| `editor/` | Visual editor (Vue 3, Pinia, Vite) | 6500 |
| `service/` | Node.js service: MSDF font conversion, project export | 4000 |
| `tests/` | Playwright end-to-end tests | n/a |

## Quick start

```bash
# All services
docker compose -f start.yml up

# Editor only
cd editor && npm install && npm run dev

# Editor unit tests
cd editor && npm run test:run

# E2E spec standard check
node tests/scripts/check-standard.mjs
```

See [Getting started](getting-started.md) for requirements and the full setup.
