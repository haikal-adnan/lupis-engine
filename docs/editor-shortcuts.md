# Editor Shortcuts Reference

Complete keyboard and mouse shortcut mapping for all tabs, viewports, panels, and modals across the Lupis Engine editor.

---

## 1. Quick Reference by Tab

| Tab / Panel | Primary Shortcuts | Scope |
| :--- | :--- | :--- |
| **Global** | `Ctrl + S`, `Ctrl + Z`, `Ctrl + Y` / `Ctrl + Shift + Z` | Entire Editor |
| **Scene & UI Editor** | `Space + Drag`, `Ctrl + Click`, `Shift + Click`, `Shift + Resize`, `Ctrl + Move/Resize` | WebGL Canvas Viewport |
| **Hierarchy Panel** | `Ctrl + C`, `Ctrl + X`, `Ctrl + V`, `Ctrl + D`, `Delete` | Scene / UI Entity Tree |
| **Inspector Panel** | `Escape` | Entity Selection |
| **Tilemap Editor** | `V`, `B`, `E`, `G`, `I`, `Space`, `Ctrl + Drag`, `Delete` / `Backspace` | Tilemap Tool & Canvas |
| **Shape Editor** | `V`, `E`, `P`, `S`, `L`, `G`, `C`, `Space`, `Enter`, `Escape` | Custom Shape Tool |
| **Blueprint Graph** | `Space / Middle Drag`, `Ctrl + Drag`, `Ctrl + Shift + Drag`, `Delete`, Right-Click | Visual Scripting Graph |
| **Code Editor** | `Ctrl + S`, `Ctrl + Z`, `Ctrl + Y` / `Ctrl + Shift + Z` | Custom Script Node Code |
| **Animator: Clips** | `Ctrl + C`, `Ctrl + X`, `Ctrl + V`, `Ctrl + D`, `Delete` | Animation Clip Tree |
| **Animator: Preview** | `Space + Drag`, `Mouse Wheel` | Animation Preview Canvas |
| **Bottom Dock** | `Ctrl + C`, `Ctrl + X`, `Ctrl + V` | Assets, Prefabs, Scripts Panels |
| **Modals & Overlays** | `Escape`, `Enter`, `Arrow Keys`, `Shift + Arrow Keys` | Settings, Cropper, Popups |

---

## 2. Global Shortcuts

These shortcuts are active throughout the entire editor, provided an input field or textarea does not currently have active text editing focus.

| Shortcut | Description | Target / Behavior |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> / <kbd>Cmd</kbd> + <kbd>S</kbd> | **Save Project** | Saves all dirty project state, scenes, assets, and settings to the server / OPFS. |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> / <kbd>Cmd</kbd> + <kbd>Z</kbd> | **Undo** | Reverts the last recorded action in the active scene, layer, or diagram history stack. |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> / <kbd>Cmd</kbd> + <kbd>Y</kbd> | **Redo** | Re-applies the next undone action in the active history stack. |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | **Redo (Alternative)** | Secondary standard key combination for redo. |
| <kbd>Ctrl</kbd> + <kbd>F2</kbd> | **Toggle Mini Console** | Toggles the runtime debug mini console overlay during game preview mode. |

---

## 3. Scene Editor & UI Editor Tabs (`scene` & `ui`)

The Scene Editor (`scene`) and UI Structure Editor (`ui`) share the primary WebGL 2 canvas viewport, hierarchy tree, and component inspector.

### 3.1 Viewport Navigation & Camera Controls

| Shortcut / Input | Action | Details |
| :--- | :--- | :--- |
| <kbd>Space</kbd> + **Left-Click Drag** | **Pan Viewport** | Temporarily activates the grab hand to pan the camera across the scene. |
| **Middle-Click Drag** | **Pan Viewport** | Directly pans the camera without holding Space. |
| **Mouse Wheel** | **Zoom In / Out** | Zooms camera focused toward current pointer coordinates (clamped 0.125× to 8×). |
| <kbd>Ctrl</kbd> + **Mouse Wheel** | **Fast Zoom** | Zooms at 2× default speed. |
| <kbd>Shift</kbd> + **Mouse Wheel** | **Vertical Scroll** | Pans camera vertically (`cam.y`). |
| <kbd>Alt</kbd> + **Mouse Wheel** | **Horizontal Scroll** | Pans camera horizontally (`cam.x`). |

