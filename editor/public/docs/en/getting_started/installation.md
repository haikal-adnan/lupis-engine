---
title: "Installation & Setup"
category: "Getting Started"
description: "Run Lupis Engine directly in your web browser, download the standalone desktop executable from GitHub, launch with Docker, or host the local servers yourself."
---

## Overview {#overview}

You can use **Lupis Engine** in four ways depending on your workflow. Choose the browser version for instant access, the desktop executable for offline creation, or Docker and local servers when you need standalone desktop **.EXE** packaging.

:::features
- **Web Studio**: Open the editor directly in a WebGL 2.0 browser with zero installation.
- **Desktop Executable**: Download the prebuilt release from GitHub for offline desktop game development.
- **Docker Compose**: Start the editor, runtime, and backend export service together with one command.
- **Self-Hosted Server**: Run the Node.js editor and backend services directly on your machine.
:::

| Method | Best for | Requirements |
| --- | --- | --- |
| [Launch in the browser](#launch-in-the-browser) | Quick prototyping and learning without installing software. | Chrome, Edge, or Firefox with WebGL 2.0 enabled. |
| [Download the executable](#download-the-desktop-executable) | Offline desktop workflow with no command-line setup. | Windows 10/11 (64-bit) release package from GitHub. |
| [Run with Docker](#run-with-docker) | Full local environment including standalone desktop **.EXE** packaging. | Docker Desktop and Git. |
| [Run your own server](#run-your-own-server) | Local hosting and custom server configuration without Docker. | Node.js 20.19+ or 22.12+ and npm 10+. |

## Launch in the browser {#launch-in-the-browser}

The fastest way to start is through the hosted [Lupis Engine Web Studio](https://haikal-adnan.github.io/lupis-engine-link?go=web). Your projects and assets are stored locally inside your browser using the Origin Private File System (OPFS).

:::steps
1. Open the **Lupis Engine Web Studio** link above in a modern browser such as Google Chrome, Microsoft Edge, or Mozilla Firefox.
2. On the **My Projects** dashboard, click **New** to create a fresh project or drag and drop an existing **.lupisproject** file onto the page.
3. Click your project card to launch the [Editor Overview](interface/editor_overview) workspace and start building.
:::

> [!NOTE]
> Browser storage is tied to your current browser profile. Export a **.lupisproject** archive regularly (see [Project & Export](getting_started/project_and_export)) to back up your work or move it to another device.

## Download the desktop executable {#download-the-desktop-executable}

If you prefer a dedicated desktop application that works offline, download the official prebuilt executable from [Lupis Engine GitHub Releases](https://github.com/haikal-adnan/lupis-engine/releases).

:::steps
1. Open the **GitHub Releases** page linked above in your browser.
2. Under the latest release **Assets** section, download the desktop executable or archive for your operating system.
3. Extract the archive (if zipped) to a folder on your computer and launch the **Lupis Engine** executable.
4. When the **My Projects** dashboard appears, click **New** to create your first offline project.
:::

## Run with Docker {#run-with-docker}

Running with [Docker](https://www.docker.com/) launches the visual editor, the standalone core runtime, and the backend packaging service in one step. Clone the [Lupis Engine GitHub Repository](https://github.com/haikal-adnan/lupis-engine) and run the following commands in your terminal:

```bash
git clone https://github.com/haikal-adnan/lupis-engine.git
cd lupis-engine
docker compose -f start.yml up
```

Once the containers finish starting, open the editor in your browser using the ports below:

| Service | Local URL | Purpose |
| --- | --- | --- |
| **Visual Editor** | http://localhost:37600 | Main dashboard, scene editor, and visual scripting studio. |
| **Core Runtime** | http://localhost:37601 | Standalone WebGL game runtime server. |
| **Backend Service** | http://localhost:37602 | Compiles and packages Windows **.EXE** desktop builds. |

## Run your own server {#run-your-own-server}

You can also run the services directly on your computer using [Node.js](https://nodejs.org/) (version **20.19+** or **22.12+**) without Docker.

:::steps
1. Clone the [Lupis Engine GitHub Repository](https://github.com/haikal-adnan/lupis-engine) to your computer.
2. Open a terminal in the **service** folder, install dependencies, and start the backend server on port **37602**.
3. Open a second terminal in the **editor** folder, install dependencies, and start the visual editor on port **37600**.
4. Optionally, open a third terminal in the **core** folder and serve the standalone runtime on port **37601**.
5. Navigate to **http://localhost:37600** in your browser to open the studio.
:::

```bash
# Terminal 1: Backend service (http://localhost:37602)
cd service && npm install && npm run dev

# Terminal 2: Visual editor (http://localhost:37600)
cd editor && npm install && npm run dev

# Terminal 3: Standalone core runtime (optional, http://localhost:37601)
cd core && npx serve -l 37601 .
```

> [!TIP]
> Keep the backend **service** terminal running on port **37602** whenever you build a Windows **.EXE** desktop package.

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Quick Start](getting_started/quick_start) | You have Lupis Engine running and want to build your first playable scene. |
| [Project & Export](getting_started/project_and_export) | You want to configure project settings, auto-save, or export builds. |
| [Editor Overview](interface/editor_overview) | You want to learn the layout of the workspace panels and toolbars. |
| [Introduction](getting_started/introduction) | You want an overview of scenes, entities, components, and visual scripting. |
