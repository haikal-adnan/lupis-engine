# Contributing to Lupis Engine

Thank you for your interest in contributing to **Lupis Engine**! We welcome contributions from developers, game designers, technical writers, and artists of all skill levels.

---

## 📜 Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free community for everyone. Please be respectful, constructive, and collaborative in all discussions and pull requests.

---

## 🗺�E�EHow Can I Contribute?

- **Report Bugs**: Submit detailed bug reports via our [GitHub Issue Chooser](https://github.com/haikal-adnan/lupis-engine/issues/new/choose) or review the [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.yml).
- **Suggest Features**: Propose ideas and architectural enhancements via [GitHub Feature Request](https://github.com/haikal-adnan/lupis-engine/issues/new/choose) or review the [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.yml).
- **Community Discussions**: Ask questions, share ideas, and connect with other developers on [GitHub Discussions](https://github.com/haikal-adnan/lupis-engine/discussions).
- **Improve Documentation**: Fix typos, add tutorials, or expand API explanations in [`editor/public/docs/`](editor/public/docs/).
- **Submit Code**: Implement bug fixes, performance optimizations, or new Blueprint nodes adhering to the 10 consolidated domain modules.

---

## 💻 Development Setup

### 1. Prerequisites
- **Node.js**: `^20.19.0` or `>=22.12.0`
- **npm**: `>=10.0.0`
- **Docker & Docker Compose** (Optional, recommended for turnkey runs)

### 2. Fork & Clone
```bash
git clone https://github.com/<your-username>/lupis-engine.git
cd lupis-engine
git checkout -b feature/my-awesome-feature
```

### 3. Running with Docker Compose
```bash
docker compose -f start.yml up
```
- Editor: `http://localhost:37600`
- Engine Core: `http://localhost:37601`
- Backend Service: `http://localhost:37602`

### 4. Running Locally (Without Docker)
```bash
# Terminal 1: Backend service
cd service && npm install && npm run dev

# Terminal 2: Visual Editor
cd editor && npm install && npm run dev
```

---

## 🧪 Testing Guidelines

Before submitting any code, verify that all tests and linting standards pass:

### 1. Editor Unit Tests (Vitest)
```bash
cd editor
npm run test:run
```

### 2. E2E Static Standard Check
Our Playwright suite enforces strict standards (no manual timeouts, no CSS class assertions, fixture isolation). Verify your specs with:
```bash
node tests/scripts/check-standard.mjs
```

### 3. Playwright E2E Tests
```bash
cd tests
npm install
npm test
```

---

## 🧩 Visual Scripting Node Contribution Standards

When contributing new nodes or modifying existing ones in `editor/src/features/nodes/library/blueprints/`:
- **Consolidated Architecture**: Every node must belong to one of the 10 domain blueprint modules (`BlueprintFlow`, `BlueprintInput`, `BlueprintEntity`, `BlueprintPhysics`, `BlueprintRenderer`, `BlueprintAnimation`, `BlueprintCollections`, `BlueprintMath`, `BlueprintLifecycle`, `BlueprintSystem`). Do not create loose single-node files.
- **T-001 Port Naming Invariant**: Every port identifier MUST match the regex `/^[A-Za-z][A-Za-z0-9]{0,31}$/`. Do not use hyphenated names, underscores, or spaces in port names.
- **Dual-Tier / Context System Compliant**: Nodes must interact only through formal `context` runtime facades (`context.audio`, `context.scenes`, `context.transform`, `context.variables`, etc.). Never access internal properties like `context.game`.
- **Zero Defensive Checks**: Never use optional chaining (`?.`) or nullish coalescing (`??`) defensively against null inputs; assume valid runtime contracts.
- **Contract Verification**: Verify your node passes `validateCodePanelContract` in `editor/tests/unit/features/nodes/useNodeBlueprint.spec.js`.

---

## 📝 Commit Convention

We enforce the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description>
```

### Allowed Types:
- `feat`: A new feature (e.g. `feat(nodes): add vector math normalize node`)
- `fix`: A bug fix (e.g. `fix(physics): resolve moveAndSlide corner snagging`)
- `docs`: Documentation only changes (e.g. `docs(api): document audio system methods`)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding or correcting tests
- `chore`: Changes to build process, CI workflows, or dependencies

---

## 🚀 Submitting a Pull Request

1. Push your branch to your GitHub fork:
   ```bash
   git push origin feature/my-awesome-feature
   ```
2. Open a Pull Request against the `main` (or `master`) branch.
3. Fill out the provided [Pull Request Template](file:///D:/Project/Lupis%20Engine/.github/PULL_REQUEST_TEMPLATE.md).
4. Ensure all GitHub Actions CI checks pass.
5. Address any code review feedback promptly. Once approved, a maintainer will merge your PR.
