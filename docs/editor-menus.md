# Editor Menus & Context Actions Reference

Comprehensive documentation of all **Context Menus (Right-Click)**, **Burger / Action Menus (3-Dots)**, and **Dropdown Menus** available across the Lupis Engine editor interface (form input fields excluded).

---

## 1. Quick Directory of Menus

| Area / Tab | Menu Type | Trigger | Scope |
| :--- | :--- | :--- | :--- |
| **Top Bar** | Project Menu Dropdown | Click Project Button | Global Project Lifecycle |
| **Canvas Viewport** | Entity Context Menu | Right-Click on Entity | Viewport Selection & Transform |
| **Canvas Viewport** | Canvas Context Menu | Right-Click on Empty Space | Entity Creation & Paste |
| **Scene Hierarchy** | Scene Actions Menu | 3-Dots (`MoreVertical`) | Scene Creation & Lifecycle |
| **Scene Hierarchy** | Layer Context Menu | Right-Click on Layer Row | Layer Management & Adding Items |
| **Scene Hierarchy** | Entity Context Menu | Right-Click on Entity Row | Hierarchy Operations & Prefabs |
| **Scene Hierarchy** | Background Context Menu | Right-Click on Empty Tree | Refresh & Paste |
| **Property Inspector** | Component Options Menu | 3-Dots (`MoreVertical`) on Header | Reset, Sync, Remove Component |
| **Property Inspector** | Collider Instance Selector | Click Active Collider Bar | Switch Active Collider Shape |
| **Property Inspector** | Collider Options Menu | 3-Dots (`MoreVertical`) | Add / Remove Collider Instance |
| **Property Inspector** | Script Item Menu | 3-Dots (`MoreHorizontal`) | Open Graph, Detach Script |
| **Graph Editor** | Node Context Menu | Right-Click on Node | Code Edit, Blueprint Save, Delete |
| **Graph Editor** | Graph Background Menu | Right-Click on Empty Canvas | Add Custom Node |
| **Graph Editor** | Node Port Options Menu | 3-Dots (`MoreVertical`) | Port Type, Reorder, Delete |
| **Graph Editor** | Variable Picker Dropdown | Click Variable Field | Global/Local Variable Selector |
| **Variable Manager** | Variable Actions Menu | 3-Dots (`MoreVertical`) on Row | Duplicate, Add Get/Set to Graph |
| **Animator Editor** | Clip Tree Context Menu | Right-Click on Item / Canvas | Clips & Category Operations |
| **Animator Timeline** | Source Actions Menu | 3-Dots (`MoreVertical`) | Reset Size, Delete Sources |
| **Assets Dock** | Asset Item Context Menu | Right-Click on Asset / Folder | Component Appliers, Cut/Copy |
| **Assets Dock** | Asset Background Menu | Right-Click on Empty Panel | New Folder, Import, Paste |
| **Prefabs Dock** | Prefab Item Context Menu | Right-Click on Prefab | Instantiate, Link, Cut/Copy |
| **Prefabs Dock** | Prefab Background Menu | Right-Click on Empty Panel | New Folder, Empty Prefab, Paste |
| **Scripts Dock** | Script Item Context Menu | Right-Click on Script | Attach to Entity, Open Graph |
| **Scripts Dock** | Script Background Menu | Right-Click on Empty Panel | New Folder, New Script, Paste |
| **Dashboard** | Project Card Context Menu | Right-Click on Project Card | Open, Save, Rename, Delete |
| **Settings Modal** | Resolution Presets Dropdown | Click `MonitorPlay` Button | Target Canvas Dimension Presets |
| **OPFS Panel** | Storage Item Context Menu | Right-Click on File / Folder | Delete File / Folder |

---

## 2. Top Bar & Global Menus

### 2.1 Project Menu Dropdown (`HeaderProjectMenu.vue`)
* **Trigger:** Click on the project name button containing the sync status dot indicator on the left side of the top bar.
* **Component:** `BaseDropdown`

