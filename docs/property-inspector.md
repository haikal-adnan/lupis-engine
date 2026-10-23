# Property Inspector (Scene) Guide

The **Property Inspector** (`PropertyPanel.vue`) is the primary contextual configuration panel in the **Lupis Engine** visual editor. Anchored on the right sidebar (`RightPanel.vue`), it dynamically adapts its interface based on the active selection in the **Scene Hierarchy** or **WebGL Canvas Viewport**—allowing you to inspect and modify scene settings, rendering layers, entity metadata, spatial transforms, and modular **Entity Component System (ECS)** components.

---

## 1. Interface Overview & Contextual States

The Property Inspector is housed inside a collapsible right-hand sidebar (`RightPanel.vue`). Clicking the collapse button (`PanelRightClose`) minimizes the inspector into a narrow vertical strip; clicking anywhere on the strip expands it back.

```
+-------------------------------------------------------------------------+
| INSPECTOR                                                           [>] |
+-------------------------------------------------------------------------+
| v Object                                       [Override] [Player_Hero] |
|   ID             [ Player_Hero                                        ] |
|   Prefab         [ [Box] Hero_Template                           [->] ] |
|   Tag            [ Player                                         [x] ] |
|                  [ Select tag...                                    v ] |
|   Z-Index        [ 0                                                  ] |
|   Appearance     [ Active ] | [Eye] [Unlock]                            |
|-------------------------------------------------------------------------|
| v Transform                                                  [Override] |
|   Position       [ X: 120.00        ] [ Y: 340.00        ]              |
|   Rotation       [ R: 0.00°         ]                      [Pivot 3x3]  |
|   Size (px)      [ W: 64.00         ] [ H: 64.00         ] [Lock]       |
|   Scale          [ X: 1             ] [ Y: 1             ] [Lock]       |
|   Flip           [ Horz             ] [ Vert             ]              |
|-------------------------------------------------------------------------|
| v Image Renderer                                                 [Sync] |
|   [52x52 Crop]   Texture  [ hero_sheet.png                       [Q] ]  |
|   Source Rect    [ X: 0    ] [ Y: 0    ] [ W: 32   ] [ H: 32   ]        |
|   Opacity        [ %: 100                                             ] |
|   Rendering      [ Pixelated                           v ] [ SDF ]      |
|-------------------------------------------------------------------------|
| Actions                                                                 |
| [ Add Component...                                                  v ] |
+-------------------------------------------------------------------------+
```

### 1.1 Contextual Selection Modes (`useInspectorSelection.js`)

The inspector automatically switches between four distinct views depending on what is selected in the active workspace:

| Selection State | Condition | Rendered Editors |
| :--- | :--- | :--- |
| **1. Empty Selection (Default)** | No entity or layer is selected (`hasSelection === false`). | `EditorProject.vue` (**Quick Actions**) + `EditorScene.vue` (**Scene Properties**). |
| **2. Layer Selection** | A single World or UI layer row is selected (`selectedIsLayer === true`). | `EditorLayer.vue` (**Layer Inspector**). |
| **3. Single Entity / Master Prefab** | A single top-level entity is selected, or a Master Prefab tab is active (`selectedEntity !== null`). | `EditorObject.vue`, `EditorTransform.vue` (or `EditorUITransform.vue`), all attached component editors, and the **Add Component** dropdown. |
| **4. Multi-Selection** | Two or more top-level entities are selected (`isMultiSelection === true`). | Displays a centered placeholder: *"Multiple objects selected"*. |

> [!NOTE]
> **Parent-Child Selection Resolution:** When you select a parent entity in the Scene Hierarchy, all of its descendant children are visually highlighted as well. However, `useInspectorSelection` resolves `topLevelSelection` to the single root parent, allowing you to inspect and edit the parent entity's properties without triggering the multi-selection placeholder. Pressing <kbd>Escape</kbd> at any time clears the current selection and returns the inspector to the default Scene & Quick Actions view.

---

## 2. Prefab Override & Synchronization System (`useInspectorPrefab.js`)

When inspecting an entity instantiated from a **Prefab** (`prefabId != null`), the Property Inspector tracks property divergences between the scene instance and the Master Prefab asset in real time.

### 2.1 Sync vs. Override Status Badges
Every section header (`Object`, `Transform`, and each attached component) displays a live status pill:
- **`Sync` (Emerald Badge):** All properties in this section match the Master Prefab definition.
- **`Override` (Amber Badge):** One or more properties on this component or entity have been modified locally in the scene.

> [!TIP]
> **Position Exemption:** Moving a prefab instance in the scene (`Transform.x` or `Transform.y`) is treated as natural placement and does **not** flag the `Transform` component as `Overridden`. Modifying any other property (such as `scale`, `rotation`, `width`, `height`, `tags`, or renderer settings) immediately marks the component and entity as `Overridden`.

### 2.2 Prefab Lifecycle Actions
Available via the **Object** and individual **Component** 3-dots (`MoreVertical`) menus:

| Action | Scope | Behavior |
| :--- | :--- | :--- |
| **Apply to Master** | Entity (`EditorObject`) | Pushes all local component and property overrides from this scene instance back into the Master Prefab asset, updating all synced instances project-wide. |
| **Revert to Sync** | Entity (`EditorObject`) | Resets all components, tags, and active states back to the Master Prefab's values while **preserving the instance's current `(x, y)` position**. |
| **Sync Component** | Individual Component | Resets only that specific component back to the Master Prefab state (preserving `(x, y)` if syncing `Transform` or `UITransform`). |
| **Unpack Prefab** | Entity (`EditorObject`) | Severs the link to the Master Prefab (`prefabId = null`), converting the entity into an independent standard scene entity. |

> [!IMPORTANT]
> **Prefab Structural Lock (`isLockedByPrefab`):** You cannot add or remove components on a linked Prefab instance or any of its nested child entities directly in the scene. Attempting to do so triggers a warning: *"Cannot add/remove components to a Prefab instance or its children. Unpack it first."* To modify a prefab's component structure, either **Unpack** the instance or edit the **Master Prefab** directly.

---

## 3. Default Scene View: Quick Actions & Scene Properties

When no entity or layer is selected (e.g., after clicking empty canvas space or pressing <kbd>Escape</kbd>), the inspector presents global viewport overlays and scene-level settings.

### 3.1 Quick Actions (`EditorProject.vue`)
Provides instant toggles for viewport debugging overlays bound to project settings:

| Checkbox Toggle | Setting Binding | Description |
| :--- | :--- | :--- |
| **Show UI Bound** | `settings.ui.showUIBorder` | Displays the viewport resolution boundary frame for User Interface elements (disabled if UI domain is inactive). |
| **Show World Bounds** | `settings.worldBounds.active` | Renders the rectangular world camera boundary limits in the scene viewport. |
| **Show Collider Solid Bounds** | `settings.colliders.solid` | Toggles wireframe gizmos for all `solid` physics colliders. |
| **Show Collider Trigger Bounds** | `settings.colliders.trigger` | Toggles wireframe gizmos for all `trigger` zone colliders. |
| **Show Collider Hitbox Bounds** | `settings.colliders.hitbox` | Toggles wireframe gizmos for offensive `hitbox` colliders. |
| **Show Collider Hurtbox Bounds** | `settings.colliders.hurtbox` | Toggles wireframe gizmos for defensive `hurtbox` colliders. |

### 3.2 Scene Properties (`EditorScene.vue`)
Configures properties specific to the currently active scene:
- **Background Color (`backgroundColor`):** Opens a color picker and hex input (`BaseColor`) to set the WebGL canvas clear color for the active scene (default `#1a1a1a`).

---

## 4. Layer Editor (`EditorLayer.vue`)

Selecting a layer row under **World** or **User Interface** in the Scene Hierarchy opens the **Layer** inspector section.

### 4.1 Header & Context Menu
- **Domain Type Badge:** Displays either **`World Layer`** (Emerald badge) or **`UI Layer`** (Blue badge) in the section header.
- **Section Menu (3-Dots):**
  - **Hide / Show Layer:** Toggles layer rendering visibility in the viewport.
  - **Deactivate / Activate Layer:** Toggles runtime execution and processing for all entities on the layer.
  - **Copy ID:** Copies the layer's `scriptId` to the clipboard.
  - **Delete Layer:** Prompts for confirmation and deletes the layer and all entities inside it.

### 4.2 Layer Properties

| Property | Control Type | Details & Validation |
| :--- | :--- | :--- |
| **ID** | `BaseInput` | The layer's unique `scriptId`. Automatically sanitizes spaces into underscores (`_`), strips non-alphanumeric characters (`[^a-zA-Z0-9_]`), and blocks duplicate names across all World and UI layers. |
| **Z-Index** | `BaseNumber` | Integer sorting order (`step: 1`, `precision: 0`). Layers with higher Z-Index values render in front of lower ones. |
| **Appearance** | Button Group | • **Active / Inactive (`Power`):** Enables or disables the layer at runtime.<br>• **Visibility (`Eye` / `EyeOff`):** Shows or hides the layer in the editor/runtime.<br>• **Lock (`Lock` / `Unlock`):** Locks all entities inside the layer from viewport selection or gizmo movement. |
| **Opacity** | `BaseNumber` (`%`) | Scrubbable percentage (`0%` to `100%`, stored internally as `0.00` to `1.00`) controlling the alpha transparency of the entire layer pass. |

---

## 5. Entity Core Editors

Every selected entity permanently displays two foundational sections at the top of the inspector: **Object** and **Transform** (or **UI Transform**).

### 5.1 Object Identity & Multi-Tag Editor (`EditorObject.vue`)

Manages entity identification, prefab linkage, multi-tagging, render sorting, and editor states.

#### Properties & Controls:
1. **ID (`scriptId`):**
   - Unique identifier used to reference the entity in Blueprint scripts.
   - Automatically formats on blur (`a-z, A-Z, 0-9, _`) and validates uniqueness against all other entities in the active scene.
2. **Prefab Link Row** *(Visible only on Prefab instances)*:
   - Displays the linked Master Prefab's `scriptId` inside a read-only badge and provides an **Open Prefab Master (`ExternalLink`)** button.
