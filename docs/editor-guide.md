# 🎨 Lupis Visual Editor Guide

The Lupis Visual Editor is a modern, responsive web-based IDE built with **Vue 3**, **Tailwind CSS**, and **Pinia**.

---

## 1. Interface Layout

The workspace is divided into customizable panels:

```
+-------------------------------------------------------------------------+
| Top Bar: Project Name | Play / Pause / Restart | Viewport Mode | Export |
+------------------+------------------------------------+-----------------+
| Hierarchy Panel  | Viewport Canvas (WebGL)            | Inspector Panel |
|                  |                                    |                 |
| - World Layers   | [ Transform Gizmo / Selection Box] | - Transform     |
|   - Player       |                                    | - Physics       |
|   - Enemies      | Tools: Move, Rotate, Scale, Brush  | - Collider      |
| - UI Layers      | Rulers, Snap Grid, Zoom Slider     | - Shape/Sprite  |
+------------------+------------------------------------+-----------------+
| Bottom Panel: Assets Library | Blueprint Node Graph | Console Logs     |
+-------------------------------------------------------------------------+
```

---

## 2. Key Panels

### 2.1 Hierarchy Panel
- Manages the parent-child relationship of Entities.
- Distinguishes between **World Layers** (subject to camera movement) and **UI Layers** (fixed viewport HUD).
- Supports drag-and-drop reordering and entity grouping.

### 2.2 Viewport Canvas
- Real-time interactive canvas displaying the current scene.
- **Transform Gizmo**: Move, rotate, and scale selected entities.
- **Rulers & Grid**: Pixel-accurate alignment and snapping.
- **Tilemap Tool**: Paint tiles directly onto tilemap layers.
- **Shape Tool**: Draw rectangles, circles, and custom polygon colliders interactively.

### 2.3 Inspector Panel
- Dynamically updates to reflect the components of the selected Entity.
- Add or remove components with a single click (`Physics`, `Collider`, `ImageRenderer`, `ShapeRenderer`, `Animator`).
- Real-time two-way data binding with instant viewport feedback.

### 2.4 Blueprint Node Graph
- Visual scripting canvas with infinite pan and zoom.
- Context menu for creating nodes (right-click or press Space).
- Connection cables indicate data type via color coding.

### 2.5 Asset Manager
- Supports drag-and-drop importing for images (`.png`, `.jpg`, `.webp`), fonts (`.ttf`, `.otf`), audio (`.ogg`, `.mp3`, `.wav`), and prefabs (`.json`).
- Automatic font atlas generation via the micro-backend service.

---

## 3. Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `W` | Activate Move (Translate) Tool |
| `E` | Activate Rotate Tool |
| `R` | Activate Scale Tool |
| `Delete` / `Backspace` | Delete selected entity |
| `Ctrl + D` | Duplicate selected entity |
| `Ctrl + Z` / `Ctrl + Y` | Undo / Redo |
| `F` | Focus camera on selected entity |
| `Space + Drag` | Pan viewport camera |
