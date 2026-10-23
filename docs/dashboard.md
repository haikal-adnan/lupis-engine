# Dashboard & Project Management Guide

The **Dashboard** (`/dashboard`) serves as the central hub and project launcher for **Lupis Engine**. It provides an integrated environment for managing project lifecycles, browsing active workspaces, importing and exporting engine archives, and bootstrapping new 2D/2.5D game projects directly within the browser using the **Origin Private File System (OPFS)**.

---

## 1. Interface Overview & Layout

The Dashboard interface is wrapped within `MainLayout.vue` and designed for responsive operation across desktop, tablet, and mobile displays.

```
+----------------------------------------------------------------------------------------------------+
|  [Logo] Lupis Engine          [  Search your projects... (Ctrl+K / Focus)  ]       Dashboard | Docs | Settings |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  My Projects                                                     [ + New ]  [ ^ Load Project ]     |
|  You have 3 active project(s). Drag & drop a .lupisproject file anywhere to load a project.        |
|                                                                                                    |
|  +---------------------+  +---------------------+  +---------------------+  +--------------------+ |
|  | [16:10 Thumbnail]   |  | [16:10 Thumbnail]   |  | [16:10 Thumbnail]   |  | [16:10 Thumbnail]  | |
|  |                     |  |                     |  |                     |  |                    | |
|  | Project Title       |  | Project Title       |  | Project Title       |  | Project Title      | |
|  | Short description.. |  | Short description.. |  | Short description.. |  | Short description. | |
|  | Updated 10/22/2026  |  | Updated 10/20/2026  |  | Updated 10/18/2026  |  | Updated 10/15/2026 | |
|  +---------------------+  +---------------------+  +---------------------+  +--------------------+ |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

### 1.1 Global Header Navigation (`MainLayout.vue`)

The top navigation header persists across all main hub pages:

| Element | Description |
| :--- | :--- |
| **Engine Branding & Logo** | Displays the Lupis Engine icon and title. Clicking immediately navigates back to `/dashboard`. |
| **Global Search Bar** | Context-aware search input. When on the dashboard, it displays the placeholder *"Search your projects..."* and performs live filtering across your project gallery. |
| **Navigation Links** | Quick links to **Dashboard** (`/dashboard`), **Documentation** (`/docs`), and **Settings** (`/settings`). |
| **Mobile Drawer (`Menu` / `X`)** | Collapsible navigation drawer on screens narrower than `md` (768px). |

### 1.2 Dashboard Action Bar

Positioned directly above the project gallery:

- **Title & Status Summary:** Displays the project collection heading ("My Projects") alongside a dynamic counter indicating total active projects or search matches.
- **New Project Button (`Plus`):** Opens the project creation modal dialog to scaffold a brand-new project.
- **Load Project Button (`Upload`):** Opens the browser file selector filtered to `.lupisproject` archives for rapid ingestion.
- **Mobile Action Row:** When viewed on small screens, action buttons adapt into full-width touch targets.

---

## 2. Core Features

### 2.1 Project Creation & Scaffolding

Clicking **New** (or **Create First Project** when the workspace is empty) triggers the `CreateNewProjectPop.vue` modal dialog.

#### Modal Form Fields:
1. **Project Name** (*Required*):
   - Title of the game project.
   - Automatically focused upon opening.
   - Submissions containing only whitespace are blocked, keeping the **Create** button disabled.
2. **Description** (*Optional*):
   - A short synopsis or design notes describing the game.
3. **Template**:
   - Defaults to an empty initialized project template with full filesystem structure.

#### Automated Scaffolding Pipeline:
When confirmed, `useProjectActions().createProject()` executes the following pipeline in browser OPFS:
1. Generates an RFC-compliant unique project identifier formatted as `proj_<timestamp>_<random6>` (e.g., `proj_1792078086510_2c36ig`).
2. Allocates a root project directory under `lupis-engine/projects/<projectId>/`.
3. Creates dedicated resource subdirectories:
   - `assets/` — Raw textures, audio files, MSDF fonts, and imported media.
   - `scenes/` — Individual JSON descriptors for game scenes.
   - `prefabs/` — Reusable entity prefab definitions.
   - `scripts/` — Visual blueprint logic graphs.
   - `workspaces/` — Fast-lookup workspace registries (`assets.json`, `scenes.json`, `prefabs.json`, `scripts.json`, `folders.json`).
4. Generates the default initial scene (`scene_main_<timestamp>.json`) containing:
   - Default **World Layer** (`World_Layer`, ID: `layer_world_default`).
   - Default **UI Layer** (`UI_Layer`, ID: `layer_ui_default`).
   - Default canvas background color (`#1a1a1a`).
