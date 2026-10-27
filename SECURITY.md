# Security Policy

## Scripting Sandbox & Limitations

Lupis Engine allows users to write **JavaScript code** and **visual-script Blueprints** inside the editor. These scripts run with the following constraints:

- **Execution context**: User scripts execute within the editor's browser tab via `eval()` / dynamic `Function()`. They share the same origin and privileges as the editor itself.
- **No sandbox guarantee**: There is currently **no process-level or iframe sandbox** isolating user scripts from the host page. A malicious script has full access to the DOM, IndexedDB, and any same-origin resources.
- **Local-only deployment recommended**: Lupis Engine is designed for local/offline use for now. **Do not host the editor on a public URL** where untrusted users can load or execute projects, as this exposes your server to arbitrary client-side code execution.
- **Service tier**: The Node.js backend (`service/`) performs file I/O (project export). It does not execute user-authored scripts server-side, but exported projects contain user code that will run in the player's browser.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it **privately**:

1. **GitHub Security Advisories** (preferred): Go to the repository → *Security* → *Report a vulnerability*.
2. **Email**: Send details to the email listed in the repository owner's GitHub profile.

Please include:

- Description of the vulnerability
- Steps to reproduce
- Impact assessment (what an attacker could achieve)

We aim to acknowledge reports within **72 hours** and provide a fix or mitigation within **14 days** for confirmed issues.

## Planned Improvements

- Iframe-sandboxed script execution (targeted for post-1.0)
- Content Security Policy headers for hosted deployments
- Server-side input validation for the export/font-generation endpoints