### 3.2 Viewport Entity Selection & Transformation

| Shortcut / Input | Action | Details |
| :--- | :--- | :--- |
| **Left-Click** | **Select Entity** | Selects the root parent of the clicked object (standard prefab / group workflow). |
| <kbd>Ctrl</kbd> + **Left-Click** | **Select Direct Child** | Bypasses root parent bubbling to pick a specific nested descendant directly. |
| <kbd>Shift</kbd> + **Left-Click** | **Additive Selection** | Adds the clicked entity to the current selection group (multi-selection). |
| **Left-Click Drag (Empty)** | **Marquee Select** | Draws a selection box to select multiple entities. |
| <kbd>Shift</kbd> + **Marquee Drag** | **Additive Marquee** | Appends entities inside the box to the existing selection. |
| <kbd>Shift</kbd> + **Resize Gizmo** | **Lock Aspect Ratio** | Forces uniform proportional scaling during gizmo drag regardless of entity setting. |
| <kbd>Ctrl</kbd> (Hold while dragging) | **Invert Snap** | Temporarily flips snap mode: disables snap if grid/smart guides are ON, enables snap if OFF. |
| **Right-Click (on Entity)** | **Entity Context Menu** | Opens quick actions: Copy, Cut, Duplicate, Order, Prefab conversion, Delete. |
| **Right-Click (on Canvas)** | **Canvas Context Menu** | Opens quick creation menu (Sprite, Shape, Text, Tilemap, UI) and "Paste Here". |

### 3.3 Scene Hierarchy Panel (`SceneHierarchy.vue`)

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>C</kbd> / <kbd>Cmd</kbd> + <kbd>C</kbd> | **Copy Entity** | Copies selected entity/entities to the workspace clipboard. |
| <kbd>Ctrl</kbd> + <kbd>X</kbd> / <kbd>Cmd</kbd> + <kbd>X</kbd> | **Cut Entity** | Cuts selected entity/entities to the workspace clipboard. |
| <kbd>Ctrl</kbd> + <kbd>V</kbd> / <kbd>Cmd</kbd> + <kbd>V</kbd> | **Paste Entity** | Pastes entities from the clipboard into the active layer/parent. |
| <kbd>Ctrl</kbd> + <kbd>D</kbd> / <kbd>Cmd</kbd> + <kbd>D</kbd> | **Duplicate Entity** | Clones selected entity and its descendants with unique IDs. |
| <kbd>Delete</kbd> | **Delete Entity** | Deletes selected entity/entities and all associated child entities recursively. |

### 3.4 Property Inspector Panel (`useInspectorSelection.js`)

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| <kbd>Escape</kbd> | **Clear Selection** | Clears the active entity selection, deselecting all items. |

---

## 4. Tilemap Editor Tab (`tilemap`)

Activated when editing an entity with a `Tilemap` component. Provides specialized tile painting, erasing, and selection tools.

| Shortcut | Tool / Action | Description |
| :--- | :--- | :--- |
| <kbd>V</kbd> | **Select Tool** | Marquee tile selection mode to select, move, or offset tile blocks. |
| <kbd>B</kbd> | **Brush Tool** | Paints selected tile or tile pattern from the palette onto the grid. |
| <kbd>E</kbd> | **Eraser Tool** | Erases tiles on the current tilemap layer upon left click / drag. |
| <kbd>G</kbd> | **Bucket Tool** | Flood fills contiguous identical tiles or fills empty bounded regions. |
| <kbd>I</kbd> | **Eyedropper Tool** | Picks the tile ID under the cursor into the active brush. |
| <kbd>Space</kbd> (Hold) | **Pan Canvas** | Temporarily switches to the hand tool to pan around the tilemap. |
| <kbd>Ctrl</kbd> + **Left Drag** | **Quick Marquee** | Allows box selecting a tile region without switching away from the active brush. |
| <kbd>Delete</kbd> / <kbd>Backspace</kbd> | **Clear Tile Area** | Deletes all tiles within the active marquee selection or currently dragged tile block. |