5. Generates the root `project.json` specification conforming to `ProjectSchema`.
6. Triggers workspace loader state and redirects the browser immediately to the editor canvas at `/editor/:projectId`.

---

### 2.2 Project Gallery & Interactive Cards

All projects detected within OPFS are rendered in a responsive CSS grid:
- **1 column** on mobile devices (`< 640px`)
- **2 columns** on small tablets (`sm` breakpoint)
- **3 columns** on desktop displays (`lg` breakpoint)
- **4 columns** on wide screens (`xl` breakpoint)

#### Project Card Anatomy:
- **Thumbnail Canvas (16:10 Aspect Ratio):**
  - Renders the snapshot image saved from the editor viewport (`project.thumbnailUrl` or `project.snapshotUrl`).
  - If no snapshot has been captured yet, displays a clean placeholder icon (`Gamepad2`).
  - Hovering triggers a smooth zoom scaling animation (`scale-105`) with a cyan-tinted "Open Editor →" badge overlay.
- **Project Name:** Single-line clamped text highlighting with the accent color on hover.
- **Project Description:** Two-line clamped descriptive text summarizing project contents.
- **Last Modified Timestamp:** Formatted date string (`Updated M/D/YYYY`) reflecting the last time the project was committed or edited.
- **Primary Action:** Clicking anywhere on the project card routes the current window into `/editor/:projectId`.

---

### 2.3 Project Context Menu

Right-clicking on any project card opens the `BaseContextMenu` palette, exposing lifecycle operations without needing to launch the editor:

| Menu Item | Icon | Action / Description |
| :--- | :--- | :--- |
| **[Project Title]** | — | Non-clickable title header identifying the target project. |
| *Separator* | — | — |
| **Open** | `FolderOpen` | Navigates the current browser tab to `/editor/:projectId`. |
| **Open in New Tab** | `ExternalLink` | Spawns the editor for this project in a separate browser tab (`target="_blank"`), enabling multi-project comparison. |
| **Save Project** | `Save` | Packages the entire OPFS project directory into an encrypted `.lupisproject` binary package and downloads it to the operating system. |
| *Separator* | — | — |
| **Rename** | `Edit2` | Opens an interactive prompt modal to rename the project. Updates `project.json` in OPFS and refreshes the card. |
| **Edit Description** | `Type` | Opens an interactive prompt modal to update the project's description text. |
| *Separator* | — | — |
| **Delete Project** | `Trash2` *(Danger)* | Prompts for high-priority confirmation. If accepted, permanently wipes the project folder and all its contents from OPFS. |

---

### 2.4 File Drag-and-Drop & Import Subsystem

The dashboard provides a zero-click drag-and-drop system for importing `.lupisproject` archives from your computer.

#### Fullscreen Drop Overlay:
- Dragging any file over the browser window activates a full-viewport teleported backdrop (`z-50`).
- The overlay features dynamic mime/extension validation with instantaneous visual feedback:

| State | Visual Indicator | Message | Behavior |
| :--- | :--- | :--- | :--- |
| **Valid Archive (`.lupisproject`)** | Cyan border, cyan ambient glow, `FileCode2` icon | *"Drop .lupisproject File"* & *"Ready to Import"* | Accepts drop and unpacks into OPFS. |
| **Invalid Format (Any other extension)** | Red border, red ambient glow, `AlertCircle` icon | *"Unsupported File Format"* & *".lupisproject Only"* | Rejects file drop and warns user. |

