# Scene Hierarchy Guide

The **Scene Hierarchy** panel is the foundational organizational tree in the **Lupis Engine** visual editor. It manages scenes, rendering layers, entity lifecycles, transform parent-child hierarchies, rendering orders, visibility, and prefab instantiation.

---

## 1. Interface Overview & Architecture

The hierarchy panel is anchored on the left side of the editor layout, operating above the primary WebGL canvas viewport and property inspector.

```
+-------------------------------------------------------------------------+
| [ Active Scene: Main_Scene v ]                             [ ... Menu ] |
| [ Search hierarchy... (X)                                             ] |
+-------------------------------------------------------------------------+
| v [Eye] WORLD                                            [ + Add Layer] |
|   v [Layers] World_Layer [0]                             [Lock] [Eye]   |
|     > [Cuboid] Player_Entity                             [Lock] [Eye]   |
|         [Image] Hero_Sprite                              [Lock] [Eye]   |
|         [FileCode] Movement_Script                       [Lock] [Eye]   |
|     > [Box] Coin_Prefab (Linked)                         [Lock] [Eye]   |
|     > [InspectionPanel] Tilemap_Ground                   [Lock] [Eye]   |
|                                                                         |
| v [Eye] USER INTERFACE                                   [ + Add Layer] |
|   v [Layers] UI_Layer [0]                                [Lock] [Eye]   |
|     v [Maximize] HUD_Root                                [Lock] [Eye]   |
|         [Type] Health_Text                               [Lock] [Eye]   |
|         [Square] Health_Bar                              [Lock] [Eye]   |
+-------------------------------------------------------------------------+
```

### 1.1 Structural Organization

The Scene Hierarchy strictly partitions entities into two rendering domains:

| Section | Domain | Coordinate Space | Camera Interaction | Typical Use Cases |
| :--- | :--- | :--- | :--- | :--- |
| **World** | `layersWorld` | Cartesian World Coordinates | Moves, zooms, and rotates with the scene camera. | Players, enemies, tiles, props, particles, physics colliders. |
| **User Interface** | `layersUI` | Screen/Canvas Space (`UITransform`) | Anchored statically to viewport bounds regardless of camera position. | HUD elements, dialog boxes, menus, health bars, minimaps. |

---

## 2. Scene Management Toolbar (`HierarchyToolbar.vue`)

The toolbar at the top of the panel orchestrates global scene state and runtime synchronization.

### 2.1 Scene Selector (`BaseSelect`)
- **Active Scene Dropdown:** Displays the currently active scene's `scriptId`. Clicking reveals all scenes registered in `workspaces/scenes.json`.
- **Runtime Reload Pipeline:** Selecting a scene invokes `engineBridge.reloadScene()`. This synchronizes the project settings, scene descriptors, scripts, prefabs, and asset atlases directly into the WebGL 2 runtime engine, clearing previous selection handles.

### 2.2 Scene Actions Menu (3-Dots `MoreVertical`)

Clicking the scene action button opens the dropdown menu containing lifecycle operations:

| Action | Icon | Shortcut | Description | Safeguards & Validation |
| :--- | :--- | :--- | :--- | :--- |
| **New Scene** | `Plus` | — | Prompts for a scene name, scaffolds a new `.json` scene file in OPFS with default World and UI layers, and automatically switches to it. | Names are sanitized and formatted. |
| **Rename Scene** | `Edit2` | — | Opens a prompt to update the scene's `scriptId` across storage registries. | Updates references in `workspaces/scenes.json`. |
| **Duplicate Scene** | `Copy` | — | Clones the entire scene graph, layer configurations, and entity component trees into an identical new scene. | Generates new unique IDs while preserving hierarchies. |
| **Set as Initial Scene** | `BookmarkCheck` | — | Sets this scene as `project.settings.initialSceneId`, designating it as the boot scene when launching or exporting standalone builds. | Disabled if the scene is already marked as initial. |
| **Delete Scene** | `Trash2` *(Danger)* | — | Prompts for confirmation and permanently removes the scene file from OPFS storage. | **Blocked if only one scene exists.** Displays an alert: *"You must have at least one scene."* |

