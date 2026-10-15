# 🚀 Getting Started with Lupis Engine

This guide walks you through setting up Lupis Engine for local development and testing.

---

## 1. System Requirements

Before beginning, ensure you have the following installed:

- **Node.js**: `^20.19.0` or `>=22.12.0` (LTS recommended)
- **npm**: `>=10.0.0`
- **Docker & Docker Compose** (Recommended for turnkey containerized setup)
- **Modern Web Browser**: Google Chrome, Mozilla Firefox, or Microsoft Edge with WebGL 2.0 support.

---

## 2. Quick Setup with Docker Compose (Recommended)

The easiest way to run the entire Lupis Engine ecosystem (Visual Editor, Core Engine, and Backend Microservice) is using Docker Compose:

```bash
# 1. Clone the repository
git clone https://github.com/haikaladnan/lupis-engine.git
cd lupis-engine

# 2. Launch all services
docker compose -f start.yml up
```

Once all containers are built and initialized, open your browser:

| Service | URL | Description |
| :--- | :--- | :--- |
| **Visual Editor** | `http://localhost:6500` | The primary visual studio UI |
| **Core Runtime** | `http://localhost:8080` | Engine runtime standalone server |
| **Backend Service**| `http://localhost:4000` | MSDF Font & packaging service |

To run the containerized E2E test suite:
```bash
docker compose -f start.yml --profile testing up e2e
```

---

## 3. Local Native Setup (Without Docker)

You can also run each component locally on your host machine for faster development iterations:

### 3.1 Setup Backend Service
```bash
cd service
npm install
npm run dev
# Service starts on http://localhost:4000
```

### 3.2 Setup Core Engine Runtime
The `core/` folder contains pure static ES Modules and an `index.html`. You can serve it with any static HTTP server (e.g., `serve` or `http-server`):
```bash
cd core
npx serve -l 8080 .
# Core runtime available at http://localhost:8080
```

### 3.3 Setup Visual Editor
```bash
cd editor
npm install
npm run dev
# Vite dev server starts on http://localhost:6500
```

---

## 4. Running Tests

Lupis Engine includes both unit tests and end-to-end (E2E) automated test suites:

### 4.1 Editor Unit Tests (Vitest)
```bash
cd editor
# Run tests once
npm run test:run

# Run tests in watch mode
npm run test
```

### 4.2 E2E Static Standard Check
Verify that all E2E spec files conform to strict coding standards (e.g. no hardcoded timeouts, proper fixture usage):
```bash
node tests/scripts/check-standard.mjs
```

### 4.3 End-to-End Tests (Playwright)
```bash
cd tests
npm install
npx playwright install chromium

# Run all Chromium E2E specs
npm run test

# Run interactive UI mode
npm run test:ui

# Run Blueprint visual scripting tests
npm run test:blueprint
```

---

## 5. Next Steps

- Explore the [Core Engine API Reference](file:///D:/Project/Lupis%20Engine/docs/core-api.md) to understand how scenes and entities are created.
- Check out the [Visual Scripting Guide](file:///D:/Project/Lupis%20Engine/docs/visual-scripting.md) to build node-graph behaviors.
- Browse working code demos in the [`examples/`](file:///D:/Project/Lupis%20Engine/examples/) directory.
