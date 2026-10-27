---
title: "Project & Export"
category: "Getting Started"
description: "Manage projects on the Dashboard, configure Project Settings and auto-save, and export your game in Development or Release mode to Web (.ZIP), Windows (.EXE), or .lupisproject archives."
---

## Overview {#overview}

Lupis Engine stores your active projects in fast local storage and lets you package them into portable project archives, standalone HTML5 web builds, or Windows desktop executables.

:::features
- **Project Archives**: Save or load single-file **.lupisproject** bundles to back up or share your work.
- **Auto-Save & Snapshots**: Sync changes automatically on a timer and capture viewport cover thumbnails.
- **Web Standalone (.ZIP)**: Bundle your game into an HTML5 package directly in your browser in **Development** (unminified debug) or **Release** (obfuscated/encrypted) mode.
- **Desktop App (.EXE)**: Compile your project into a standalone Windows executable for offline play in **Development** or **Release** mode.
:::

## Manage projects {#manage-projects}

You create, import, rename, and back up projects from the **My Projects** dashboard.

:::steps
1. To import an existing project backup, drag and drop a **.lupisproject** file anywhere onto the **My Projects** dashboard, or click **Load Project** and select the file.
2. Right-click any project card on the dashboard to open its context menu.
3. Choose **Open** or **Open in New Tab** to launch the project in the [Editor Overview](interface/editor_overview) workspace.
4. Choose **Save Project** to download a compressed **.lupisproject** backup file to your computer.
5. Choose **Rename** or **Edit Description** to update the project's title and summary, or choose **Delete Project** to remove it from storage.
:::

> [!CAUTION]
> Clicking **Delete Project** permanently removes the project folder from storage and cannot be undone. Always export a **.lupisproject** archive first if you may need the project later.

## Project settings and saving {#project-settings-and-saving}

Inside the editor, open **Project Settings** to configure your game's metadata, startup scene, canvas resolution, physics defaults, and storage synchronization.

| Settings tab | Key options | Purpose |
| --- | --- | --- |
| **Project Info** | **Project Name**, **Version**, **Game Thumbnail**, **Enable Auto Save**, **Revert Changes** | Manages project identity, cover images (**Upload Thumbnail** or **Capture Scene Now**), and storage sync. |
| **Preferences** | Editor appearance and workspace preferences | Customizes theme and visual workspace behavior. |
| **Engine & Canvas** | **Initial Scene**, **Simulation Tick Rate**, **Global Background**, **Target Resolution** | Sets the startup scene, frame rate (default **60 FPS**), UI layer bounds, and resolution presets. |
| **Physics & Bounds** | Global gravity, drag coefficients, and world boundary limits | Configures default simulation forces applied to [Physics Body](components/physics_body) entities. |
| **Grid & Camera** | Grid snapping guidelines and default camera perspective | Controls alignment guides in the [Scene Viewport](interface/scene_viewport). |
| **Resources** | Global asset management, compression, and audio volume | Configures resource caching, texture packing, and master volume defaults. |
| **Debugging** | Collider wireframes and runtime performance overlays | Displays visual diagnostics while testing your game. |
| **Publish & Export** | **Development (.ZIP)**, **Release (.ZIP)**, **Development (.EXE)**, **Release (.EXE)**, **Export (.lupisproject)** | Packages your project into distributable builds or backup archives. |
| **About** | Engine version, repository link, and community | Shows engine build version, documentation, and external links. |

> [!TIP]
> In **Project Info**, turn on **Enable Auto Save** and set **Auto Save Interval** (in minutes) so the editor writes unsaved modifications to storage automatically. You can also click **Revert Changes** before saving to reload the last saved state.

## Export your game {#export-your-game}

The **Publish & Export** tab (**Build & Publish Module**) in **Project Settings** provides three export formats.

| Export option | Button | What it produces |
| --- | --- | --- |
| **Web Standalone (.ZIP)** | **Development (.ZIP)** / **Release (.ZIP)** | Browser-based HTML5 package. **Development** keeps source maps and readable data for debugging; **Release** obfuscates scripts and encrypts game data for distribution. |
| **Desktop App (.EXE)** | **Development (.EXE)** / **Release (.EXE)** | Standalone Windows executable. **Development** enables DevTools and unminified code; **Release** builds an optimized, protected production desktop application. |
| **Lupis Project Archive** | **Export (.lupisproject)** | A single compressed **.lupisproject** file containing all scenes, node graphs, and assets for backup or re-importing. |

:::steps
1. Press **Ctrl + S** (or click **Save Project** in **Project Settings**) so all recent scene and script edits are committed.
2. Open **Project Settings**, select **Engine & Canvas**, and confirm that **Initial Scene** and **Target Resolution** are set to your desired startup level and screen size.
3. Select the **Publish & Export** tab on the left sidebar of **Project Settings**.
4. To export a web build, click **Development (.ZIP)** for testing or **Release (.ZIP)** for production hosting. The browser packages and downloads the **.zip** archive completely client-side.
5. To build a Windows executable, make sure the backend service is running on port **37602**, then click **Development (.EXE)** or **Release (.EXE)** and wait for compilation to complete.
:::

> [!WARNING]
> Compiling a **Desktop App (.EXE)** requires the backend service running on port **37602** (see [Installation & Setup](getting_started/installation#run-with-docker)). Web (.ZIP) exports run 100% client-side in the browser and do not need the backend service.

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Installation & Setup](getting_started/installation) | You need to start the Docker or Node.js backend service for **.EXE** desktop builds. |
| [Quick Start](getting_started/quick_start) | You want to create and test a new project from the Dashboard. |
| [Editor Overview](interface/editor_overview) | You want to explore the top bar controls, save indicator, and workspace docks. |
| [Entities & Prefabs](components/entities_and_prefabs) | You want to package reusable entity templates inside your project. |