3. **Tag (Multi-Tag System):**
   - Entities support **multiple simultaneous tags** (`entity.tags[]`), with the first tag automatically assigned as the primary `entity.tag` for legacy compatibility.
   - **Assigned Tags List:** Displays all tags currently attached to the entity above the dropdown. Hovering over any tag reveals a red `Trash2` button to remove that tag from the entity.
   - **Interactive Tag Dropdown (`BaseSelect`):**
     - **Assign Tag:** Select any existing project tag (already-assigned tags are disabled).
     - **Create New Tag...:** Opens a prompt dialog to register a new tag in `project.tags` and immediately assigns it to the selected entity.
     - **Inline Rename Tag:** Renames a tag in `project.tags` and **automatically propagates the new name across all entities in all scenes**.
     - **Inline Delete Tag:** Prompts for confirmation, deletes the tag from the project, and **strips it from all entities across all scenes**.
4. **Z-Index:**
   - Integer sorting priority within the entity's parent layer (disabled when the entity is locked).
5. **Appearance:**
   - **Active / Inactive:** Toggles whether the entity exists and runs scripts/physics at runtime.
   - **Visibility (`Eye` / `EyeOff`):** Toggles visual rendering in the viewport.
   - **Lock (`Lock` / `Unlock`):** Prevents accidental selection or gizmo manipulation on the canvas.

---

### 5.2 World Transform Editor (`EditorTransform.vue`)

Displayed for all entities residing in a **World Layer**.

```
+-------------------------------------------------------------------------+
| v Transform                                                  [Override] |
|   Position       [ X: 250.00        ] [ Y: 180.00        ]              |
|   Rotation       [ R: 45.00°        ]                      +---------+  |
|                  (Link) World Rot: 90.00°                  | o  o  o |  |
|   Size (px)      [ W: 100.00        ] [ H: 100.00   ] [L]  | o  *  o |  |
|   Scale          [ X: 1             ] [ Y: 1        ] [L]  | o  o  o |  |
|                  (Link) World Scale: 2.00 x 2.00           +---------+  |
|   Flip           [ <-> Horz         ] [ ^v Vert          ]    PIVOT     |
+-------------------------------------------------------------------------+
```

#### Section Menu (3-Dots):
- **Sync Transform:** *(Prefab instances only)* Reverts rotation, size, scale, pivot, and flip to the Master Prefab while keeping the current `(x, y)` scene coordinates.
- **Reset Values:** Resets `x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5, flipX: false, flipY: false`.
- **Fit All Child to Me:** *(Visible only when the entity has child entities)* Calculates the combined world-space bounding box of all descendant children and automatically adjusts the parent's `width`, `height`, `pivotX`, and `pivotY` to tightly wrap them.

#### Properties & Controls:
| Property | Controls | Behavior & Special Rules |
| :--- | :--- | :--- |
| **Position** | `X`, `Y` (`BaseNumber`) | Local coordinates (`precision: 2`). If the entity has a parent, coordinates are relative to the parent's transform. |
| **Rotation** | `R` (`0°` to `359°`, cyclic) | Local rotation angle in degrees. If the entity is parented, an amber **`World Rot: X°`** indicator appears underneath showing the effective world-space angle. |
| **Pivot (`PivotControl`)** | Interactive 3×3 Grid | Sets the normalized origin point (`pivotX`, `pivotY` in `{0, 0.5, 1}`). **Smart Compensation:** Changing the pivot automatically recalculates `x` and `y` in world space so the entity stays visually stationary on the canvas. |
| **Size (px)** | `W`, `H` + **Lock Ratio** | Pixel dimensions (`min: 1`). Clicking the `Lock` icon preserves the width-to-height aspect ratio.<br>• **Text Lock:** If a `TextRenderer` is attached, `H` is disabled with the notice *"Height is controlled by Text Renderer"*.<br>• **Tilemap Lock:** If a `Tilemap` is attached, both `W` and `H` are disabled with the notice *"Size is controlled by Tilemap Auto Fit"*. |
| **Scale** | `X`, `Y` + **Lock Scale** | Integer scale multipliers (`min: 1`, `precision: 0`). When **Lock Scale Uniformly (`isScaleLocked`)** is active (default), editing `X` automatically updates `Y` and vice versa. Displays **`World Scale: X x Y`** when parented. |
| **Flip** | `Horz` (`flipX`), `Vert` (`flipY`) | Mirrors the entity horizontally or vertically across its pivot axis. |

---

### 5.3 UI Transform Editor (`EditorUITransform.vue`)

Replaces `Transform` for all entities residing in a **User Interface (`UI`) Layer**. Includes all capabilities of `EditorTransform.vue` plus screen-space anchoring.

#### UI-Specific Additions:
1. **Anchor Grid (`AnchorControl.vue`):**
   - A 3×3 interactive matrix (`anchorX`, `anchorY` in `{0, 0.5, 1}`) positioned next to the **Position (Offset)** inputs.
   - Pins the UI element relative to the 9 reference points of its parent container or screen viewport (Top-Left, Top-Center, Top-Right, Middle-Left, Center, Middle-Right, Bottom-Left, Bottom-Center, Bottom-Right).
2. **Position (Offset):**
   - `X` and `Y` represent pixel offsets relative to the selected **Anchor** point.
3. **Section Menu (3-Dots) Additions:**
   - **Reset Position:** Resets `x = 0`, `y = 0`, and `rotation = 0`.
   - **Center Anchors:** Sets `anchorX = 0.5`, `anchorY = 0.5`, `x = 0`, and `y = 0`, centering the element in its container.
   - **Fit All Child to Me:** Wraps parent bounds around all nested UI child elements.