---

## 5. Custom Shape Editor Tab (`shape_editor`)

Activated when editing custom vector shapes on entities with a `ShapeRenderer` component set to `custom`.

| Shortcut | Tool / Action | Description |
| :--- | :--- | :--- |
| <kbd>V</kbd> | **Select / Move Tool** | Selects and moves existing shape vertices (points). |
| <kbd>E</kbd> | **Delete Point Tool** | Erases / deletes the vertex clicked by the pointer. |
| <kbd>P</kbd> | **Point Tool** | Places individual standalone vertices. |
| <kbd>S</kbd> | **Segment Tool** | Draws sequential connected line segments (polylines). |
| <kbd>L</kbd> | **Line Tool** | Draws a single straight two-point line. |
| <kbd>G</kbd> | **Polygon Tool** | Draws a closed polygon shape. |
| <kbd>C</kbd> | **Circle Tool** | Draws a circular radius boundary shape. |
| <kbd>Space</kbd> (Hold) | **Hand / Pan Tool** | Temporarily pans the viewport and cancels uncommitted draft points. |
| <kbd>Enter</kbd> | **Commit Shape Draft** | Finalizes and commits the ongoing segment or polygon drafting chain. |
| <kbd>Escape</kbd> | **Cancel Shape Draft** | Discards the current draft points and returns to idle state. |

---

## 6. Blueprint Graph Editor Tab (`diagram`)

The visual scripting canvas for assembling node logic and blueprints.

### 6.1 Canvas Navigation

| Shortcut / Input | Action | Description |
| :--- | :--- | :--- |
| **Left-Click Drag (Empty)** | **Pan Graph** | Drags the infinite blueprint canvas. |
| **Middle-Click Drag** | **Pan Graph** | Drags the graph canvas directly. |
| **Mouse Wheel** | **Zoom In / Out** | Smoothly zooms the graph canvas centered at cursor coordinates. |
| <kbd>Shift</kbd> + **Mouse Wheel** | **Vertical Scroll** | Scrolls the graph canvas vertically. |
| <kbd>Alt</kbd> + **Mouse Wheel** | **Horizontal Scroll** | Scrolls the graph canvas horizontally. |

### 6.2 Node Selection & Editing

| Shortcut / Input | Action | Description |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + **Left-Click Drag** | **Marquee Select** | Draws a selection box across the graph to select multiple nodes. |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + **Drag** | **Additive Marquee** | Adds nodes enclosed by the new marquee box into existing selection. |
| <kbd>Ctrl</kbd> / <kbd>Shift</kbd> + **Click Node** | **Toggle Node Select** | Toggles individual node selection state. |
| <kbd>Delete</kbd> / <kbd>Backspace</kbd> | **Delete Selection** | Deletes currently selected nodes or selected wire/edge. |
| **Right-Click (Empty Canvas)** | **Open Node Library** | Opens searchable popup menu to insert nodes at cursor position. |

---

## 7. Script / Code Editor Tab (`code_editor`)

The built-in syntax-highlighted code editor for custom and expression blueprint nodes.

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> / <kbd>Cmd</kbd> + <kbd>S</kbd> | **Save Code** | Immediately compiles and commits the code logic to the node data. |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> / <kbd>Cmd</kbd> + <kbd>Z</kbd> | **Undo Edit** | Reverts recent code modifications within the editor session. |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> / <kbd>Cmd</kbd> + <kbd>Y</kbd> | **Redo Edit** | Re-applies undone code modifications. |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | **Redo Edit (Alt)** | Alternative standard combination for code redo. |