### 2.3 Real-Time Hierarchy Search (`useHierarchyFilter.js`)
- **Instant Filtering:** As you type into the search field, the tree recursively filters nodes matching `scriptId`.
- **Parent Preservation:** If a child entity matches the query, all ancestor entities and parent layers remain expanded and visible.
- **Empty Filter Placeholder:** When no nodes match the search criteria, the tree displays an empty state indicator (*"No world layers. Drag entities here."* or *"No UI layers. Drag UI elements here."*).
- **Clear Action (`X`):** Clears the search field and restores full tree visibility.

---

## 3. Layer Subsystem (`PropertySection` & `useLayerActions.js`)

Layers organize entities into discrete render and sorting passes.

### 3.1 Section Header Controls
Each section header (**World** and **User Interface**) provides direct domain controls:

- **Visibility Toggle (`Eye` / `EyeOff`):**
  - Toggles global domain visibility (`project.settings.world.visible` or `project.settings.ui.visible`).
  - When hidden, an amber `EyeOff` indicator badge appears in the header. Clicking the badge instantly restores visibility.
- **Section Action Menu:**
  - **Hide/Show Section:** Toggles active rendering in the viewport.
  - **Open UI Editor** *(UI Section only)*: Spawns a specialized UI Editor workspace tab (`tab_ui_<layerId>`) for visual anchoring and layout design.
  - **Add Layer:** Creates a new layer within that specific section.

### 3.2 Layer Rules & Properties
- **Z-Index Layering:** Each layer carries an explicit `zIndex` integer displayed in a mono-font badge (e.g., `[0]`, `[5]`). Layers with higher Z-indexes render on top of lower ones.
- **Section Integrity:** Layers belong strictly to either `world` or `ui`. Dragging a layer across section boundaries is disallowed.
- **Deletion Safeguard:** A layer cannot be deleted if it is the sole remaining layer in that section, preventing broken scene graphs.

---

## 4. Entity Node Anatomy (`SceneNode.vue`)

Every row within the hierarchy represents either a layer or an entity.

```
 [ > ]  [Icon]  Entity_Script_ID  [0]                 [Lock]  [Eye]
   |       |           |            |                    |       |
Fold/   Type/Prefab  Unique      Z-Index             Toggle   Toggle
Expand  Identifier   ScriptId    Badge               Lock    Visibility
```

### 4.1 Visual Indicators & Icons

| Icon | Representation | Trigger Condition |
| :--- | :--- | :--- |
| `Layers` *(Blue)* | **Render Layer** | Node is a World or UI layer container (`type === 'layer'`). |
| `Box` *(Sky Blue)* | **Prefab Instance** | Entity is linked to a reusable prefab (`prefabId != null`). |
| `Folder` / `FolderOpen` | **Empty Container** | Entity without graphics, used as a transform group. |
| `Image` | **Sprite Entity** | Entity with a `SpriteRenderer` component. |
| `Square` | **Shape Entity** | Entity with a `ShapeRenderer` component. |
| `Type` | **Text Entity** | Entity with a `TextRenderer` component. |
| `InspectionPanel` | **Tilemap Entity** | Entity with a `TilemapRenderer` component. |
| `FileCode` | **Script Entity** | Entity housing visual blueprint logic graphs. |
| `Cuboid` | **Generic Entity** | Default entity representation. |

### 4.2 State Inheritance & Controls

Hovering over any node reveals state management toggles on the right side:

1. **Lock Toggle (`Lock` / `Unlock`):**
   - Locks the entity to prevent accidental selection, dragging, or gizmo transforms in the WebGL canvas viewport.
   - **Inheritance:** Locking a parent entity or layer automatically cascades downward, locking all descendant children (`effectiveLocked = ownLocked || parentLocked`).
2. **Visibility Toggle (`Eye` / `EyeOff`):**
   - Toggles whether the entity and its components are rendered in the viewport.
   - **Inheritance:** Hiding a parent cascades downward, hiding all descendant children (`effectiveVisible = ownVisible && !parentHidden`).
   - Hidden entities display at 50% opacity in the hierarchy tree to indicate inactive visual status.

---

## 5. Context Menus & Actions (`useHierarchyMenu.js`)

Right-clicking elements in the hierarchy opens a context-specific action menu.

### 5.1 Layer Context Menu

Right-click on any layer row:

| Item | Shortcut | Action |
| :--- | :--- | :--- |
| **Add Entity / Add UI Element** | — | Opens submenu to create: `Empty Entity`, `Sprite`, `Shape`, `Text`, `Tilemap` (or `Empty UI`, `UI Shape`, `UI Text`, `UI Image`). |
| **Hide / Show Layer** | — | Toggles layer rendering visibility. |
| *Separator* | — | — |
| **Duplicate** | <kbd>Ctrl + D</kbd> | Duplicates the layer along with all its child entities and hierarchy. |
| **Copy Layer** | <kbd>Ctrl + C</kbd> | Copies the layer and all child entities to the clipboard. |
| **Cut Layer** | <kbd>Ctrl + X</kbd> | Cuts the layer to clipboard (temporarily removed until pasted). |
| **Paste** | <kbd>Ctrl + V</kbd> | Pastes clipboard contents inside this layer. |
| *Separator* | — | — |
| **Rename Layer** | <kbd>F2</kbd> | Prompts for a new layer name/scriptId. |
| **Change Z-Index** | — | Prompts to update render ordering integer. |
| *Separator* | — | — |
| **Delete Layer** | <kbd>Del</kbd> *(Danger)* | Permanently deletes the layer and all child entities. |

### 5.2 Entity Context Menu

Right-click on any entity row:

| Item | Shortcut | Action |
| :--- | :--- | :--- |
| **Add Child / Add Child UI** | — | Submenu to create and attach a child entity directly under this entity. |
| *Separator* | — | — |
| **Duplicate** | <kbd>Ctrl + D</kbd> | Clones the entity and its components, placing the duplicate alongside it. |
| **Copy** | <kbd>Ctrl + C</kbd> | Copies the entity and descendant subtrees to clipboard. |
| **Cut** | <kbd>Ctrl + X</kbd> | Cuts the entity to clipboard. |
| **Paste** | <kbd>Ctrl + V</kbd> | Pastes clipboard entities as children of this entity. |
| *Separator* | — | — |
| **Use as Prefab** | — | Converts the entity and all children into a standalone Prefab asset in `prefabs/`. |
| *Separator* | — | — |
| **Rename Entity** | <kbd>F2</kbd> | Prompts to change the entity's `scriptId`. |
| *Separator* | — | — |
| **Delete Entity** | <kbd>Del</kbd> *(Danger)* | Deletes the entity and its descendants from the scene. |

> [!NOTE]
> **Prefab Restriction:** The **Use as Prefab** action is disabled if the entity is already a prefab instance or if it is a child node inside an existing prefab hierarchy.

### 5.3 Empty Space Context Menu

Right-clicking on empty background space below the tree:
- **Refresh Tree:** Forces an interface refresh and synchronizes nodes with the active store.
- **Paste:** Pastes copied entities to the root level of the active layer.

---

## 6. Drag & Drop Reordering & Reparenting (`useNodeDragDrop.js` & `useHierarchyLogic.js`)

The hierarchy supports intuitive drag-and-drop mechanics with pixel-precise insertion zones and safety guards.

### 6.1 Drop Position Indicators

When hovering over a target node while dragging:

| Vertical Cursor Position | Highlight Visualizer | Action Triggered |
| :--- | :--- | :--- |
| **Top 25% of node height** | Blue horizontal line with circular pin above node | Reorders node as a sibling **before** the target. |
| **Middle 50% of node height** | Inset blue highlight ring (`ring-2 ring-blue-500 bg-blue-500/10`) | **Reparents** node as a child inside the target entity. |
| **Bottom 25% of node height** | Blue horizontal line with circular pin below node | Reorders node as a sibling **after** the target. |

### 6.2 Structural Rules & Safeguards

The engine enforces strict validation rules to maintain scene graph stability:

1. **Circular Parenting Prevention:**
   - You cannot drag an entity into its own child or any of its descendants. The engine detects circular loops and aborts the move with an error: *"Cannot move an entity inside its own child."*
2. **Domain Boundary Enforcement:**
   - World entities cannot be placed into UI layers.
   - UI entities cannot be placed into World layers.
   - Violations trigger: *"UI Entity cannot go to World Layer"* or *"World Entity cannot go to UI Layer."*
3. **Layer Separation:**
   - Layers cannot be reparented inside entities or moved across sections.
4. **Sibling Z-Index Safeguard:**
   - Sibling reordering (`top` or `bottom`) is restricted between entities with differing Z-indexes to preserve logical sorting contracts.