---

## 6. Visual Renderer Editors (Mutually Exclusive)

In Lupis Engine's ECS architecture, an entity can only possess **one** visual renderer component at a time (`RENDERER_GROUP = ['SpriteRenderer', 'ShapeRenderer', 'TextRenderer', 'Tilemap']`). Once one renderer is attached, the remaining three are marked as **`(Conflict)`** in the **Add Component** menu.

---

### 6.1 Image Renderer (`EditorSprite.vue` — `SpriteRenderer`)

Renders 2D textures, sprites, and cropped spritesheet sub-regions.

#### Section Menu (3-Dots):
- **Reset to Native Size:** Resets `sourceX = 0, sourceY = 0` and restores both `sourceWidth / sourceHeight` and the entity's `Transform / UITransform` dimensions to the raw pixel dimensions of the texture asset.
- **Sync Component:** *(Prefab instances only)* Reverts sprite settings to the Master Prefab.
- **Remove Component:** Removes `SpriteRenderer` from the entity. **Blocked if `SpriteAnimator` is attached** (*"Cannot remove Image Renderer while Animator is present"*).

#### Animator Takeover Overlay:
When the entity also has an **enabled `SpriteAnimator`** component, `Image Renderer` is overlaid with a dark lock screen:
> *"Controlled by **Animator** — Disabled the animator to edit manually."*

#### Properties & Interactive Cropping:
1. **Interactive Crop Thumbnail (`BaseCropThumbnail.vue`):**
   - Displays a pixel-accurate `52×52` preview of the active crop region.
   - **Clicking the thumbnail** opens the full-screen **Interactive Sprite Crop Modal**:
     - **8 Resize Handles (`N, S, E, W, NW, NE, SW, SE`) & Draggable Crop Box** with a Rule-of-Thirds guide overlay.
     - **Grid Snap Presets:** Toggle between `Off` (`1px`), `16px`, `32px`, and `64px` snapping for rapid spritesheet slicing.
     - **Canvas Navigation:** Scroll wheel to zoom (`10%–400%`), `Space + Drag` to pan, and **Reset Full** to select the entire image.
     - **Proportional Transform Scaling:** Updating the crop rectangle automatically updates the entity's `Transform` or `UITransform` width and height while preserving uniform scale ratios.
2. **Texture Selector:** Displays the assigned texture's `scriptId` (or `None`). You can also assign textures by dragging an image from the **Assets Panel** or right-clicking an asset and choosing **Apply to SpriteRenderer**.
3. **Source Rect (`X`, `Y`, `W`, `H`):** Scrubbable numeric inputs defining the pixel sub-rectangle sampled from the source texture.
4. **Opacity (`%`):** Alpha transparency from `0%` to `100%`.
5. **Rendering:**
   - **Filter Mode (`BaseSelect`):** `Pixelated` (nearest-neighbor for crisp pixel art) or `Smooth` (bilinear filtering for HD art).
   - **SDF Toggle (`useSDF`):** Enables Signed Distance Field rendering for sharp vector-like edges when scaling.

---

### 6.2 Sprite Animator (`EditorAnimator.vue` — `SpriteAnimator`)

Drives frame-by-frame spritesheet animations. **Requires `SpriteRenderer`** to be present on the entity before it can be added.

| Property | Control | Description |
| :--- | :--- | :--- |
| **Status** | `Enabled` / `Disabled` (`BaseButton`) | Toggles whether the animator overrides the entity's `SpriteRenderer`. Disabling it allows manual editing in `Image Renderer`. |
| **Playback** | `Playing` / `Paused` (`BaseButton`) | Plays or pauses real-time animation preview directly in the scene viewport. |
| **Current Frame** | `BaseNumber` (`F 1 of N`) | Visible when active and a clip is selected. Allows scrubbing or stepping through individual frames (`1` to `maxFrames`, cyclic) while playback is paused. |
| **Current Clip** | `BaseSelect` | Dropdown listing all animation clips (`clip.scriptId`) defined on this entity. |
| **Clips Data** | Counter + `Open Editor` Button | Displays total defined clips (`N clip(s) defined`). Clicking **Open Editor** launches the dedicated **Animator Editor** workspace tab (disabled on linked Prefab instances). |

---

### 6.3 Shape Renderer (`EditorShape.vue` — `ShapeRenderer`)

Renders custom vector polygons, line segments, and circles with optional built-in geometry collision.

