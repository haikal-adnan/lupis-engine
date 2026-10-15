# 🎮 Lupis Engine Examples

This directory contains standalone, minimal demo projects highlighting key features of Lupis Engine:

| Directory | Feature Demo | Highlights |
| :--- | :--- | :--- |
| [`01-2d-features/`](file:///D:/Project/Lupis%20Engine/examples/01-2d-features/) | **2D Sprites & Hierarchy** | Shape rendering, parent-child transforms, camera follow, keyboard controls |
| [`02-physics-and-collision/`](file:///D:/Project/Lupis%20Engine/examples/02-physics-and-collision/) | **2D Physics & Colliders** | Gravity, drag, static platforms, MoveAndSlide, bounce, collision triggers |
| [`03-audio-system/`](file:///D:/Project/Lupis%20Engine/examples/03-audio-system/) | **Web Audio Engine** | SFX playback, looping BGM, volume control, audio buses |
| [`04-pseudo-3d-and-depth/`](file:///D:/Project/Lupis%20Engine/examples/04-pseudo-3d-and-depth/) | **Pseudo-3D / Isometric** | 2.5D isometric perspective, Y-sort depth layering, parallax backgrounds |

---

## 🚀 How to Run the Examples

Because the examples import modern ES Modules from `../../core/`, they should be served over a local HTTP server:

```bash
# From the root directory:
npx serve .

# Or from inside the examples directory:
cd examples
npx serve .
```

Then open your browser to the served port (e.g. `http://localhost:3000/01-2d-features/index.html`).