#### File Ingestion Pipeline (`processImport`):
1. Validates the file extension (`.lupisproject`).
2. Reads the binary ArrayBuffer.
3. Verifies the 16-byte magic header (`LUPIS_PROJECT1!\0`).
4. Reverses byte obfuscation using bitwise XOR (`0x5A`).
5. Extracts the embedded zip package via `JSZip`.
6. Parses `project.json` to extract `id` and project metadata.
7. Recursively writes scenes, prefabs, scripts, assets, and workspace registries into `lupis-engine/projects/<id>/` inside OPFS.
8. Refreshes the project gallery with a success alert notification.

---

### 2.5 Real-Time Search & Filtering

The search bar in the global header filters projects instantly:
- Performs case-insensitive matching against project names in real time.
- Displays search result metrics (e.g., *"Showing 2 result(s) for 'platformer'"*).
- **Filter Empty State:** If no projects match the query, a dedicated card appears displaying *"No projects matching '[query]'"* with a convenient **Clear search** action link.

---

### 2.6 View States & Error Handling

The Dashboard implements four distinct UI states:

1. **Loading State:** Centered animated spinner (`border-t-cyan-500 animate-spin`) with pulsing status text displayed while OPFS directories are queried.
2. **Empty State:** Illustrated onboarding panel shown when no projects exist in storage, featuring quick-action buttons to create or import a project.
3. **Filter Empty State:** Displayed when active search query filters out all items.
4. **Error Fallback State:** Highlighted card rendered when OPFS access fails or files cannot be parsed, providing an error message and a **Try Again** retry trigger.

---

## 3. The `.lupisproject` Binary Package Specification

Lupis Engine packages standalone project backups into a single `.lupisproject` file.

### 3.1 Binary Structure

```
+-------------------------------------------------------------------------+
| Byte 0 - 15: Magic Header (16 Bytes ASCII)                              |
| "LUPIS_PROJECT1!\0" -> 4C 55 50 49 53 5F 50 52 4F 4A 45 43 54 31 21 00   |
+-------------------------------------------------------------------------+
| Byte 16 - End: Obfuscated Deflate ZIP Stream                            |
| Every byte XORed with mask 0x5A (byte ^ 0x5A)                           |
+-------------------------------------------------------------------------+
```

### 3.2 Internal Archive Layout

Once decoded and unpacked, the archive contains:

```text
├── project.json              # Main project schema (title, version, settings, tags)
├── assets/                   # Raw binary textures (.png, .webp), audio (.ogg, .wav), fonts (.ttf)
├── scenes/
│   └── <sceneId>.json        # Entities, components, layers, hierarchy data
├── prefabs/
│   └── <prefabId>.json       # Reusable prefab templates
├── scripts/
│   └── <scriptId>.json       # Visual scripting Blueprint graphs (nodes, pins, connections)
└── workspaces/
    ├── assets.json           # Asset metadata registry
    ├── scenes.json           # Scene list and folder structure
    ├── prefabs.json          # Prefab catalog registry
    ├── scripts.json          # Script catalogue registry
    └── folders.json          # Virtual folders hierarchy
```

---

## 4. How-To Guides

### 4.1 Creating a New Project
1. Open the Lupis Engine Dashboard at `/dashboard`.
2. Click the **+ New** button in the header toolbar (or **Create First Project** in the empty state).
3. In the modal dialog, enter your **Project Name** (e.g., `"Cyber Rogue"`).
4. *(Optional)* Enter a brief **Description**.
5. Press <kbd>Enter</kbd> or click **Create**.
6. The engine scaffolds the OPFS directory tree and immediately loads your new project in the visual editor.