---

## 8. Animator Editor Tab (`animator`)

Dedicated workspace for sprite keyframe animation clips and timeline sequencing.

### 8.1 Clip Hierarchy Panel (`AnimatorClip.vue`)

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>C</kbd> / <kbd>Cmd</kbd> + <kbd>C</kbd> | **Copy Clip** | Copies the active animation clip configuration to clipboard. |
| <kbd>Ctrl</kbd> + <kbd>X</kbd> / <kbd>Cmd</kbd> + <kbd>X</kbd> | **Cut Clip** | Cuts the active animation clip configuration. |
| <kbd>Ctrl</kbd> + <kbd>V</kbd> / <kbd>Cmd</kbd> + <kbd>V</kbd> | **Paste Clip** | Pastes the copied clip into the animation collection. |
| <kbd>Ctrl</kbd> + <kbd>D</kbd> / <kbd>Cmd</kbd> + <kbd>D</kbd> | **Duplicate Clip** | Clones the selected clip with a unique name and keyframe data. |
| <kbd>Delete</kbd> | **Delete Clip** | Deletes the currently selected animation clip. |

### 8.2 Animation Preview Viewport (`AnimatorPanel.vue`)

| Shortcut / Input | Action | Description |
| :--- | :--- | :--- |
| <kbd>Space</kbd> + **Left-Click Drag** | **Pan Preview** | Pans the sprite preview canvas camera. |
| **Middle-Click Drag** | **Pan Preview** | Directly pans the sprite preview camera. |
| **Mouse Wheel** | **Zoom Preview** | Zooms in or out on the sprite animation preview. |

---

## 9. Bottom Dock Panels

The collapsible bottom dock provides file management and diagnostics across four primary tabs: **Assets**, **Scripts**, **Prefabs**, and **Console**.

### 9.1 Assets, Prefabs & Scripts Panels

When the panel is open and focused:

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>C</kbd> / <kbd>Cmd</kbd> + <kbd>C</kbd> | **Copy Item / Folder** | Copies the selected asset, prefab, script, or directory. |
| <kbd>Ctrl</kbd> + <kbd>X</kbd> / <kbd>Cmd</kbd> + <kbd>X</kbd> | **Cut Item / Folder** | Cuts the selected item for moving. |
| <kbd>Ctrl</kbd> + <kbd>V</kbd> / <kbd>Cmd</kbd> + <kbd>V</kbd> | **Paste Item** | Pastes the item into the currently open folder level. |

---

## 10. Modals & Dialog Overlays

Shortcuts supported inside floating inspection and modal dialogs:

### 10.1 Sprite Atlas Cropper (`BaseCropThumbnail.vue`)

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| <kbd>Space</kbd> + **Drag** | **Pan Texture** | Pans the atlas image viewport. |
| <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> | **Nudge 1px** | Shifts the crop boundary rectangle by 1 pixel in that direction. |
| <kbd>Shift</kbd> + Arrow Keys | **Nudge 10px** | Shifts the crop boundary rectangle by 10 pixels for coarse adjustment. |
| <kbd>Enter</kbd> | **Confirm & Save** | Saves the adjusted crop coordinates and closes the modal. |
| <kbd>Escape</kbd> | **Close / Cancel** | Discards changes and closes the crop dialog. |

### 10.2 Global Modals & Preview Popups

| Dialog / Popup | Shortcut | Action |
| :--- | :--- | :--- |
| **Editor Settings Modal** | <kbd>Escape</kbd> | Closes the project and editor settings dialog. |
| **Blueprint Node Library** | <kbd>Escape</kbd> | Closes the node library picker dialog. |
| **Audio Preview Popup** | <kbd>Space</kbd> | Toggles audio play / pause. |
| **Audio Preview Popup** | <kbd>Escape</kbd> | Closes the audio preview window. |
| **Image Preview Popup** | <kbd>Escape</kbd> | Closes the expanded image preview window. |
