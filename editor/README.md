# Lupis Studio Visual Editor

The Lupis Studio Visual Editor is a modern, responsive web-based game development studio built with Vue 3, Pinia, Tailwind CSS, and Vite. It serves as the primary authoring environment for Lupis Engine projects, providing real-time scene layout, entity-component configuration, visual node-graph scripting, 2D sprite keyframing, and tilemap painting.

---

## Technical Stack

- **Framework**: Vue 3 (Composition API with `<script setup>`)
- **State Management**: Pinia 3
- **Routing**: Vue Router 4 (HTML5 History mode)
- **Styling**: Tailwind CSS 3 with PostCSS and Autoprefixer
- **Build Tool**: Vite 7
- **Icons**: Lucide Vue Next
- **Storage**: Origin Private File System (OPFS), Dexie, and IndexedDB
- **Test Harness**: Vitest 5 with Happy-DOM environment

---

## Directory Organization

```text
editor/
├── public/                      # Static assets and in-app documentation JSON files
━E  ├── docs/                    # In-editor interactive documentation database
━E  └── favicon.ico
├── src/
━E  ├── app/                     # App bootstrapping and router configuration
━E  ├── assets/                  # CSS stylesheets, animations, and global Tailwind imports
━E  ├── features/                # Domain-driven feature modules
━E  ━E  ├── animators/           # 2D Sprite Animator Editor and clip hierarchy
━E  ━E  ├── assets/              # Asset browser, file uploading, and OPFS caching
━E  ━E  ├── builders/            # Interactive shape builder and tilemap brush logic
━E  ━E  ├── consoles/            # Real-time runtime console and log filters
━E  ━E  ├── dashboards/          # Project dashboard and template creation
━E  ━E  ├── docs/                # In-app documentation browser component
━E  ━E  ├── engines/             # EventBus bridge and synchronization with WebGL core
━E  ━E  ├── folders/             # Folder tree management for project assets
━E  ━E  ├── historys/            # Atomic undo/redo transaction engine
━E  ━E  ├── inspectors/          # Property inspector and ECS component bindings
━E  ━E  ├── nodes/               # Visual scripting logic canvas
━E  ━E  ├── opfs/                # Origin Private File System storage abstractions
━E  ━E  ├── prefabs/             # Reusable entity-component templates
━E  ━E  ├── projects/            # Project manifest serialization, persistence, and watchers
━E  ━E  ├── scenes/              # Scene hierarchy, entity tree, and layer management
━E  ━E  ├── scripts/             # Script compilation, normalization, and AST validation
━E  ━E  ├── settings/            # Workspace and project settings modals
━E  ━E  ├── viewports/           # WebGL viewport canvas, transform gizmo, and header tabs
━E  ━E  └── workspaces/          # Multi-tab layout coordinator
━E  ├── layouts/                 # Master shell layouts (EditorLayout, MainLayout, EditorView)
━E  └── utils/                   # Binary project encoders, UUID generators, and transform math
└── tests/                       # Vitest integration and system test suite
```

---

## Getting Started

### Prerequisites

- Node.js `^20.19.0 || >=22.12.0`
- npm or yarn

### Installation

```bash
# Navigate to the editor directory
cd editor

# Install dependencies
npm install
```

### Development Server

Start the local Vite development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

By default, the editor is accessible at [http://localhost:37600](http://localhost:37600).

### Production Build

Compile and bundle the editor for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## Testing

Lupis Editor enforces high code quality through extensive unit, integration, and system tests written in Vitest.

```bash
# Run tests in watch mode
npm run test

# Run the complete test suite once
npm run test:run
```

All 1,060+ unit and integration tests across 88 test suites must pass prior to opening a Pull Request.

---

## Key Architectural Patterns

### 1. Decoupled Core Runtime
The editor does not directly execute game physics or rendering inside Vue components. Instead, it delegates rendering to the standalone WebGL core engine via `engineBridge` over an internal EventBus. This guarantees that runtime performance is independent of editor UI rendering overhead.

### 2. Transactional History
All mutations to scenes, entities, tilemaps, animators, and node graphs are recorded through `useHistory`. Operations are encapsulated as atomic `{ undo, redo }` commands, supporting continuous multi-event batching for drag operations and stroke actions.

### 3. Strict Schema Validation
Data structures passed between the editor, storage, and core runtime are validated and normalized using strict schemas (`projectSchema`, `sceneSchema`, `entitySchema`, `componentSchema`, `assetSchema`).

---

## Contributing

We welcome contributions to the Lupis Studio Editor. Please review the root [CONTRIBUTING.md](../CONTRIBUTING.md) guide for details on our development workflow, coding conventions, and pull request standards.