### 4.2 Loading an Existing Project from Disk
1. Locate your saved `.lupisproject` file on your computer.
2. **Method A (Drag & Drop):** Drag the file anywhere into the Lupis Engine browser tab. The drop overlay will turn cyan. Release the mouse button.
3. **Method B (File Picker):** Click **Load Project** in the top action bar and select your `.lupisproject` file.
4. The file will be validated, decoded, and imported into OPFS. A success notification will appear, and the project card will appear in the gallery.

### 4.3 Exporting / Backing Up a Project
1. In the Dashboard project gallery, locate the project card you wish to back up.
2. Right-click the project card to reveal the context menu.
3. Select **Save Project** (`Save` icon).
4. The engine bundles the project folder into a `.lupisproject` archive and initiates an automatic browser download named `<Project_Name>.lupisproject`.

### 4.4 Opening a Project in a New Tab
1. Right-click the project card.
2. Click **Open in New Tab** (`ExternalLink` icon).
3. A separate browser tab will open directly into the editor for that project, preserving your active dashboard in the primary tab.

### 4.5 Renaming or Updating Project Information
1. Right-click the project card.
2. Choose **Rename** to change the title, or **Edit Description** to modify summary notes.
3. Enter the updated text into the prompt dialog and confirm with **Save**.
4. The change is written directly to `project.json` in storage and immediately reflected in the gallery.

### 4.6 Deleting a Project
1. Right-click the project card.
2. Select **Delete Project** (`Trash2` icon).
3. A danger confirmation dialog will appear warning that this action permanently removes the files from local storage.
4. Click **Delete** to confirm. The project directory is wiped from OPFS and the card is removed from the screen.

---

## 5. Storage Architecture & Technical Reference

### 5.1 Storage Provider: Origin Private File System (OPFS)
Lupis Engine uses the HTML5 Origin Private File System API (`navigator.storage.getDirectory()`).
- **High Performance:** Provides near-native raw disk read/write throughput without blocking the main JavaScript thread.
- **Privacy & Isolation:** Data is strictly sandboxed to the browser origin and origin storage partition.
- **Persistence:** Retains projects between sessions without relying on volatile `localStorage` or quota-restricted `IndexedDB`.

### 5.2 Key Codebase References

| Module | Source Location | Description |
| :--- | :--- | :--- |
| **Dashboard Layout** | `editor/src/features/dashboards/layouts/DashboardPage.vue` | Main view component managing grid, drag-and-drop, and project fetching. |
| **Creation Modal** | `editor/src/features/dashboards/layouts/CreateNewProjectPop.vue` | Modal dialog for naming and instantiating new game projects. |
| **Project Actions** | `editor/src/features/projects/useProjectActions.js` | Core OPFS operations: `getProjects`, `createProject`, `updateProject`, `deleteProject`. |
| **Project Menu** | `editor/src/features/projects/useProjectMenu.js` | Context menu action controller for project cards. |
| **Binary Formatter** | `editor/src/utils/projectFormat.js` | Header encoding (`encodeLupisProject`) and decoding (`decodeLupisProject`). |
| **OPFS Operations** | `editor/src/features/opfs/useOPFSActions.js` | Low-level archive packaging, ZIP deflation, and filesystem traversal. |
| **Project Schema** | `editor/src/features/projects/projectSchema.js` | Formal schema contract for `project.json`. |

---

## 6. Troubleshooting & Best Practices

> [!TIP]
> **Regularly Export Backups:** Because OPFS is tied to browser application storage, clearing browser site data or cookies for the domain can wipe local projects. Always export your projects as `.lupisproject` archives when completing major milestones.

> [!WARNING]
> **Storage Quota:** Large audio assets and high-resolution sprite sheets consume local disk quota. If an import fails with a `QuotaExceededError`, free up space on your primary operating system drive before attempting to import again.

> [!NOTE]
> **Browser Compatibility:** Lupis Engine requires modern browser versions supporting the Origin Private File System (`File System Access API` / OPFS): Chromium-based browsers (Chrome 86+, Edge 86+, Brave, Opera), Firefox 111+, and Safari 15.2+.