5. **Child Extraction:**
   - Dragging a nested child onto a Layer header or onto empty tree space detaches it from its parent, returning it to the layer's root level (`parentId = null`).

---

## 7. Selection System & Keyboard Shortcuts

The Scene Hierarchy coordinates selections bidirectionally with the WebGL Canvas Viewport and Property Inspector.

### 7.1 Selection Dynamics
- **Single Click:** Selects the target entity and displays its components in the Property Inspector. In the hierarchy, selecting a parent automatically highlights all descendant children.
- **Additive Selection (<kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + Click):** Adds or removes individual entities from the selection set, allowing multi-entity batch modifications.
- **External Viewport Sync:** Clicking an entity in the WebGL canvas fires `entity:selected` on the event bus, highlighting the corresponding node in the tree and scrolling it into view.

### 7.2 Keyboard Shortcuts Reference

| Shortcut | Context | Action |
| :--- | :--- | :--- |
| <kbd>Ctrl + C</kbd> | Focused Entity/Layer | Copy entity subtree to clipboard. |
| <kbd>Ctrl + X</kbd> | Focused Entity/Layer | Cut entity subtree to clipboard. |
| <kbd>Ctrl + V</kbd> | Focused Layer/Parent | Paste clipboard entities into active container. |
| <kbd>Ctrl + D</kbd> | Focused Entity/Layer | Duplicate entity/layer immediately. |
| <kbd>Delete</kbd> | Focused Entity | Delete selected entity/entities. |
| <kbd>F2</kbd> | Focused Entity/Layer | Trigger rename dialog prompt. |
| <kbd>Ctrl + Click</kbd> | Hierarchy Tree | Toggle node in multi-selection. |

---

## 8. Step-by-Step User Guides

### 8.1 Adding a New Entity to a Scene
1. Expand the desired **World Layer** in the hierarchy.
2. Right-click the layer row (e.g., `World_Layer`).
3. Hover over **Add Entity** and select the type of entity you want to create (e.g., `Sprite`).
4. The entity appears in the tree and in the center of the canvas viewport, and its properties open in the Inspector.

### 8.2 Nesting Child Entities (Parenting)
1. In the hierarchy, locate the entity you want to make a child.
2. Click and drag the entity over the intended parent entity until the **middle 50%** is highlighted with a blue border box.
3. Release the mouse button.
4. The entity is now a child (`parentId` assigned). Transforming, rotating, or hiding the parent will now transform or hide the child.

### 8.3 Extracting a Child Entity Back to Root Level
1. Click and drag the child entity.
2. Drag it onto the parent **Layer** row (e.g., `World_Layer`).
3. Release the mouse. The entity is now unparented at the top level of the layer.

### 8.4 Converting an Entity into a Reusable Prefab
1. Build and configure your entity and its child hierarchy in the scene.
2. Right-click the root entity row.
3. Click **Use as Prefab**.
4. In the prompt modal, confirm or enter the prefab name (e.g., `Enemy_Goblin_Prefab`).
5. Click **Create**. The icon turns into a sky-blue `Box`, and the prefab appears in the **Prefabs Dock** panel ready for reuse.

---

## 9. Key Source Code References

| Purpose | File Path |
| :--- | :--- |
| **Main Hierarchy Container** | `editor/src/features/scenes/layouts/SceneHierarchy.vue` |
| **Toolbar & Scene Operations** | `editor/src/features/scenes/layouts/HierarchyToolbar.vue` |
| **Tree View & Domain Sections** | `editor/src/features/scenes/layouts/SceneTree.vue` |
| **Individual Node Component** | `editor/src/features/scenes/layouts/SceneNode.vue` |
| **Tree Assembly & Move Logic** | `editor/src/features/scenes/composables/useHierarchyLogic.js` |
| **Context Menu Handlers** | `editor/src/features/scenes/composables/useHierarchyMenu.js` |
| **Search Filter Engine** | `editor/src/features/scenes/composables/useHierarchyFilter.js` |
| **Drag & Drop Interactions** | `editor/src/features/scenes/composables/useNodeDragDrop.js` |
| **Scene Store & State** | `editor/src/features/scenes/useSceneStore.js` |
| **Entity Actions Controller** | `editor/src/features/scenes/composables/actions/useEntityActions.js` |
| **Layer Actions Controller** | `editor/src/features/scenes/composables/actions/useLayerActions.js` |