| Subgroup | Property | Control | Description |
| :--- | :--- | :--- | :--- |
| **Fill** | **Fill Toggle** | `BaseCheckbox` | Enables or disables interior polygon/circle fill (`isFilled`). When unchecked, Fill Color and Opacity are grayed out. |
| | **Color** | `BaseColor` | Hex color picker and input for the shape interior (default `#ff1e00`). |
| | **Opacity** | `BaseNumber` (`%`) | Scrubbable fill alpha transparency (`0%` to `100%`). |
| **Outline** | **Width** | `BaseNumber` (`W`) | Stroke thickness in pixels (`min: 0`) for polygon edges and line segments. |
| | **Color** | `BaseColor` | Hex color picker for the stroke outline (default `#0066FF`). |
| | **Opacity** | `BaseNumber` (`%`) | Scrubbable outline alpha transparency (`0%` to `100%`). |
| **Editor** | **Open Shape Editor** | `BaseButton` | Opens a dedicated **Shape Editor** tab (`type: 'shape_editor'`) to interactively draw and move vertices, polygons, segments, and circles (disabled on linked Prefab instances). |
| **Collision** | **Polygon Physics** | `BaseCheckbox` | Enables solid physics collision for closed polygons (`enablePolygonCollision`). |
| | **Segment Physics** | `BaseCheckbox` | Enables edge physics collision for line segments (`enableSegmentCollision`). |
| | **Circle Physics** | `BaseCheckbox` | Enables radial physics collision for circles (`enableCircleCollision`). |

---

### 6.4 Text Renderer (`EditorText.vue` — `TextRenderer`)

Renders crisp **Multi-channel Signed Distance Field (MSDF)** typography with layout formatting, outlines, and drop shadows.

#### Typography & Layout Controls:
1. **Header Preview & Font Row:**
   - **Live `Aa` Preview Box:** Reflects the current text color and opacity over a dotted background grid.
   - **Font Selector:** Displays the active MSDF font family (or assign a `.ttf`/`.otf` font from the **Assets Panel** via **Apply to TextRenderer**).
   - **Mode (`BaseSelect`):** Switch between `Static` and `Rich Text` rendering modes.
2. **Text (`BaseTextArea`):** Resizable multi-line text input for the string content.
3. **Font Size (`SZ`) & Auto Line (`BaseCheckbox`):**
   - `Font Size`: Character size in pixels (`min: 1`, default `24`).
   - `Auto Line`: When checked (default), automatically expands line count to fit text and locks the entity's `Transform` height.
4. **Max Line (`L`) & Overflow (`BaseSelect`):**
   - `Max Line`: Maximum number of visible text lines (`min: 1`, editable when `Auto Line` is unchecked).
   - `Overflow`: `Wrap` (breaks lines at container width) or `Ellipsis` (truncates overflowing text with `...`).
5. **Line Space (`H`) & Char Space (`S`):**
   - `Line Space`: Vertical line height multiplier (`step: 0.1`, default `1.2`).
   - `Char Space`: Horizontal tracking/kerning offset between characters (`step: 0.1`, default `0`).
6. **Alignment & Align Line:**
   - **Alignment (Horizontal):** Button group for `Left`, `Center`, `Right`, and `Justify`.
   - **Align Line (Vertical):** Button group for `Top`, `Middle` (`mid`), and `Bottom`.

#### Styling Effects (Color, Outline & Drop Shadow):
- **Text Color:** `BaseColor` picker paired with an `OP` Opacity input (`0%–100%`).
- **Outline:** `BaseColor` picker paired with a `W` stroke width input (`0.00` to `1.00`, `step: 0.05`).
- **Drop Shadow (`shadowEnabled` Checkbox):**
  - When enabled, reveals:
    - **Color & Opacity (`OP`):** Shadow color picker and alpha percentage (`0%–100%`).
    - **Offset (`X`, `Y`):** Horizontal and vertical shadow displacement in pixels.
    - **Blur (`B`):** Shadow softness radius (`0` to `20`, `step: 1`).

---

### 6.5 Tilemap (`EditorTilemap.vue` — `Tilemap`)

Renders grid-based 2D tilemaps. **Available only on World Entities** (automatically excluded from UI entities).

- **Header Dimensions Badge:** Displays the total computed pixel footprint of the tilemap in the section header: `{{ totalWidth }}px × {{ totalHeight }}px` (calculated as `mapWidth × tileWidth` by `mapHeight × tileHeight`).
- **Source Row:**
  - Displays a thumbnail preview of the assigned tileset texture (`BaseThumbnail`).
  - **Open Editor (`Brush`):** Launches the dedicated **Tilemap Editor** workspace tab for painting, erasing, and flood-filling tiles (disabled on linked Prefab instances).
- **Opacity (`%`):** Scrubbable alpha transparency (`0%` to `100%`).
- **Rendering:** Texture filtering mode (`Pixelated` vs. `Smooth`).
- **Collision (`Solid` Checkbox):** Enables solid physics blocking across painted tiles (`isSolid`).

---

## 7. Physics, Logic & Audio Component Editors

Unlike visual renderers, simulation, logic, and audio components can be freely combined with any renderer on the same entity.

### 7.1 Physics Body (`EditorPhysics.vue` — `Physics`)

Configures 2D rigidbody dynamics and terrain slope adaptation.

