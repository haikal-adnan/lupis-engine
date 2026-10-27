---
title: "Sprite Animator"
category: "Components"
description: "Plays frame-by-frame spritesheet animations on an entity. Use Sprite Animator to create idle, walk, jump, and attack clips in the Animator Editor."
---

## Overview {#overview}

The **Sprite Animator** component drives frame-by-frame 2D animations by updating an entity's [Image Renderer](components/renderers/sprite_renderer) over time. It opens the dedicated **Animator Editor** workspace where you organize clips into categories, slice source frames, set frame rates, and preview animations with onion skinning.

:::features
- **Clip Library**: Organize animations such as **idle**, **run**, and **attack** into named clips and folders.
- **Auto Fill Timeline**: Slice a horizontal or grid spritesheet into timeline frames automatically with **Auto Fill**.
- **Per-Clip Pivot & FPS**: Configure custom frame rate, looping, base size, and 3x3 pivot for every clip.
- **Onion Skinning**: Enable **Show Shadow (Onion Skin)** in the editor to align frames smoothly.
:::

## Add the component {#add-the-component}

:::steps
1. Select an entity that already has an [Image Renderer](components/renderers/sprite_renderer) component.
2. In the [Property Inspector](interface/property_inspector), click **Add Component...** under **Actions** and select **Sprite Animator**.
3. In the **Sprite Animator** section, click **Open Editor** next to **Clips Data** to open the **Animator Editor** tab.
:::

> [!NOTE]
> If the entity does not have an **Image Renderer**, **Sprite Animator** is disabled in **Add Component...** with the label **(Requires SpriteRenderer)**.

## Properties {#properties}

Control animation playback and active clips in the **Sprite Animator** section of the [Property Inspector](interface/property_inspector).

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| Status | Boolean | Enabled | Toggles whether **Sprite Animator** controls the entity's **Image Renderer**. Set to **Disabled** to edit the sprite manually. |
| Playback | Boolean | Playing | Toggles **Playing** or **Paused** to preview the active clip directly in the [Scene Viewport](interface/scene_viewport). |
| Current Frame | Number | 1 | Steps through individual frames when **Playback** is paused. |
| Current Clip | String | None | Selects the default animation clip (**ID**) that plays when the scene starts. |
| Clips Data (Open Editor) | Object | 0 clip(s) | Shows the total number of clips and the **Open Editor** button. |

Inside the **Animator Editor** tab, select a clip in the left **Clip** panel to configure its **Clip Properties** on the right and its frames in the bottom **Timeline**.

| Clip Property / Control | Type | Default | Description |
| --- | --- | --- | --- |
| ID | String | clip_default | Unique clip identifier used to play this clip from visual scripts. |
| Texture | String | None | Spritesheet image asset used by this clip. |
| Rendering & SDF | String | Pixelated | Sampling filter (**Pixelated** or **Smooth**) and **SDF** toggle for this clip. |
| Base Size (W, H) & Pivot | Vector2 | 32, 32 | Frame cell width and height in pixels, plus the 3x3 origin pivot for the clip. |
| Frame Rate (FPS) | Number | 12 | Playback speed in frames per second (1 to 60). |
| Loop Animation | Boolean | true | **True (Loop)** repeats the clip continuously; **False (Once)** stops on the last frame. |
| Flip Horizontal | Boolean | false | Mirrors the clip horizontally. |
| Add Frame / Auto Fill / Clear | Object | - | Bottom **Timeline** buttons to append a single frame, slice the spritesheet automatically by **Base Size**, or clear all frames. |

## Usage examples {#usage-examples}

Create a looping walk animation from a horizontal spritesheet strip using **Auto Fill**.

:::steps
1. In the **Sprite Animator** section of the [Property Inspector](interface/property_inspector), click **Open Editor**.
2. In the left **Clip** panel, right-click empty space and select **New Clip**.
3. In the right **Clip Properties** panel, set **ID** to **walk**.
4. Click the **Texture** button (or right-click your spritesheet in the **Assets** dock and choose **Apply to Selected Clip**).
5. Set **Base Size** (**W** and **H**) to the pixel size of a single frame (such as **32** by **32**).
6. In the bottom **Timeline** panel, click **Auto Fill**. The editor slices the spritesheet into frames automatically.
7. Set **Frame Rate (FPS)** to **12**, keep **Loop Animation** set to **True (Loop)**, and click the **Play** button in the timeline to preview.
:::

## Scripting {#scripting}

Use the nodes in [Animation](node_library/game_animation) and [Helper & Tool](node_library/helper_tool) to switch clips and trigger frame events at runtime.

| Node | Description |
| --- | --- |
| [Play Animation](node_library/game_animation#node-playAnimation) | Plays a clip by its **ID** and fires **onComplete** when a non-looping clip finishes. |
| [Pause Animation](node_library/game_animation#node-pauseAnimation) | Pauses the currently playing animation clip. |
| [Get Animator](node_library/game_animation#node-getAnimator) | Reads the active clip **ID**, playing state, or flip state. |
| [Set Animator](node_library/game_animation#node-setAnimator) | Updates the current clip, enabled state, or flip state. |
| [On Animation Frame](node_library/game_animation#node-onAnimationFrame) | Triggers execution when a clip enters, stays in, or exits a specific frame range (useful for footsteps or sword swings). |
| [Platformer Animator](node_library/helper_tool#node-platformerAnimator) | Automatically switches between idle, run, jump, and fall clips for a platformer character. |
| [Top-Down Animator](node_library/helper_tool#node-topDownAnimator) | Automatically switches directional idle and walk clips for a top-down character. |

## Common issues {#common-issues}

| Problem | Solution |
| --- | --- |
| **Auto Fill** generates the wrong number or size of frames | Set **Base Size** (**W** and **H**) in **Clip Properties** to match the exact pixel width and height of one frame before clicking **Auto Fill**. |
| Cannot edit **Image Renderer** properties | **Sprite Animator** locks **Image Renderer** while active. Click **Enabled** next to **Status** in **Sprite Animator** to switch it to **Disabled** while making manual adjustments. |
| Character shifts position when switching between clips | Make sure all clips on the entity use a consistent **Pivot** point in **Clip Properties** (for example, bottom-center for ground characters). |

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Image Renderer](components/renderers/sprite_renderer) | You want to configure the base sprite component required by **Sprite Animator**. |
| [Platformer Movement](behaviour/movement/platformer) | You want to connect character movement to idle, run, and jump animations. |
| [Top-Down Movement](behaviour/movement/top_down) | You want to set up 4-way or 8-way directional character animations. |
