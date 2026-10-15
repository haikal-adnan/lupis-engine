# Contributing to Lupis Engine

Thank you for your interest in contributing to **Lupis Engine**! We welcome contributions from developers, game designers, technical writers, and artists of all skill levels.

---

## 📜 Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free community for everyone. Please be respectful, constructive, and collaborative in all discussions and pull requests.

---

## 🗺️ How Can I Contribute?

- **Report Bugs**: Submit detailed bug reports using our [Bug Report Form](https://github.com/haikaladnan/lupis-engine/issues/new?template=bug_report.yml).
- **Suggest Features**: Propose ideas or architecture improvements using the [Feature Request Form](https://github.com/haikaladnan/lupis-engine/issues/new?template=feature_request.yml).
- **Improve Documentation**: Fix typos, add tutorials, or expand API explanations in [`docs/`](file:///D:/Project/Lupis%20Engine/docs/).
- **Submit Code**: Implement bug fixes, performance optimizations, or new Blueprint nodes.

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
- Editor: `http://localhost:6500`
- Engine Core: `http://localhost:8080`
- Backend Service: `http://localhost:4000`

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