| Item | Icon | Action / Details |
| :--- | :--- | :--- |
| **Header Status Badge** | — | Displays current project sync state (`synced` or `dirty`). |
| **Save Project** | `CloudUpload` | Saves project state, scenes, assets, and metadata to storage (<kbd>Ctrl+S</kbd>). |
| **Export Project** | `Download` | Packages and exports the complete project bundle as `.lupis` archive. |
| **Settings** | `Settings` | Opens the Project & Editor Settings modal dialog. |
| **Back to Dashboard** | `FolderOpen` | Prompts for unsaved changes confirmation and returns to project dashboard. |

---

## 3. Canvas Viewport Menus (`useCanvasMenu.js`)

### 3.1 Entity Context Menu
* **Trigger:** Right-click on any entity in the WebGL canvas viewport.
* **Component:** `BaseContextMenu`

| Item | Icon | Shortcut | Description |
| :--- | :--- | :--- | :--- |
| **Copy** | `Copy` | <kbd>Ctrl+C</kbd> | Copies selected entity to workspace clipboard. |
| **Cut** | `Scissors` | <kbd>Ctrl+X</kbd> | Cuts selected entity to workspace clipboard. |
| **Duplicate** | `Files` | <kbd>Ctrl+D</kbd> | Clones selected entity immediately. |
| *Separator* | — | — | — |
| **Bring to Front** | `ArrowUpToLine` | — | Moves entity to top visual stacking order within its layer. |
| **Send to Back** | `ArrowDownToLine` | — | Moves entity to bottom visual stacking order within its layer. |
| *Separator* | — | — | — |
| **Use as Prefab** | `Box` | — | Converts selected entity hierarchy into a reusable prefab. *(Disabled if already prefab)* |
| *Separator* | — | — | — |
| **Lock** | `Lock` | — | Toggles viewport selection lock on the entity. |
| **Hidden Entity** | `EyeOff` | — | Toggles rendering visibility in editor viewport. |
| **Inactive Entity** | `Power` | — | Toggles active simulation state of entity. |
| *Separator* | — | — | — |
| **Delete** | `Trash2` *(Danger)* | <kbd>Del</kbd> | Deletes entity and recursive child nodes. |

### 3.2 Canvas Background Context Menu
* **Trigger:** Right-click on empty canvas area.
* **Component:** `BaseContextMenu`

| Item | Icon | Submenu / Action |
| :--- | :--- | :--- |
| **Create Entity** | `Plus` | Opens nested submenu grouped by layer section: |
| ↳ *World Layers* | `Layers` | **Empty Entity**, **Sprite**, **Shape**, **Text**, **Tilemap** |
| ↳ *UI Layers* | `Layers` | **UI Shape**, **UI Text**, **UI Image** |
| **Paste Here** | `Clipboard` | Pastes copied entity at exact clicked world pointer coordinates. *(Disabled if clipboard empty)* |

---

## 4. Scene Hierarchy Panel Menus (`useHierarchyMenu.js` & `HierarchyToolbar.vue`)

### 4.1 Scene Actions Dropdown (`HierarchyToolbar.vue`)
* **Trigger:** Click the 3-dots (`MoreVertical`) button next to the Scene dropdown selector.
* **Component:** `BaseDropdown`

| Item | Icon | Description |
| :--- | :--- | :--- |
| **New Scene** | `Plus` | Prompts for a scene name and creates a new empty scene. |
| **Rename Scene** | `Edit2` | Renames the active scene script ID. |
| **Duplicate Scene** | `Copy` | Duplicates active scene including all entities and layers. |
| **Set as Initial Scene** | `BookmarkCheck` | Sets active scene as the starting entrypoint for runtime builds. |
| *Separator* | — | — |
| **Delete Scene** | `Trash2` *(Danger)* | Deletes active scene from the project. |

### 4.2 Hierarchy Layer Context Menu
* **Trigger:** Right-click on any Layer row in the hierarchy tree.

