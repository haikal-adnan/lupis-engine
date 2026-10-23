# Bottom Dock: Assets, Prefabs, Console & Scripts Guide

The **Bottom Dock** is the primary resource and diagnostic center in the **Lupis Engine** visual editor. It provides a tabbed workspace containing four core management panels:

1. **Assets Panel (`assets`):** Project media ingestion, MSDF font compilation, audio playback, texture previews, and component assignment.
2. **Prefabs Panel (`prefabs`):** Reusable entity templates partitioned into World and UI domains with instancing and linking.
3. **Console Panel (`console`):** Runtime diagnostic logging, warning and error tracking, context-tagged stack badges, and filtering.
4. **Scripts Panel (`scripts`):** Visual Blueprint logic asset management, folder trees, entity attachment, and graph canvas launching.

---

## 1. Dock Architecture & Navigation (`BottomBar.vue`)

The dock is anchored at the bottom edge of the editor layout, operating below the primary WebGL canvas viewport and visual graph editor.

```
+----------------------------------------------------------------------------------------------------+
| [FolderOpen] Assets  |  [ScrollText] Scripts  |  [Terminal] Console  |  [Library] Prefabs          |
+----------------------------------------------------------------------------------------------------+
|  [Grid/List] | Assets > Characters > Hero          [ Search items... ]  [ + Import / New ]         |
|  +--------------------+  +--------------------+  +--------------------+  +--------------------+    |
|  | [Folder] Audio     |  | [Image] hero.png   |  | [Font] font.ttf    |  | [Box] Player.prefab|    |
|  +--------------------+  +--------------------+  +--------------------+  +--------------------+    |
+----------------------------------------------------------------------------------------------------+
```

### 1.1 Tab State & Toggle Behavior
- **Tab Activation:** Clicking any tab button activates that panel and expands the dock if closed.
- **Dock Minimization / Expansion:** Clicking the currently active tab toggles the dock open or collapsed (`workspaceStore.toggleBottomBar()`).
- **Contextual Animator Mode:** When the user switches to an **Animator Editor** tab, the bottom bar dynamically adapts, presenting the **Timeline** panel alongside the **Assets** tab.

---

## 2. Assets Panel (`AssetPanel.vue`)

The **Assets Panel** (`editor/src/features/assets/`) manages all raw multimedia files used by the runtime engine.

### 2.1 Supported Media Types & Formats

| Asset Type | Supported Extensions | Runtime Role & Conversion |
| :--- | :--- | :--- |
| **Textures / Sprites** | `.png`, `.jpg`, `.jpeg`, `.webp` | 2D sprite rendering, tilemap atlas sheets, and animation clip frames. |
| **Fonts** | `.ttf`, `.otf` | Automatically sent to the backend conversion service (`http://localhost:4000/api/convert-font`) and converted into a **Multi-channel Signed Distance Field (MSDF)** `.fnt` descriptor and `.png` texture atlas for crisp vector-like text rendering at any resolution. |
| **Audio** | `.ogg`, `.mp3`, `.wav` | Spatial audio and background music handled by runtime Web Audio API subsystems. |

### 2.2 Toolbar & Folder Breadcrumbs
- **View Mode Switcher:** Toggle between **Grid View** (responsive thumbnail tiles) and **List View** (compact tabular rows).
- **Interactive Breadcrumbs:** Shows the active directory path (e.g., `Assets > Characters > Hero`). Clicking any segment navigates directly to that folder.
- **Breadcrumb Drag Target:** You can drag any asset or subfolder and drop it onto a breadcrumb segment to move it up the directory hierarchy.
- **Real-Time Search:** Filters assets and folders in the current view by matching against `scriptId` or folder name.
- **Import Button (`Plus`):** Triggers the native browser file picker dialog.

### 2.3 Asset Previews (Double-Click)
- **Texture Double-Click:** Opens the high-resolution image preview lightbox modal (`usePopImage`).
- **Audio Double-Click:** Spawns an interactive waveform audio player modal (`usePopAudio`) to audition sound clips.
- **Folder Double-Click:** Enters and displays the contents of that folder.

### 2.4 Context Menu Operations (`useAssetMenu.js`)

Right-clicking an asset reveals contextual actions, including automatic component appliers:

```
+-----------------------------------+
| hero_texture.png                  |
|-----------------------------------|
| [Stamp] Apply to SpriteRenderer   | <- Displayed if selected entity has SpriteRenderer
| [Stamp] Apply to Tilemap          | <- Displayed if selected entity has Tilemap
| [Type]  Apply to TextRenderer     | <- Displayed if font & entity has TextRenderer
| [Audio] Apply to Audio Component  | <- Displayed if audio & entity has Audio
|-----------------------------------|
| [Scissors] Cut           Ctrl+X   |
| [Copy]     Copy          Ctrl+C   |
| [Hash]     Copy ID                |
|-----------------------------------|
| [Edit2]    Rename            F2   |
|-----------------------------------|
| [Trash2]   Delete           Del   |
+-----------------------------------+
```

#### Context Menu Items:
1. **Contextual Component Appliers:**
   - If an entity is selected in the **Scene Hierarchy** and has an eligible renderer component, relevant applier items appear at the top of the menu:
     - `Apply to SpriteRenderer` (Assigns texture asset to sprite renderer).
     - `Apply to Tilemap` (Assigns tileset texture).
     - `Apply to TextRenderer` (Assigns MSDF font to text component).
     - `Apply to Audio Component` (Assigns sound clip to entity audio component).
   - If in the **Animator Editor**, textures display `Apply to Selected Clip`.
2. **Copy ID (`Hash`):** Copies the asset's UUID/scriptId string to clipboard for use in scripts or code.
3. **Cut (`Ctrl+X`) & Copy (`Ctrl+C`):** Stages item in virtual clipboard. Pasting (`Ctrl+V`) into another folder moves (cut) or duplicates (copy) the file.
4. **Rename (`F2`):** Prompts for a new asset `scriptId`.
5. **Delete (`Del`):** Opens a safety confirmation dialog before permanently removing the asset and its stored binary file from OPFS.

---

## 3. Prefabs Panel (`PrefabPanel.vue`)

The **Prefabs Panel** (`editor/src/features/prefabs/`) stores reusable entity archetypes—complete entity templates including pre-configured components, transforms, and nested children.

### 3.1 Domain Separation (World vs. UI)
Prefabs are cleanly isolated into two distinct categories via dedicated tabs in the toolbar:

- **World Prefabs (`tab-world`):** 2D gameplay entities (characters, projectiles, props, checkpoints). Can only be instantiated into **World Layers**.
- **UI Prefabs (`tab-ui`):** Screen-space UI templates (health bars, inventory slots, dialogue windows, HUD buttons). Can only be instantiated into **UI Layers**.

### 3.2 Toolbar Controls
- **View Mode Switcher:** Toggle between Grid and List layouts.
- **Folder Breadcrumbs:** Directory navigation with drag-and-drop support.
- **Domain Tabs (`World` / `UI`):** Switches active view between game world and user interface prefab templates.
- **Search Input:** Filters prefabs and folders by name.

### 3.3 Context Menu & Instantiation (`usePrefabMenu.js`)

Right-clicking a prefab card provides direct instantiation and linking tools:

| Action | Icon | Shortcut | Description |
| :--- | :--- | :--- | :--- |
| **Instantiate to...** | `PlusSquare` | — | Opens a submenu listing all active scene layers matching the prefab's domain. Clicking a layer immediately spawns an instance of the prefab into the scene under that layer. |
| **Link to Selected (N)** | `Layers` | — | Links the prefab definition to all currently selected entities in the scene hierarchy. Linked entities reflect prefab updates and display a sky-blue `Box` icon. |
| **Copy ID** | `Hash` | — | Copies the unique prefab ID to the clipboard. |
| **Cut / Copy / Paste** | `Scissors`/`Copy` | <kbd>Ctrl+X</kbd> / <kbd>Ctrl+C</kbd> / <kbd>Ctrl+V</kbd> | Move or duplicate prefabs across virtual folders. |
| **Rename** | `Edit2` | <kbd>F2</kbd> | Updates the prefab's identifier across storage. |
| **Duplicate** | `Copy` | — | Creates a clone named `<PrefabName>_copy`. |
| **Delete** | `Trash2` *(Danger)* | <kbd>Del</kbd> | Prompts for confirmation and permanently deletes the prefab definition. |

