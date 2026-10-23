# Editor guide

The Lupis Editor is a browser-based editor for building scenes, assets, and blueprint scripts. It is built with Vue 3, Tailwind CSS, and Pinia. For the codebase, see [editor-reference.md](editor-reference.md).

## Layout

```
+-------------------------------------------------------------------------+
| Top bar: project name | Play / Pause / Restart | Viewport mode | Export  |
+------------------+------------------------------------+-----------------+
| Hierarchy        | Viewport (WebGL)                   | Inspector       |
|                  |                                    |                 |
| - World layers   | Gizmo / selection box              | - Transform     |
|   - player       |                                    | - Physics       |
|   - enemies      | Tools: move, rotate, scale, brush  | - Collider      |
| - UI layers      | Rulers, snap grid, zoom            | - Renderer      |
+------------------+------------------------------------+-----------------+
| Bottom dock: Assets | Blueprint graph | Console                         |
+-------------------------------------------------------------------------+
```

## Panels

### Hierarchy

Shows entities as a tree of parents and children, grouped into two layer types:

- **World layers** move with the camera.
- **UI layers** are fixed to the screen (HUD).

Entities and layers are labeled by their `scriptId`, shown as **ID**. Drag to reorder or reparent.

### Viewport

Live view of the active scene.

- **Transform gizmo:** move, rotate, and scale the selection.
- **Rulers and grid:** pixel alignment and snapping.
- **Tilemap tool:** paint tiles onto tilemap entities.
- **Shape tool:** draw polygons and colliders.

### Inspector

Shows the components of the selected entity. Add or remove components (`Physics`, `Collider`, `SpriteRenderer`, `ShapeRenderer`, `SpriteAnimator`, and others). Edits apply to the viewport immediately.

### Blueprint graph

Infinite graph canvas for visual scripting with pan and zoom navigation:
- Open the node menu with right-click or `Space` to search through the 10 domain categories (`Flow`, `Input`, `Entity`, `Physics`, `Renderer`, `Animation`, `Collections`, `Math`, `Lifecycle`, `System`) containing 128 production nodes.
- Wire execution ports (white pentagon pins) for flow control, and data ports (colored circular pins) for pure typed evaluations.
- Real-time compiler detects disconnected ports, cycle hazards, and type mismatches.
- Full runtime debugging support with live port value inspection.

See [Visual Scripting Guide](visual-scripting.md) and [Context System Reference](context-system.md).

### Assets

Import by drag and drop:

| Type | Formats |
| :--- | :--- |
| Images | `.png`, `.jpg`, `.webp` |
| Fonts | `.ttf`, `.otf` (converted to an MSDF atlas by the backend service) |
| Audio | `.ogg`, `.mp3`, `.wav` |
| Prefabs | `.json` |

Assets are referenced from scripts by their `scriptId`.

### Console

Runtime logs, warnings, and errors from the engine and from scripts.

## Save state

The editor tracks whether memory matches what is stored in the browser (OPFS):

| Indicator | Meaning |
| :--- | :--- |
| Green | Saved. |
| Red | Unsaved changes. |
| Yellow, pulsing | Save or load in progress. |

Leaving the editor with unsaved changes shows a warning. Auto-save is off by default and can be enabled in project settings.

## Shortcuts

Key shortcuts commonly used in the editor. For the comprehensive per-tab mapping, see [editor-shortcuts.md](editor-shortcuts.md).

| Shortcut | Action | Context |
| :--- | :--- | :--- |
| `Ctrl + S` | Save project | Global |
| `Ctrl + Z` / `Ctrl + Y` | Undo / redo | Global |
| `Space` + drag | Pan viewport camera | Viewports |
| `Mouse Wheel` | Zoom viewport | Viewports |
| `Ctrl + Click` | Select direct child entity | Scene Viewport |
| `Shift + Click` / drag | Additive multi-selection | Hierarchy / Viewports |
| `Ctrl + D` | Duplicate selection | Hierarchy / Animator |
| `Delete` | Delete selection | Hierarchy / Graphs / Timeline |
| `V`, `B`, `E`, `G`, `I` | Select, Brush, Eraser, Bucket, Eyedropper | Tilemap Editor |
| `V`, `E`, `P`, `S`, `L`, `G`, `C` | Shape drawing & editing tools | Custom Shape Editor |
| `Ctrl + Drag` | Marquee box select nodes | Blueprint Graph |
| `Escape` | Clear selection / close modal | Inspector / Modals |