| Item | Icon | Shortcut | Description |
| :--- | :--- | :--- | :--- |
| **Add Entity / UI Element** | `Plus` | — | Submenu with entity templates (Empty, Sprite, Shape, Text, Tilemap, UI items). |
| *Separator* | — | — | — |
| **Hide / Show Layer** | `EyeOff` / `Eye` | — | Toggles visibility of all entities on this layer. |
| *Separator* | — | — | — |
| **Duplicate** | `Files` | <kbd>Ctrl+D</kbd> | Duplicates the layer and all its nested entities. |
| **Copy Layer** | `Copy` | — | Copies layer hierarchy to clipboard. |
| **Cut Layer** | `Scissors` | — | Cuts layer hierarchy. |
| **Paste** | `Clipboard` | — | Pastes clipboard item as child of layer. |
| *Separator* | — | — | — |
| **Rename Layer** | `Edit2` | <kbd>F2</kbd> | Renames layer ID. |
| **Change Z-Index** | `Layers` | — | Adjusts rendering priority order of the layer. |
| *Separator* | — | — | — |
| **Delete Layer** | `Trash2` *(Danger)* | — | Deletes layer and all entities contained within. |

### 4.3 Hierarchy Entity Context Menu
* **Trigger:** Right-click on an Entity row in the hierarchy tree.

| Item | Icon | Shortcut | Description |
| :--- | :--- | :--- | :--- |
| **Add Child / Add Child UI** | `Plus` | — | Submenu to spawn new entity directly parented under this node. |
| *Separator* | — | — | — |
| **Duplicate** | `Files` | <kbd>Ctrl+D</kbd> | Clones entity with unique ID. |
| **Copy** | `Copy` | <kbd>Ctrl+C</kbd> | Copies entity to clipboard. |
| **Cut** | `Scissors` | <kbd>Ctrl+X</kbd> | Cuts entity to clipboard. |
| **Paste** | `Clipboard` | <kbd>Ctrl+V</kbd> | Pastes clipboard entity as a direct child. |
| *Separator* | — | — | — |
| **Use as Prefab** | `Box` | — | Converts entity into master prefab template. |
| *Separator* | — | — | — |
| **Rename Entity** | `Edit2` | <kbd>F2</kbd> | Prompts to rename entity script ID. |
| *Separator* | — | — | — |
| **Delete Entity** | `Trash2` *(Danger)* | <kbd>Del</kbd> | Deletes entity and recursive children. |

### 4.4 Hierarchy Empty Background Context Menu
* **Trigger:** Right-click on empty area in hierarchy scroll area.
* Items: **Refresh Tree** (`RefreshCw`), **Paste** (`Clipboard`).

---

## 5. Property Inspector Panel Menus

### 5.1 Component Section 3-Dots Dropdown (`PropertySection.vue`)
* **Trigger:** Hover over any component section header and click the 3-dots (`MoreVertical`) icon.
* **Component:** `BaseDropdown`

| Component | Menu Items | Details |
| :--- | :--- | :--- |
| **Transform / UITransform** | • **Sync Transform**<br>• **Reset Values**<br>• **Fit to Children** | Resets positions, scales, or pivots; syncs prefab overrides; computes bounding box around children. |
| **SpriteRenderer** | • **Reset to Native Size**<br>• **Sync Component**<br>• **Remove Component** | Reverts width & height to raw sprite texture pixel dimensions; removes component. |
| **Collider** | • **Sync Component**<br>• **Remove All Colliders** | Syncs collider schema to prefab; purges all collider shapes from entity. |
| **ScriptController** | • **Sync Component**<br>• **Remove Component** | Syncs attached script bindings; removes script controller. |
| **Physics, Audio, Shape, Tilemap, Text** | • **Sync Component** *(if Prefab)*<br>• **Remove Component** | Standard component lifecycle options. |

### 5.2 Attached Colliders Dropdown (`EditorCollider.vue`)
* **Trigger:** Click the active collider name box in the Collider inspector.
* **Component:** `BaseDropdown`
* **Contents:** List of all attached collider instances (Box, Circle, Capsule, Polygon) displaying name, shape type, active toggle dot, and enabled checkmark.

