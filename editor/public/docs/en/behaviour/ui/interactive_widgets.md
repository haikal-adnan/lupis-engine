---
title: "Interactive Widgets"
category: "User Interface"
description: "Create clickable buttons, draggable sliders, toggle switches, and branching dialogue choices."
---

## Overview {#overview}

Interactive widgets let players click buttons, drag sliders, flip toggle switches, and select dialogue choices using mouse or touch input.

:::features
- **Responsive Buttons**: Scale buttons smoothly on hover and press while firing click events for scene navigation or menu actions.
- **Sliders & Toggle Switches**: Drag slider handles to adjust audio channels or flip animated toggle switches for settings menus.
- **Dialogue & Choice Menus**: Stream typewriter dialogue with character portraits and present interactive branching choice buttons.
:::

## Requirements {#requirements}

Prepare a screen-space UI layer and attach visual and interaction components to your widget entities.

| Requirement | Target entity | Purpose |
| --- | --- | --- |
| [Scene Hierarchy](interface/scene_hierarchy) | UI Layer | Places widget entities inside the **User Interface** section so they automatically use screen-space [UI Transform](components/transform). |
| [Sprite Renderer](components/renderers/sprite_renderer) or [Shape Renderer](components/renderers/shape_renderer) | Buttons, Tracks & Knobs | Renders the visual bounds used for mouse raycast hit-testing and visual state changes. |
| [Text Renderer](components/renderers/text_renderer) | Labels & Dialogue Box | Displays button captions, slider percentages, and typewriter dialogue strings. |
| [Script Controller](components/script_controller) | UI Manager or Widget | Runs [Button Scale Effect](node_library/game_animation#node-uiButtonScaleEffect), [Atomic Slider](node_library/helper_tool#node-atomicSlider), or [Switch Button Shape](node_library/helper_tool#node-switchButtonShape). |

## Setup {#setup}

Follow these steps to build an animated menu button, a draggable slider, and a toggle switch on a UI layer.

:::steps
1. In the [Scene Hierarchy](interface/scene_hierarchy), select or create a layer under the **User Interface** section (dedicated screen-space) so all widgets stay fixed to the camera view and use [UI Transform](components/transform) anchors.
2. Create a button entity inside that **UI** layer (right-click the layer > **Add UI Element** > **UI Shape** or **UI Image**), and attach a child [Text Renderer](components/renderers/text_renderer) label.
3. Open the UI [Logic Graph](visual_scripting/graph_concepts), add [On Tick](node_library/game_lifecycle#node-eventTick), and connect it to [Button Scale Effect](node_library/game_animation#node-uiButtonScaleEffect) targeting the button entity.
4. Connect the **On Click** output of **Button Scale Effect** to [Change Scene](node_library/game_lifecycle#node-changeScene) or your menu action logic.
5. To add a value slider, create a horizontal bar entity and a knob child entity, then wire **On Tick** into [Atomic Slider](node_library/helper_tool#node-atomicSlider) with **Bar Entity** and **Handler Entity** assigned.
6. To add a settings toggle, create a track shape and a knob shape, then wire [Switch Button Shape](node_library/helper_tool#node-switchButtonShape) to animate the knob position and track color when clicked.
:::

## Settings {#settings}

Adjust these parameters on [Button Scale Effect](node_library/game_animation#node-uiButtonScaleEffect), [Atomic Slider](node_library/helper_tool#node-atomicSlider), and [Switch Button Shape](node_library/helper_tool#node-switchButtonShape) to refine widget responsiveness.

| Setting | Recommended value | Effect |
| --- | --- | --- |
| **Scale Normal / Hover / Pressed** | 1.0 / 1.1 / 0.9 | Target scale multipliers applied to the button when idle, hovered by the cursor, or held down. |
| **Lerp Speed** | 0.2 | Smoothing factor for button scale transitions each frame; higher values snap faster. |
| **Use Raycast** | true | Ensures only the topmost visible UI entity under the cursor receives the hover or click event. |
| **Min / Max / Step** | 0 / 100 / 1 | Defines the numeric range and rounding increment output by **Atomic Slider** as the user drags the handle. |
| **Slide Distance** | 40 | Horizontal distance in pixels that the toggle knob travels from the center of the track when switched on or off. |
| **Duration** | 0.15 | Transition time in seconds for the toggle switch knob slide and color interpolation. |

## Variations {#variations}

Combine interaction nodes to build multi-channel audio mixers, custom sprite switches, and visual novel dialogue systems.

| Variation | Configuration |
| --- | --- |
| **Multi-Channel Audio Mixer** | Use [Volume Slider Manager](node_library/helper_tool#node-volumeSliderManager) and pass a map of **master**, **vocal**, **sfx**, and **background** bar, handler, and text indicator entities to control all audio buses in one node. |
| **Sprite-Based Toggle Switch** | Replace shape colors with custom textures using [Switch Button Image](node_library/helper_tool#node-switchButtonImage) to swap track and knob sprites between on and off states. |
| **Visual Novel Dialogue & Choices** | Wire [Dialogue Runner](node_library/helper_tool#node-vnDialogueRunner) to stream JSON dialogue lines with character portraits, then trigger [Choice Presenter](node_library/helper_tool#node-vnChoicePresenter) to display branching buttons. |
| **Modal Popup Input Locking** | Call [Freeze Layer Input](node_library/input_controls#node-freezeLayerInput) when opening a pause or confirmation popup so clicks do not pass through to underlying gameplay or menu layers. |

## Common issues {#common-issues}

| Problem | Solution |
| --- | --- |
| Clicking a UI button also triggers an entity or button behind it | Enable **Use Raycast** on [Button Scale Effect](node_library/game_animation#node-uiButtonScaleEffect) or [Entity Mouse Event](node_library/input_controls#node-mouseEntityInteract), or lock lower layers with [Freeze Layer Input](node_library/input_controls#node-freezeLayerInput). |
| Buttons and sliders drift off screen when the camera moves | Ensure widget entities are placed inside a layer under the **User Interface** section (rather than the **World** section), and configure **Anchor** points on their [UI Transform](components/transform) to lock their position relative to the viewport. |
| [Atomic Slider](node_library/helper_tool#node-atomicSlider) knob moves beyond the bar edges | Ensure the **Bar Entity** has a [Sprite Renderer](components/renderers/sprite_renderer) or [Shape Renderer](components/renderers/shape_renderer) with an explicit **Width** greater than zero so the slider can calculate drag bounds. |
| Hover and click detection feels offset from the visible button graphic | Check that the button entity's pivot is centered (**0.5, 0.5**) or add a [Multi Collider](components/multi_collider) and enable **Use Collider Bounds** on **Entity Mouse Event**. |

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Dynamic UI & Data Binding](behaviour/ui/dynamic_ui) | Bind slider values and gameplay state to text labels, progress bars, and item grids. |
| [Input & Controls Nodes](node_library/input_controls) | Inspect raw mouse hover, press, hold, and layer input freezing nodes. |
| [Helper Tool Nodes](node_library/helper_tool) | View full port references for sliders, toggle switches, and visual novel dialogue nodes. |