| Property | Control | Range / Options | Description |
| :--- | :--- | :--- | :--- |
| **Simulation** | `Running` / `Paused` | Boolean (`enabled`) | Toggles physics integration for this entity at runtime. |
| **Body Type** | `BaseSelect` | • `Dynamic (Standard)`<br>• `Static (Immovable)`<br>• `Kinematic (Scripted)` | Determines how forces, gravity, and collisions affect the body. |
| **Mass (kg)** | `BaseNumber` (`M`) | `min: 0.1`, `step: 0.01` | Mass of the body in kilograms (default `1.00`). |
| **Linear Drag** | `BaseNumber` (`D`) | `min: 0`, `step: 0.01` | Air/ground resistance damping velocity over time (default `1.00`). |
| **Gravity Scale** | `BaseNumber` (`G`) | `step: 0.01` | Multiplier applied to global scene gravity for this entity (default `1.00`; set to `0` for top-down games or flying entities). |
| **Align to Slope** | `BaseCheckbox` | Boolean (`alignToSlope`) | Rotates the entity automatically to match the surface normal of sloped terrain. |
| **Adapt Speed** | `BaseNumber` (`S`) | `min: 1`, `step: 1` | *(Visible when Align to Slope is checked)* Interpolation speed for slope rotation adaptation (default `12`). |
| **Max Slope (°)** | `BaseNumber` (`∠`) | `5°` to `89°`, `step: 1` | *(Visible when Align to Slope is checked)* Steepest incline angle in degrees the entity can climb (default `60°`). |

---

### 7.2 Multi-Collider Editor (`EditorCollider.vue` — `Collider`)

Lupis Engine features a **Multi-Collider Architecture**: a single `Collider` component can house an array of independent collision shapes (`Collider.data[]`), allowing one entity to simultaneously have a physical foot collider, a body hurtbox, and a weapon attack hitbox.

```
+-------------------------------------------------------------------------+
| v Collider                                                       [Sync] |
|   ATTACHED COLLIDERS                                                    |
|   [ col_solid_1 (solid)                                       v ] [...] |
|   Script ID       [ col_solid_1                                       ] |
|   Status          [ Enabled                                           ] |
|   Type            [ Solid (Physics)                                 v ] |
|   Offset          [ X: 0.00           ] [ Y: 0.00           ]           |
|   Size (px)       [ W: 32.00          ] [ H: 32.00          ]           |
|   Corner Radius   [ R: 0.0                                            ] |
|   Rotation        [ R: 0.00°          ]                    [Pivot 3x3]  |
|   [x] Fit to Transform Size & Rotation                                  |
|   [ ] Lock World Rotation (Stay Upright)                                |
|   [x] Auto Flip with Facing / flipX                                     |
+-------------------------------------------------------------------------+
```

#### Managing Attached Colliders:
- **Attached Colliders Dropdown:** Switches the active editing context between all collider shapes on the entity. Enabled colliders display a blue checkmark (`Check`).
- **Collider Options Menu (`MoreVertical` button next to dropdown):**
  - **Add Collider (`Plus`):** Appends a new collider (`col_solid_<N>`, `32×32px`) to the entity and selects it.
  - **Remove Current (`Trash2`):** Prompts for confirmation and removes only the currently selected collider from the list.
- **Section Menu (Top-Right 3-Dots):**
  - **Sync Component:** Reverts all colliders on the entity to the Master Prefab state.
  - **Remove All Colliders:** Deletes the entire `Collider` component from the entity.

#### Per-Collider Properties:
| Property | Control | Description & Behavior |
| :--- | :--- | :--- |
| **Script ID** | `BaseInput` | Unique identifier for this specific collider shape (e.g., `col_hitbox_sword`). Validated against duplicate names on the same entity so Blueprint scripts can query specific colliders by ID. |
| **Status** | `Enabled` / `Disabled` | Toggles active collision detection for this individual collider shape. |
| **Type** | `BaseSelect` | • **Solid (Physics):** Blocks movement and resolves physical collisions.<br>• **Trigger (Zone):** Detects overlap events without physical blocking.<br>• **Hitbox (Attack):** Offensive damage-dealing volume.<br>• **Hurtbox (Damage Zone):** Defensive damage-receiving volume. |
| **Offset** | `X`, `Y` (`BaseNumber`) | Pixel offset relative to the entity's position. |
| **Size (px)** | `W`, `H` (`BaseNumber`) | Width and height of the bounding box (`min: 0`). |
| **Corner Radius (Capsule)** | `BaseNumber` (`R`) | Rounds the corners of the box into a **Capsule** or **Circle** (`min: 0`, `max: Math.floor(Math.min(W, H) / 2)`). |
| **Rotation & Pivot** | `R` (`0°–359°`) + `PivotControl` | Local rotation and 3×3 pivot origin for the collider shape. Changing the pivot automatically compensates `offsetX` and `offsetY`. |
| **Fit to Transform Size & Rotation** | `BaseCheckbox` (`autoFit`) | Automatically locks `Width`, `Height`, `Offset (0, 0)`, `Rotation (0°)`, and `Pivot` to mirror the entity's `Transform` / `UITransform` in real time. |
| **Lock World Rotation (Stay Upright)** | `BaseCheckbox` (`lockWorldRotation`) | Keeps the collider unrotated in world space even if the entity rotates. |
| **Auto Flip with Facing / flipX** | `BaseCheckbox` (`autoFlipX`) | Automatically mirrors horizontal collider offsets when the entity flips horizontally (`flipX` or `facingDirection`). |

---

### 7.3 Script Controller (`EditorScript.vue` — `ScriptController`)

Attaches one or more visual **Blueprint Scripts** (`ScriptController.data[]`) to an entity and exposes script-local variables for per-entity tuning.

