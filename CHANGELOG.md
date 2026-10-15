# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- WebGPU experimental rendering backend.
- Tilemap autotiling bitmask generator.
- Multi-user collaborative editing via WebSockets.
- WASM-accelerated physics solver.

---

## [1.0.0] - 2026-10-15

### Added
- **Core Engine Runtime**:
  - WebGL2 and WebGL1 fallback rendering pipeline with dynamic batching.
  - Multi-batch `ShapeRenderer` supporting rectangles, circles, and custom polygons with anti-aliasing.
  - High-performance `ImageRenderer` with texture atlas support, sprite flipping, and tinting.
  - Crisp Multi-channel Signed Distance Field (MSDF) `TextRenderer`.
  - 2D Rigid Body `PhysicsSystem` supporting gravity, friction, velocity clamps, and atmospheric drag.
  - Kinematic `ColliderSystem` with AABB / Box / Circle colliders and smooth `MoveAndSlide` wall sliding.
  - Web Audio API `AudioSystem` with master gain, pitch alteration, smooth fade-in, and spatial HRTF panning.
  - Modular Scene, Entity, Prefab, and Layer hierarchy management.
- **Visual Editor Studio**:
  - Modern web-based IDE built with Vue 3, Pinia, Vite, and Tailwind CSS.
  - Real-time interactive Viewport with Transform Gizmos (Move, Rotate, Scale), Grid, and Rulers.
  - Visual Blueprint Node Graph editor with custom wire routing, type-colored pins, and node inspector.
  - Asset Manager supporting drag-and-drop sprites, audio, and font imports.
  - Live in-editor runtime preview with hot state synchronization via EventBus.
- **Backend Microservice**:
  - Express-based utility service for on-the-fly MSDF font atlas generation (`msdf-bmfont-xml`).
  - Project archiver and packager for web exports.
  - Electron desktop executable bundling workflow.
- **Testing & Quality Assurance**:
  - Extensive Playwright End-to-End (E2E) automated test suite covering all editor workflows and Blueprint nodes.
  - Isolated contract testing for engine helpers and event bus monitors.
  - Zero-dependency static standard linter (`tests/scripts/check-standard.mjs`).
  - Unit tests with Vitest covering core utility functions and editor stores.
- **Open Source Infrastructure**:
  - GitHub Actions CI workflow for linting, testing, and distribution builds.
  - Docker Compose turnkey deployment configuration (`start.yml`).
  - Structured GitHub Issue Forms and Pull Request template.
  - Comprehensive technical architecture documentation and runnable minimal feature examples.
