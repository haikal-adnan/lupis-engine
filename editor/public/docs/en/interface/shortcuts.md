---
title: "Shortcuts Reference"
category: "Interface"
description: "Complete keyboard and mouse shortcuts for the Lupis Engine editor. Use this reference to speed up navigation, scene editing, tile painting, shape drawing, and visual scripting."
---

## Overview {#overview}

Keyboard and mouse shortcuts let you navigate canvases, switch tools, and edit items across the [Editor Overview](interface/editor_overview). Shortcuts are grouped below by the panel or workspace tab where they are active.

> [!NOTE]
> Single-key tool shortcuts (such as **V**, **B**, or **E**) are disabled while you are typing inside a text input or number field.

## Global shortcuts {#global-shortcuts}

These shortcuts work across the entire editor.

:::shortcuts
- `Ctrl` + `S`: Save the project
- `Ctrl` + `Z`: Undo the last action
- `Ctrl` + `Y`: Redo the last undone action
- `Ctrl` + `Shift` + `Z`: Redo (alternative)
- `Ctrl` + `F2`: Toggle the debug mini console during preview
- `Esc`: Clear selection in the [Property Inspector](interface/property_inspector) or close an open modal
:::

## Scene Viewport {#scene-viewport}

Use these shortcuts to control the camera and transform entities in the [Scene Viewport](interface/scene_viewport) and UI editor.

:::shortcuts
- `Space` + `Left Click`: Pan the viewport camera (hold **Space** and drag)
- `Scroll`: Zoom in or out toward the pointer
- `Ctrl` + `Scroll`: Fast zoom at 2x speed
- `Shift` + `Scroll`: Scroll the camera vertically
- `Alt` + `Scroll`: Scroll the camera horizontally
- `Left Click`: Select root entity (or drag on empty space to box-select)
- `Ctrl` + `Left Click`: Select a nested child entity directly
- `Shift` + `Left Click`: Add or remove an entity from the selection
- `Shift`: Lock aspect ratio while dragging a resize handle
- `Ctrl`: Invert grid and smart-guide snapping while dragging
- `Right Click`: Open the entity or canvas context menu
:::

## Hierarchy & bottom dock {#hierarchy-and-dock}

Use these shortcuts in the [Scene Hierarchy](interface/scene_hierarchy), the clip list in the [Sprite Animator](components/sprite_animator), and the **Assets**, **Prefabs**, and **Scripts** panels in the bottom dock.

:::shortcuts
- `Ctrl` + `C`: Copy the selected entity, layer, clip, or dock item
- `Ctrl` + `X`: Cut the selected item
- `Ctrl` + `V`: Paste the clipboard item into the active layer or folder
- `Ctrl` + `D`: Duplicate the selected entity, layer, or animation clip
- `F2`: Rename the selected entity, layer, or dock item
- `Delete`: Delete the selected item
- `F5`: Refresh the active bottom dock panel
:::

## Tilemap Editor {#tilemap-editor}

These shortcuts are active when editing a [Tilemap](components/renderers/tilemap) in the **Tilemap Editor** tab.

:::shortcuts
- `V`: Select tool (box-select and move tiles)
- `B`: Brush tool (paint tiles)
- `E`: Eraser tool (erase tiles)
- `G`: Bucket tool (flood fill contiguous area)
- `I`: Eyedropper tool (pick tile under pointer)
- `Space`: Hold to pan the tilemap canvas
- `Ctrl` + `Left Click`: Drag to box-select tiles without switching from the brush
- `Delete`: Clear all tiles inside the active selection
:::

## Shape Editor {#shape-editor}

These shortcuts are active when drawing or editing geometry for a [Shape Renderer](components/renderers/shape_renderer) in the **Shape Editor** tab.

:::shortcuts
- `V`: Select and move vertices
- `E`: Delete a clicked vertex
- `P`: Point tool
- `S`: Segment tool (connected polyline)
- `L`: Line tool (single two-point line)
- `G`: Polygon tool (closed shape)
- `C`: Circle tool
- `Space`: Hold to pan the shape canvas
- `Enter`: Commit the active segment or polygon draft
- `Esc`: Cancel the active shape draft
:::

## Visual scripting & code {#visual-scripting-and-code}

Use these shortcuts in the [visual scripting](visual_scripting/graph_concepts) graph canvas and the [Custom Node & Code Panel](visual_scripting/custom_node_and_code).

:::shortcuts
- `Left Click`: Drag on empty graph space to pan the canvas
- `Scroll`: Zoom the graph in or out at the pointer
- `Shift` + `Scroll`: Scroll the graph vertically
- `Alt` + `Scroll`: Scroll the graph horizontally
- `Ctrl` + `Left Click`: Drag to box-select multiple nodes (or click to toggle a node)
- `Ctrl` + `Shift` + `Left Click`: Drag to add nodes to the current selection
- `Right Click`: Open the node search menu on empty canvas, or node options on a node
- `Ctrl` + `D`: Duplicate the selected node
- `Delete`: Delete the selected nodes or wire
- `Ctrl` + `S`: Save and compile JavaScript in the Code Panel
:::

## Modals & popups {#modals-and-popups}

Use these shortcuts inside the sprite crop modal for [Image Renderer](components/renderers/sprite_renderer) and in media preview popups.

| Modal / Popup | Shortcut | Action |
| --- | --- | --- |
| Sprite Crop Modal | **Space** + drag | Pans the texture viewport. |
| Sprite Crop Modal | **Arrow Keys** | Nudges the crop box by 1 pixel (hold **Shift** for 10 pixels). |
| Sprite Crop Modal | **Enter** / **Esc** | Saves the crop (**Enter**) or cancels and closes the modal (**Esc**). |
| Audio Preview Popup | **Space** / **Esc** | Toggles audio playback (**Space**) or closes the popup (**Esc**). |
| Settings & Image Popups | **Esc** | Closes the active dialog window. |

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Editor Overview](interface/editor_overview) | You want an overview of the editor panels and top bar. |
| [Scene Viewport](interface/scene_viewport) | You want to learn how to use the transform gizmo and grid tools. |
| [Scene Hierarchy](interface/scene_hierarchy) | You want to manage scenes, layers, and parent-child entity trees. |
| [Property Inspector](interface/property_inspector) | You want to inspect and edit entity components. |
