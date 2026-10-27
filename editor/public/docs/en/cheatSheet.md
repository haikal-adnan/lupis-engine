---
title: "Documentation Cheat Sheet"
category: "Reference"
description: "A complete reference page to view all block components available in the **Lupis Engine** documentation system."
---

## Text & Alert Components {#komponen-dasar}

This is a **text** block. It supports **Bold** formatting as well as **Smart Links**, both [Internal](#komponen-media) and [External](https://google.com).

> [!NOTE]
> **Info** variant: Use to provide relevant additional information.

> [!TIP]
> **Tip** variant: Use to provide quick suggestions or tricks.

> [!WARNING]
> **Warning** variant: Provide a warning so users exercise greater caution.

> [!CAUTION]
> **Danger** variant: Use to prevent fatal errors or system errors.

## Features & Steps {#fitur-dan-langkah}

:::features
- **Ultra Fast**: **WebGL 2.0** based rendering.
- **Node Logic**: **Visual Scripting** system.
:::

:::steps
1. Install package via **NPM** or **Yarn**.
2. Initialize the engine on the **Canvas** element.
3. Create your first **Entity**.
:::

:::shortcuts
- `Ctrl` + `S`: Save Project
- `Space`: Play / Pause Preview
:::

## Code & API Table {#kode-dan-data}

```javascript
import { Engine } from '@lupis/core';
const game = new Engine();
game.start();
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| position | Vector2 | {x:0, y:0} | Entity position. |
| visible | Boolean | true | Render status. |
| tag | String | "Untagged" | Identification label. |

## Media Components {#komponen-media}

![Lupis Engine Logo](/assets/logo.png "Example usage of a local image block.")

:::video
url: https://vjs.zencdn.net/v/oceans.mp4
poster: https://placehold.co/800x450/1e1e2e/indigo?text=Video+Preview
caption: Example usage of an external video block.
controls: true
autoplay: false
:::