### 5.3 Collider Instance Options Menu (`EditorCollider.vue`)
* **Trigger:** Click the 3-dots (`MoreVertical`) button beside the collider instance selector.
* **Component:** `BaseDropdown`
* **Items:**
  - **Add Collider** (`Plus`): Appends a new default collider shape.
  - **Remove Current** (`Trash2`): Removes the currently selected collider instance only.

### 5.4 Attached Script Item Menu (`EditorScriptItem.vue`)
* **Trigger:** Click the 3-dots (`MoreHorizontal`) button on any attached script card.
* **Component:** `BaseDropdown`
* **Items:**
  - **Open Graph** (`Workflow`): Switches to the Visual Scripting tab and loads this script graph.
  - **Remove** (`Trash2`): Detaches this script from the entity's ScriptController.

---

## 6. Visual Scripting / Graph Editor Menus

### 6.1 Node Context Menu (`useNodeMenu.js`)
* **Trigger:** Right-click on any node on the blueprint graph canvas.
* **Component:** `BaseContextMenu`

| Item | Icon | Shortcut | Description |
| :--- | :--- | :--- | :--- |
| **Edit Code** | `Code` | — | Opens the node's underlying logic in the syntax-highlighted `code_editor` tab. |
| **Save as Blueprint** | `Save` | — | *(Custom nodes only)* Saves custom node schema into project blueprint library. |
| *Separator* | — | — | — |
| **Apply update to Node** | `RefreshCw` | — | Synchronizes node ports and defaults with updated upstream blueprint schema. |
| **Reset Node** | `RotateCcw` | — | Reverts altered port values and configurations back to blueprint default. |
| *Separator* | — | — | — |
| **Duplicate Node** | `Copy` | <kbd>Ctrl+D</kbd> | Clones selected node(s) with an offset position. |
| *Separator* | — | — | — |
| **Delete Node** | `Trash2` *(Danger)* | <kbd>Del / Backspace</kbd> | Deletes selected node(s) and severs all connected wires. |

### 6.2 Graph Canvas Background Context Menu (`useNodeMenu.js`)
* **Trigger:** Right-click on empty graph canvas.
* **Component:** `BaseContextMenu`
* **Item:** **Add Custom Node** (`Cpu`): Instantiates an empty custom JavaScript evaluation node template at cursor coordinates.

### 6.3 Node Port Options Menu (`NodePorts.vue`)
* **Trigger:** Click the 3-dots (`MoreVertical`) button on custom node input or output ports.
* **Component:** `BaseDropdown`

| Section | Option | Details |
| :--- | :--- | :--- |
| **Data Type** | • `number`<br>• `string`<br>• `boolean` | Changes port data type and color coding pin. |
| **Order** | • `Move Up` (`ArrowUp`)<br>• `Move Down` (`ArrowDown`) | Reorders port position vertically on the node face. |
| **Deletion** | • `Delete Port` (`Trash2`) | Removes dynamic port and removes attached wires. |

### 6.4 Variable Picker Dropdown (`VariableSelect.vue`)
* **Trigger:** Click on any node variable binding slot in the node inspector.
* **Features:** Search input filter, Scope badges (`GLOBAL` in blue / `LOCAL` in purple), type color indicators, and variable name selection.

---

## 7. Variable Manager Menus (`VariableManagerModal.vue`)

### 7.1 Variable Row Actions Menu
* **Trigger:** Click the 3-dots (`MoreVertical`) button on any variable row in the Variable Manager modal.
* **Component:** `BaseDropdown`

| Item | Icon | Description |
| :--- | :--- | :--- |
| **Duplicate** | `Copy` | Duplicates variable schema and default values. |
| **Add Get to Graph** | `ArrowDownRight` | *(Root level only)* Instantiates a "Variable: Get" node on the active graph canvas. |
| **Add Set to Graph** | `ArrowUpRight` | *(Root level only)* Instantiates a "Variable: Set" action node on the active graph canvas. |
| *Separator* | — | — |
| **Delete** | `Trash2` *(Danger)* | Permanently removes variable from the script / project scope. |

---