#### Managing Attached Scripts:
- **Attached Scripts Dropdown:** Selects which attached script instance to inspect. Active scripts display a blue checkmark (`Check`).
- **Script Options Menu (`MoreVertical` button next to dropdown):**
  - **Add Script... (`Plus`):** Opens and focuses the **Scripts Panel** in the Bottom Dock so you can attach a script (via right-click **Add to [Entity]** or drag-and-drop).
  - **Remove Current (`Trash2`):** Prompts for confirmation (*"Detach Script?"*) and removes the selected script instance.

#### Selected Script Instance Controls:
1. **Active Status (`Active` / `Inactive`):** Toggles execution of this specific script instance on the entity.
2. **Source (`Open Visual Script`):** Opens the Blueprint visual node graph (`type: 'diagram'`) in a workspace tab.
3. **Exposed Script Variables (`currentVariables`):**
   - Automatically renders input rows for all `localVariables` defined in the Blueprint script:
     - `Number` → Scrubbable `BaseNumber` input
     - `Boolean` → `BaseCheckbox` toggle
     - `String` / Other → `BaseInput` text field
   - **Instance-Level Variable Overrides:** Modifying a variable value stores the override on the entity instance (`scriptInstance.variables[varId]`), highlights the input border and text in **amber**, and reveals a **Reset to Default (`RotateCcw`)** button next to the input. Clicking reset restores the script's original default value.

---

### 7.4 Audio Source (`EditorAudio.vue` — `Audio`)

Configures 2D spatial or global audio playback on an entity.

| Group | Property | Control | Description |
| :--- | :--- | :--- | :--- |
| **General** | **Active Status** | `Active` / `Muted` (`BaseButton`) | Toggles `isMute` for the audio source. |
| | **Audio Type** | `BaseSelect` | Categorizes the sound bus: `Background` (`background`), `Sound Effect (SFX)` (`sfx`), or `Voice` (`voice`). |
| | **Audio File** | Dual-Action Bar | • **Click Filename (`playAudio`):** Opens the interactive waveform audio player modal (`usePopAudio`) to audition the assigned sound.<br>• **Click Search Icon (`FolderSearch`):** Triggers asset selection. |
| **Playback** | **Volume** | `BaseNumber` (`%`) | Playback volume from `0%` to `100%` (default `100%`). |
| | **Pitch (Speed)** | `BaseNumber` (`X`) | Playback speed and pitch multiplier from `0.1` to `3.0` (`step: 0.1`, default `1.0`). |
| | **Play on Awake** | `BaseButton` (`autoplay`) | Automatically begins playback as soon as the scene loads or the entity spawns. |
| | **Loop** | `BaseButton` (`loop`) | Continuously repeats the audio clip. |
| **Lifecycle** | **Global Audio** | `BaseButton` (`persist`) | Toggles between **`Persist Across Scenes`** (continues playing seamlessly during scene transitions) and **`Destroy on Load`** (stops when leaving the scene). |
| | **Fade In / Out (s)** | `BaseNumber` (`0` to `10s`) | Smooth volume ramp-up (`fadeIn`) and ramp-down (`fadeOut`) durations in seconds (`step: 0.1`). |
| **Spatial 2D** | **Spatial 2D** | `BaseButton` (`spatial`) | Toggles between **`Enabled (Positional)`** (volume attenuates based on distance to camera/listener) and **`Disabled (Global)`**.<br>*(Note: Automatically disabled and grayed out when **Persist Across Scenes** is active).* |
| | **Min Distance** | `BaseNumber` (`px`) | *(Visible when Spatial 2D is enabled)* Distance (`refDistance`, default `100px`) within which audio plays at full volume. |
| | **Max Distance** | `BaseNumber` (`px`) | *(Visible when Spatial 2D is enabled)* Distance (`maxDistance`, default `1000px`, `min: refDistance + 1`) beyond which audio attenuates to silence. |

---

## 8. Component Addition & Dependency Matrix

At the bottom of the entity inspector, the **Actions → Add Component...** dropdown (`BaseSelect`) lists all modular ECS components. Unavailable options are automatically sorted to the bottom with an explanatory suffix:

| Option Label | Internal Key | Category | Availability Rules & Restrictions |
| :--- | :--- | :--- | :--- |
| **Image Renderer** | `SpriteRenderer` | Renderer | Marked `(Added)` if present; marked `(Conflict)` if `ShapeRenderer`, `TextRenderer`, or `Tilemap` is already attached. |
| **Shape Renderer** | `ShapeRenderer` | Renderer | Marked `(Added)` if present; marked `(Conflict)` if another Renderer is attached. |
| **Text Renderer** | `TextRenderer` | Renderer | Marked `(Added)` if present; marked `(Conflict)` if another Renderer is attached. |
| **Tilemap** | `Tilemap` | Renderer | **World Entities only** (hidden on UI entities). Marked `(Conflict)` if another Renderer is attached. |
| **Sprite Animator** | `SpriteAnimator` | Animation | Marked **`(Requires SpriteRenderer)`** and disabled until an **Image Renderer** component is attached to the entity. |
| **Audio** | `Audio` | Audio | Can be added to any entity (marked `(Added)` once attached). |
| **Physics Body** | `Physics` | Simulation | Can be added to any entity (marked `(Added)` once attached). |
| **Collider** | `Collider` | Simulation | Can be added to any entity. Supports multiple shapes inside a single component. |
| **Script Controller** | `ScriptController` | Logic | Can be added to any entity. Supports multiple Blueprint scripts inside a single component. |