#### Empty Area Context Menu:
- **New Folder (`FolderPlus`):** Creates a categorized prefab subfolder.
- **Create Empty Prefab (`Box`):** Creates an empty unpopulated prefab template.
- **Paste (`Ctrl+V`):** Pastes copied prefab into the active folder.
- **Refresh (`F5`):** Refreshes the panel.

---

## 4. Console Panel (`ConsolePanel.vue`)

The **Console Panel** (`editor/src/features/consoles/`) provides real-time logging, warning, error diagnostics, and script execution tracing.

### 4.1 Filter Bar & Status Badges
- **Log Level Filters:** Quick-toggle buttons displaying log counts:
  - **All:** Total count of all messages.
  - **Info (`Info`, Blue):** Standard runtime output and system events.
  - **Warn (`TriangleAlert`, Amber):** Deprecation notices, disconnected ports, and non-fatal warnings.
  - **Error (`CircleX`, Rose):** Unhandled exceptions, WebGL rendering failures, circular parenting attempts, or syntax errors.
- **Real-Time Text Filter:** Matches against message strings, sources, or contextual badge tags.
- **Clear Console (`Trash2`):** Instantly purges all log entries from the buffer.

### 4.2 Context Badge Decomposition (`ConsoleItem.vue`)

When blueprint scripts or runtime subsystems log messages, the console automatically extracts metadata into color-coded context badges:

```
[12:34:56]  [Main_Scene]  [Player]  [MovementLogic]  [OnTick]  Speed calculation: 250 px/s
   |              |          |             |            |               |
Timestamp       Scene      Entity       Script        Node           Message
                Badge      Badge         Badge        Badge
```

| Badge Tag | Color Scheme | Meaning |
| :--- | :--- | :--- |
| **Scene** | Gray / Secondary (`bg-secondary/80`) | The active scene where the event occurred. |
| **Entity** | Sky Blue (`bg-sky-500/10 text-sky-400`) | The `scriptId` of the entity running the logic. |
| **Script** | Purple (`bg-purple-500/10 text-purple-400`) | The Blueprint script asset name. |
| **Node** | Emerald (`bg-emerald-500/10 text-emerald-400`) | The specific Blueprint node that triggered the log. |

### 4.3 Smart Auto-Scroll Detection
- When you are at the bottom of the log list (`isUserAtBottom = true`), new logs automatically scroll the viewport down.
- If you scroll up to inspect previous errors, auto-scrolling pauses automatically to avoid interrupting your reading.
- Switching filter tabs automatically resets scroll position to the newest entry.

---

## 5. Scripts Panel (`ScriptPanel.vue`)

The **Scripts Panel** (`editor/src/features/scripts/`) houses the project's visual logic files—Blueprint graphs containing flow nodes, math operations, and event listeners.

### 5.1 Toolbar & Organization
- **View Mode Switcher:** Toggle between Grid View and List View.
- **Folder Breadcrumbs:** Hierarchical folder navigation for organizing scripts by system (e.g., `Scripts > AI > Enemies`).
- **Real-Time Search:** Instantly filters scripts by `scriptId`.
- **New Script Button (`Plus`):** Prompts for a script name and creates a new Blueprint script graph.

### 5.2 Opening & Editing (Double-Click)
- **Double-Click on a Script:** Spawns a dedicated **Script Editor (Visual Logic)** workspace tab (`tab_script_<id>`).
- The editor loads an infinite visual canvas where you wire nodes, connect typed pins, and inspect execution flows.

### 5.3 Context Menu Actions (`useScriptMenu.js`)

Right-clicking a script item displays operations for entity binding and code management:

| Action | Icon | Shortcut | Description |
| :--- | :--- | :--- | :--- |
| **Add to [Selected Entity]** | `PlayCircle` | — | Automatically attaches this script to the currently selected scene entity (requires a `ScriptController` component). |
| **Open Graph** | `Workflow` | — | Opens the script in the visual Blueprint Graph tab. |
| **Copy ID** | `Hash` | — | Copies the script's unique identifier to the clipboard. |
| **Cut / Copy / Paste** | `Scissors`/`Copy` | <kbd>Ctrl+X</kbd> / <kbd>Ctrl+C</kbd> / <kbd>Ctrl+V</kbd> | Moves or clones scripts across folders. |
| **Duplicate** | `Copy` | — | Creates a clone named `<ScriptName>_Copy`. |
| **Rename** | `Edit2` | <kbd>F2</kbd> | Prompts for a new script name. |
| **Delete** | `Trash2` *(Danger)* | <kbd>Del</kbd> | Prompts for confirmation and deletes the script graph from OPFS. |

---

## 6. Drag & Drop Resource Workflows

The bottom dock integrates seamlessly with the rest of the Lupis Editor interface:

```
[Assets Panel: hero.png]  ----(Drag & Drop)---->  [Canvas Viewport: Entity]      => Sets Texture
[Assets Panel: font.ttf]  ----(Drag & Drop)---->  [Property Inspector: Font]    => Sets BMFont
[Prefabs Panel: Box]      ----(Drag & Drop)---->  [Scene Hierarchy: Layer]      => Instantiates Prefab
[Scripts Panel: Move.js]  ----(Drag & Drop)---->  [Property Inspector: Script]  => Attaches Script
```

### 6.1 Moving Items Between Folders
1. Click and drag an asset, prefab, or script card.
2. Hover over a target folder in the panel until highlighted.
3. Release to move the item into that subfolder.
4. Alternatively, drag the card onto any segment in the **Breadcrumb trail** to move the item up to a parent directory.

### 6.2 External File Ingestion
- Drag files directly from your operating system's file explorer (Windows Explorer, macOS Finder) and drop them anywhere onto the **Assets Panel** canvas to upload and process them automatically.

---

## 7. Keyboard Shortcuts Reference

The following shortcuts are available across the bottom dock panels when focused:

| Shortcut | Panel Scope | Action |
| :--- | :--- | :--- |
| <kbd>Ctrl + C</kbd> | Assets / Prefabs / Scripts | Copy selected item to internal clipboard. |
| <kbd>Ctrl + X</kbd> | Assets / Prefabs / Scripts | Cut selected item (marked with reduced opacity). |
| <kbd>Ctrl + V</kbd> | Assets / Prefabs / Scripts | Paste staged clipboard item into active folder. |
| <kbd>F2</kbd> | Assets / Prefabs / Scripts | Open rename dialog prompt. |
| <kbd>Delete</kbd> | Assets / Prefabs / Scripts | Delete selected item with confirmation. |
| <kbd>F5</kbd> | All Panels | Refresh active panel contents. |

---

## 8. Key Source Code References

| Panel / Component | File Location |
| :--- | :--- |
| **Bottom Bar Container** | `editor/src/layouts/parts/BottomBar.vue` |
| **Asset Panel View** | `editor/src/features/assets/layouts/AssetPanel.vue` |
| **Asset Item Layout** | `editor/src/features/assets/layouts/AssetItem.vue` |
| **Asset Logic & Stores** | `editor/src/features/assets/useAssetLogic.js`, `useAssetStore.js` |
| **Asset Context Menu** | `editor/src/features/assets/useAssetMenu.js` |
| **Font MSDF Converter** | `editor/src/features/assets/composables/useFontConverter.js` |
| **Prefab Panel View** | `editor/src/features/prefabs/layouts/PrefabPanel.vue` |
| **Prefab Item Layout** | `editor/src/features/prefabs/layouts/PrefabItem.vue` |
| **Prefab Menu & Actions** | `editor/src/features/prefabs/usePrefabMenu.js`, `usePrefabActions.js` |
| **Console Panel View** | `editor/src/features/consoles/layouts/ConsolePanel.vue` |
| **Console Item Layout** | `editor/src/features/consoles/layouts/ConsoleItem.vue` |
| **Console Store** | `editor/src/features/consoles/useConsoleStore.js` |
| **Script Panel View** | `editor/src/features/scripts/layouts/ScriptPanel.vue` |
| **Script Item Layout** | `editor/src/features/scripts/layouts/ScriptItem.vue` |
| **Script Menu & Actions** | `editor/src/features/scripts/composables/useScriptMenu.js`, `useScriptActions.js` |