## 8. Animator Editor Menus (`useAnimatorMenu.js` & `AnimatorTimeline.vue`)

### 8.1 Animation Clip Hierarchy Context Menu (`useAnimatorMenu.js`)
* **Trigger:** Right-click on clip tree item or empty panel area in the Animator left panel.
* **Component:** `BaseContextMenu`

| Target | Menu Options |
| :--- | :--- |
| **Empty Background** | • **New Category** (`FolderPlus`)<br>• **New Clip** (`Film`)<br>• **Paste** (`Clipboard`) |
| **Category Node** | • **New Category** (`FolderPlus`)<br>• **Add Clip** (`Plus`)<br>• **Rename** (`Edit2`)<br>• **Duplicate** (`Files`)<br>• **Paste Inside** (`Clipboard`)<br>• **Delete** (`Trash2`) |
| **Clip Node** | • **New Clip** (`Plus`)<br>• **Rename** (`Edit2`)<br>• **Duplicate** (`Files`)<br>• **Copy** (`Copy`)<br>• **Cut** (`Scissors`)<br>• **Paste Below** (`Clipboard`)<br>• **Delete Clip** (`Trash2`) |

### 8.2 Timeline Source Options Menu (`AnimatorTimeline.vue`)
* **Trigger:** Click the 3-dots (`MoreVertical`) button next to the Source selector in the timeline right inspector.
* **Component:** `BaseDropdown`
* **Items:**
  - **Reset to Native Size** (`Maximize`): Resets crop coordinates to entire image size.
  - **Delete All Sources** (`Trash2`, danger): Clears all defined source regions.

---

## 9. Bottom Dock Panels Menus (Assets, Prefabs, Scripts)

### 9.1 Assets Panel Context Menu (`useAssetMenu.js`)
* **Trigger:** Right-click on an asset / folder or empty panel background.
* **Component:** `BaseContextMenu`

| Target | Menu Options |
| :--- | :--- |
| **Asset Item** | • **Asset Name Header** *(Disabled)*<br>• *(Context Appliers if Entity Selected)*:<br>&nbsp;&nbsp;↳ **Apply to SpriteRenderer** (`Stamp`)<br>&nbsp;&nbsp;↳ **Apply to Tilemap** (`Stamp`)<br>&nbsp;&nbsp;↳ **Apply to TextRenderer** (`Type`)<br>&nbsp;&nbsp;↳ **Apply to Audio Component** (`Volume2`)<br>&nbsp;&nbsp;↳ **Apply to Selected Clip** (`Stamp`) *(in Animator)*<br>• **Cut** (`Scissors`, <kbd>Ctrl+X</kbd>)<br>• **Copy** (`Copy`, <kbd>Ctrl+C</kbd>)<br>• **Copy ID** (`Hash`)<br>• **Rename** (`Edit2`, <kbd>F2</kbd>)<br>• **Delete** (`Trash2`, <kbd>Del</kbd>) |
| **Folder Item** | • **Folder Name Header**<br>• **Cut** (<kbd>Ctrl+X</kbd>)<br>• **Copy** (<kbd>Ctrl+C</kbd>)<br>• **Rename** (<kbd>F2</kbd>)<br>• **Delete** (<kbd>Del</kbd>) |
| **Empty Background** | • **New Folder** (`FolderPlus`)<br>• **Import Assets...** (`Download`)<br>• **Paste** (`ClipboardPaste`, <kbd>Ctrl+V</kbd>)<br>• **Refresh** (`RefreshCw`, <kbd>F5</kbd>) |

### 9.2 Prefabs Panel Context Menu (`usePrefabMenu.js`)
* **Trigger:** Right-click on a prefab / folder or empty panel background.
* **Component:** `BaseContextMenu`