---

## 9. Step-by-Step User Guides

### 9.1 Slicing a Spritesheet Using the Image Renderer Crop Modal
1. Select an entity with an **Image Renderer** component (or add one via **Add Component... → Image Renderer**).
2. In the **Bottom Dock (Assets Panel)**, right-click your spritesheet texture and select **Apply to SpriteRenderer**.
3. In the Property Inspector under **Image Renderer**, click the **52×52 Thumbnail** on the left.
4. In the **Crop Modal** that opens:
   - Set **Snap** in the bottom bar to match your grid size (`16px`, `32px`, or `64px`).
   - Drag the crop box handles around the desired sprite frame, or type exact pixel values into the `X`, `Y`, `W`, and `H` inputs.
5. Click **Done** (or press <kbd>Esc</kbd>). The sprite crops cleanly and the entity's `Transform` size adjusts proportionally.

### 9.2 Configuring Multiple Colliders (Body + Hitbox) on a Character
1. Select your character entity and choose **Add Component... → Collider**.
2. Configure the default collider (`col_solid_1`) as the physical body:
   - Set **Type** to `Solid (Physics)`.
   - Set **Corner Radius (Capsule)** to round the bottom edges for smooth platforming movement.
3. Click the **3-dots (`MoreVertical`)** button next to the **Attached Colliders** dropdown and select **Add Collider**.
4. Configure the second collider for attacks:
   - Change **Script ID** to `col_sword_hitbox`.
   - Set **Type** to `Hitbox (Attack)`.
   - Adjust **Offset (`X`, `Y`)** and **Size (`W`, `H`)** to position the attack zone in front of the character.
   - Ensure **Auto Flip with Facing / flipX** is checked so the hitbox automatically mirrors when the character turns left or right.

### 9.3 Tuning Exposed Script Variables Per Entity Instance
1. Select an entity that has a **Script Controller** with an attached Blueprint script.
2. Under **Script Controller**, locate the exposed variables list at the bottom of the section.
3. Enter a custom value (e.g., changing `MoveSpeed` from `200` to `350` for a fast enemy variant).
4. The input highlights in **amber** to indicate an instance override. Other entities sharing the same script retain the default `200` value.
5. To revert back to the script's default value at any time, click the amber **Reset (`RotateCcw`)** button next to the input.

---

## 10. Key Source Code References

| Component / Module | File Path |
| :--- | :--- |
| **Right Sidebar Wrapper** | `editor/src/layouts/parts/RightPanel.vue` |
| **Main Property Panel Container** | `editor/src/features/inspectors/layouts/PropertyPanel.vue` |
| **Selection Resolution Composable** | `editor/src/features/inspectors/composables/useInspectorSelection.js` |
| **Two-Way Property Binding Composable** | `editor/src/features/inspectors/composables/useInspectorBinding.js` |
| **Prefab Sync & Override Composable** | `editor/src/features/inspectors/composables/useInspectorPrefab.js` |
| **Transform Math & Fit-to-Child Logic** | `editor/src/features/inspectors/composables/useInspectorTransform.js` |
| **Quick Actions Inspector** | `editor/src/features/inspectors/layouts/settings/EditorProject.vue` |
| **Scene Properties Inspector** | `editor/src/features/inspectors/layouts/settings/EditorScene.vue` |
| **Layer Inspector** | `editor/src/features/inspectors/layouts/entity/EditorLayer.vue` |
| **Object & Multi-Tag Inspector** | `editor/src/features/inspectors/layouts/entity/EditorObject.vue` |
| **World Transform Inspector** | `editor/src/features/inspectors/layouts/entity/EditorTransform.vue` |
| **UI Transform Inspector** | `editor/src/features/inspectors/layouts/ui/EditorUITransform.vue` |
| **Image Renderer Inspector** | `editor/src/features/inspectors/layouts/entity/EditorSprite.vue` |
| **Sprite Animator Inspector** | `editor/src/features/inspectors/layouts/entity/EditorAnimator.vue` |
| **Shape Renderer Inspector** | `editor/src/features/inspectors/layouts/entity/EditorShape.vue` |
| **Text Renderer Inspector** | `editor/src/features/inspectors/layouts/entity/EditorText.vue` |
| **Tilemap Inspector** | `editor/src/features/inspectors/layouts/entity/EditorTilemap.vue` |
| **Physics Body Inspector** | `editor/src/features/inspectors/layouts/entity/EditorPhysics.vue` |
| **Multi-Collider Inspector** | `editor/src/features/inspectors/layouts/entity/EditorCollider.vue` |
| **Script Controller Inspector** | `editor/src/features/inspectors/layouts/entity/EditorScript.vue`, `EditorScriptItem.vue` |
| **Audio Source Inspector** | `editor/src/features/inspectors/layouts/entity/EditorAudio.vue` |
| **Interactive Crop Modal & Thumbnail** | `editor/src/components/display/BaseCropThumbnail.vue` |
| **Pivot & Anchor Matrix Controls** | `editor/src/components/inputs/PivotControl.vue`, `AnchorControl.vue` |
| **Component Default Schemas** | `editor/src/features/scenes/schemas/componentSchema.js` |
