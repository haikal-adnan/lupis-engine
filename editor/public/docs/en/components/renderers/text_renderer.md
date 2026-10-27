---
title: "Text Renderer"
category: "Visual Renderers"
description: "Renders sharp, scalable typography with alignment, line wrapping, outlines, and drop shadows. Use Text Renderer for dialogue, score counters, labels, and floating combat text."
---

## Overview {#overview}

The **Text Renderer** component draws crisp text in both **World** and **User Interface** layers. When you import a **.ttf** or **.otf** font into the **Assets** panel, the editor automatically converts it into a Multi-channel Signed Distance Field (MSDF) font so your text stays sharp at any font size or camera zoom.

:::features
- **Crisp MSDF Fonts**: Import **.ttf** or **.otf** fonts that scale cleanly without pixelation.
- **Flexible Layout**: Control horizontal and vertical alignment, line spacing, character spacing, and overflow.
- **Outline & Shadow**: Add stroke outlines and configurable drop shadows for readable HUD text.
- **Auto Line Sizing**: Automatically expands the entity's transform height to fit wrapped lines.
:::

## Add the component {#add-the-component}

:::steps
1. Select an entity in the [Scene Hierarchy](interface/scene_hierarchy) or [Scene Viewport](interface/scene_viewport).
2. In the [Property Inspector](interface/property_inspector), click **Add Component...** under **Actions** and choose **Text Renderer**.
3. Type your content into the **Text** field.
4. To use a custom font, import a **.ttf** or **.otf** file into the **Assets** panel, right-click the font asset, and click **Apply to TextRenderer**.
:::

> [!TIP]
> Right-click a layer in the **Scene Hierarchy**, hover over **Add Entity** (or **Add UI Element**), and click **Text** (or **UI Text**) to create a text entity directly.

## Properties {#properties}

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| Font | String | Default | The assigned MSDF font asset **ID**. |
| Mode | String | Static | Text rendering mode: **Static** or **Rich Text**. |
| Text | String | New Text | Multi-line text content displayed by the entity. |
| Font Size (SZ) | Number | 24 | Character size in pixels. |
| Auto Line | Boolean | true | Automatically adjusts the line count and locks the entity's transform height to fit the text. |
| Max Line (L) | Number | 1 | Maximum number of visible lines when **Auto Line** is unchecked. |
| Overflow | String | Wrap | How long text behaves at the container width: **Wrap** to a new line or truncate with **Ellipsis** (...). |
| Line Space (H) | Number | 1.2 | Vertical line height multiplier. |
| Char Space (S) | Number | 0 | Horizontal spacing offset between characters. |
| Alignment | String | left | Horizontal alignment: **Left**, **Center**, **Right**, or **Justify**. |
| Align Line | String | top | Vertical alignment inside the bounding box: **Top**, **Middle**, or **Bottom**. |
| Text Color & Opacity (OP) | String | #FFFFFF (100%) | Hex color and alpha percentage (0% to 100%) of the text characters. |
| Outline (Color & W) | Number | #000000 (0) | Stroke color and thickness (**W** from 0.00 to 1.00) around each character. |
| Drop Shadow | Boolean | false | Enables a drop shadow with **Color**, **Opacity (OP)**, **Offset (X, Y)**, and **Blur (B)** controls. |

## Usage examples {#usage-examples}

Create a centered score counter with an outline and drop shadow so it remains readable over any background.

:::steps
1. In the [Scene Hierarchy](interface/scene_hierarchy), right-click a **User Interface** layer, hover over **Add UI Element**, and click **UI Text**.
2. In the **Text Renderer** section, set **Text** to **0000** and **Font Size** to **36**.
3. Click **Center** under **Alignment** and **Middle** under **Align Line**.
4. Set **Outline** width (**W**) to **0.25** and pick a dark outline color.
5. Check **Drop Shadow** and set **Offset** to **X: 2**, **Y: -2** and **Blur** to **4**.
:::

## Scripting {#scripting}

Use the nodes in [Rendering & Camera](node_library/game_renderer), [Flow & Logic](node_library/flow_logic), and [Helper & Tool](node_library/helper_tool) to update text dynamically at runtime.

| Node | Description |
| --- | --- |
| [Get Text](node_library/game_renderer#node-getText) | Reads the current text string, font size, color, or opacity. |
| [Set Text](node_library/game_renderer#node-setText) | Updates the displayed text string, font size, color, or opacity at runtime. |
| [Format String](node_library/system_utilities#node-stringFormat) | Builds dynamic strings such as score or health labels using placeholders. |
| [Typewriter Effect](node_library/flow_logic#node-logicTypewriter) | Reveals text character by character with configurable speed and skip support. |
| [Dialogue Runner](node_library/helper_tool#node-vnDialogueRunner) | Runs full dialogue sequences with speaker names, portraits, and typewriter text. |

## Common issues {#common-issues}

| Problem | Solution |
| --- | --- |
| Cannot edit height (**H**) in **Transform** | **Auto Line** is checked in **Text Renderer**, which sizes the height automatically. Uncheck **Auto Line** if you want to set a fixed box height and **Max Line** limit. |
| Vertical alignment (**Align Line**) has no visible effect | When **Auto Line** is enabled, the bounding box hugs the text height tightly. Uncheck **Auto Line** and increase the transform height (**H**) to align text vertically inside a larger box. |

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Visual Renderers](components/renderers) | You want to compare all four renderer components. |
| [Transform & UI Transform](components/transform) | You want to anchor text labels to the screen edges. |
| [Dynamic UI & Data Binding](behaviour/ui/dynamic_ui) | You want to bind text labels to score, health, or inventory variables. |