| Target | Menu Options |
| :--- | :--- |
| **Prefab Item** | • **Prefab Name Header** *(Disabled)*<br>• **Instantiate to...** (`PlusSquare` → Submenu listing active scene layers)<br>• **Link to Selected (N)** (`Layers`, if entities selected)<br>• **Copy ID** (`Hash`)<br>• **Cut** (`Scissors`, <kbd>Ctrl+X</kbd>)<br>• **Copy** (`Copy`, <kbd>Ctrl+C</kbd>)<br>• **Rename** (`Edit2`, <kbd>F2</kbd>)<br>• **Duplicate** (`Copy`)<br>• **Delete** (`Trash2`, <kbd>Del</kbd>) |
| **Folder Item** | • **Folder Name Header**<br>• **Cut** (<kbd>Ctrl+X</kbd>)<br>• **Rename** (<kbd>F2</kbd>)<br>• **Delete** (<kbd>Del</kbd>) |
| **Empty Background** | • **New Folder** (`FolderPlus`)<br>• **Create Empty Prefab** (`Box`)<br>• **Paste** (`ClipboardPaste`, <kbd>Ctrl+V</kbd>)<br>• **Refresh** (`RefreshCw`, <kbd>F5</kbd>) |

### 9.3 Scripts Panel Context Menu (`useScriptMenu.js`)
* **Trigger:** Right-click on a script / folder or empty panel background.
* **Component:** `BaseContextMenu`

| Target | Menu Options |
| :--- | :--- |
| **Script Item** | • **Script Name Header** *(Disabled)*<br>• **Add to {entity.scriptId}** (`PlayCircle`, if entity has ScriptController)<br>• **Open Graph** (`Workflow`)<br>• **Copy ID** (`Hash`)<br>• **Cut** (`Scissors`, <kbd>Ctrl+X</kbd>)<br>• **Copy** (`Copy`, <kbd>Ctrl+C</kbd>)<br>• **Rename** (`Edit2`, <kbd>F2</kbd>)<br>• **Duplicate** (`Copy`)<br>• **Delete** (`Trash2`, <kbd>Del</kbd>) |
| **Folder Item** | • **Folder Name Header**<br>• **Cut** (<kbd>Ctrl+X</kbd>)<br>• **Rename** (<kbd>F2</kbd>)<br>• **Delete** (<kbd>Del</kbd>) |
| **Empty Background** | • **New Folder** (`FolderPlus`)<br>• **New Script** (`FileCode2`)<br>• **Paste** (`ClipboardPaste`, <kbd>Ctrl+V</kbd>)<br>• **Refresh** (`RefreshCw`, <kbd>F5</kbd>) |

---

## 10. Dashboard & Storage Menus

### 10.1 Project Card Context Menu (`useProjectMenu.js` / `DashboardPage.vue`)
* **Trigger:** Right-click on any project card in the Dashboard project gallery.
* **Component:** `BaseContextMenu`

| Item | Icon | Description |
| :--- | :--- | :--- |
| **Project Title Header** | — | Non-clickable title header. |
| *Separator* | — | — |
| **Open** | `FolderOpen` | Launches project editor in current tab. |
| **Open in New Tab** | `ExternalLink` | Launches project editor in a separate browser tab. |
| **Save Project** | `Save` | Exports project archive to local filesystem. |
| *Separator* | — | — |
| **Rename** | `Edit2` | Prompts to update project display name. |
| **Edit Description** | `Type` | Prompts to update project summary text. |
| *Separator* | — | — |
| **Delete Project** | `Trash2` *(Danger)* | Prompts for confirmation and permanently deletes project from OPFS. |

### 10.2 Storage Manager Context Menu (`OPFSPanel.vue`)
* **Trigger:** Right-click on any file or folder in the low-level OPFS panel.
* **Item:** **Delete Folder** / **Delete File** (`Trash2`, danger).

### 10.3 Engine Settings Resolution Dropdown (`SettingsTabEngine.vue`)
* **Trigger:** Click the `MonitorPlay` icon button next to target resolution inputs in Project Settings.
* **Component:** `BaseDropdown`
* **Items:**
  - Common Presets list: 1080p (1920×1080), 720p (1280×720), 480p, Pixel Art presets with active checkmark.
  - **Swap Orientation** (`ArrowRightLeft`): Inverts Width and Height dimensions.
