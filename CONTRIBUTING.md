# Contributing to Lupis Engine

Thank you for your interest in contributing to **Lupis Engine**. We welcome contributions from developers, game designers, technical writers, and artists of all experience levels. This guide explains how to set up your environment, run the tests, and submit your changes.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Before You Start](#before-you-start)
- [Development Setup](#development-setup)
- [Testing Guidelines](#testing-guidelines)
- [Visual Scripting Node Standards](#visual-scripting-node-standards)
- [Commit Convention](#commit-convention)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Getting Help](#getting-help)

---

## Code of Conduct

We are committed to maintaining a welcoming, inclusive, and harassment-free community. All participants are expected to be respectful, constructive, and collaborative in discussions, issues, and pull requests.

---

## Ways to Contribute

- **Report bugs.** Submit a detailed report through the [GitHub Issue Chooser](https://github.com/haikal-adnan/lupis-engine/issues/new/choose). The [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.yml) lists the information we need.
- **Suggest features.** Propose ideas and architectural improvements through the [GitHub Issue Chooser](https://github.com/haikal-adnan/lupis-engine/issues/new/choose). The [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.yml) describes the expected format.
- **Join community discussions.** Ask questions, share ideas, and connect with other developers on [Discord](https://haikal-adnan.github.io/lupis-engine-link?go=discord) or [GitHub Discussions](https://github.com/haikal-adnan/lupis-engine/discussions).
- **Improve documentation.** Fix errors, add tutorials, or expand explanations in [`editor/public/docs/`](editor/public/docs/). The published version is available in the [Online Documentation](https://haikal-adnan.github.io/lupis-engine-link?go=docs-en).
- **Submit code.** Implement bug fixes, performance improvements, or new Blueprint nodes that follow the [Visual Scripting Node Standards](#visual-scripting-node-standards).

---

## Before You Start

Lupis Engine is an early release, and we want to keep the architecture stable.

- For bug fixes and documentation improvements, you can open a pull request directly.
- For larger features or architectural changes, please open an issue first so the proposal can be discussed before you invest time in the implementation.

---

## Development Setup

### Prerequisites

- **Node.js:** `^20.19.0` or `>=22.12.0`
- **npm:** `>=10.0.0`
- **Docker and Docker Compose:** Optional. Recommended for a single-command setup.

### Fork and Clone

Fork the repository on GitHub, then clone your fork and create a branch for your work:

```bash
git clone https://github.com/<your-username>/lupis-engine.git
cd lupis-engine
git checkout -b feature/my-feature
```

### Run with Docker Compose

```bash
docker compose -f start.yml up
```

The following services become available:

| Service         | URL                      |
| --------------- | ------------------------ |
| Editor          | `http://localhost:37600` |
| Engine Core     | `http://localhost:37601` |
| Backend Service | `http://localhost:37602` |

### Run Locally (Without Docker)

```bash
# Terminal 1: Backend service
cd service && npm install && npm run dev

# Terminal 2: Visual editor
cd editor && npm install && npm run dev
```

---

## Testing Guidelines

Before submitting code, confirm that all tests and static checks pass locally. The project uses Vitest for editor tests and Playwright for end-to-end tests, and it enforces strict Playwright standards.

### 1. Editor Unit and Integration Tests (Vitest)

These tests cover the visual editor, store actions, canvas logic, and node Blueprint contracts.

```bash
cd editor

# Run the full test suite once
npm run test:run

# Or run tests in watch mode during development
npm run test
```

### 2. Static Standards and Lint Checks

The Playwright standards require no hardcoded timeouts, no raw CSS class assertions, fixture isolation, and strict port naming. Run both checks below to verify them:

```bash
# Verify end-to-end standards compliance
node tests/scripts/check-standard.mjs

# Verify end-to-end ESLint rules
cd tests && npx eslint e2e
```

### 3. Playwright End-to-End Tests

End-to-end tests verify editor workflows, canvas synchronization, and game previews in a real browser.

#### Initial Setup

On your first run, install the test dependencies and download the Chromium browser:

```bash
cd tests
npm install
npx playwright install chromium
```

> [!NOTE]
> When you run end-to-end tests locally, Playwright automatically starts the backend service (`http://localhost:37602`) and the visual editor (`http://localhost:37600`) in the background if they are not already running.

#### Running Tests

Run these commands from the `tests` directory:

| Command                  | Description                                                    |
| ------------------------ | -------------------------------------------------------------- |
| `npm test`               | Runs the standard Chromium feature tests.                      |
| `npm run test:all`       | Runs all feature tests (Chromium UI and Blueprint runtime).    |
| `npm run test:blueprint` | Runs the Blueprint WebGL runtime logic tests.                  |
| `npm run test:contract`  | Runs the shared helper contract tests.                         |
| `npm run test:finalize`  | Runs the complete suite (contract, Chromium, and Blueprint).   |
| `npm run test:ui`        | Opens Playwright UI mode for visual debugging.                 |

---

## Commit Convention

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description>
```

### Allowed Types

| Type       | Purpose                                                     | Example                                                   |
| ---------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| `feat`     | A new feature                                               | `feat(nodes): add vector math normalize node`             |
| `fix`      | A bug fix                                                   | `fix(physics): resolve moveAndSlide corner snagging`      |
| `docs`     | Documentation-only changes                                  | `docs(api): document audio system methods`                |
| `refactor` | A code change that neither fixes a bug nor adds a feature   | `refactor(editor): simplify inspector state handling`     |
| `perf`     | A code change that improves performance                     | `perf(core): reduce allocations in sprite batching`       |
| `test`     | Adding or correcting tests                                  | `test(tests): replace fixed timeouts with explicit waits` |
| `chore`    | Changes to the build process, CI workflows, or dependencies | `chore(ci): update Node.js version in workflow`           |

---

## Submitting a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/my-feature
   ```
2. Open a pull request against the default branch of the main repository.
3. Complete the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md).
4. Make sure all GitHub Actions CI checks pass.
5. Respond promptly to review feedback. Once your pull request is approved, a maintainer will merge it.

---

## Getting Help

If you have questions while contributing, ask on [Discord](https://haikal-adnan.github.io/lupis-engine-link?go=discord) or in [GitHub Discussions](https://github.com/haikal-adnan/lupis-engine/discussions).
