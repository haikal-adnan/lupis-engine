---
title: "Property Inspector"
category: "Interface"
description: "Displays the settings, tags, transforms, and components of your active selection. Use the Property Inspector to configure scenes, layers, entities, and prefab overrides."
---

## Overview {#overview}

The **Property Inspector** sits on the right side of the editor and adapts automatically to what you select in the [Scene Hierarchy](interface/scene_hierarchy) or [Scene Viewport](interface/scene_viewport). Every change you make updates the canvas in real time.

:::features
- **Context-Aware**: Switches between scene settings, layer settings, and entity components automatically.
- **Modular Components**: Attach renderers, physics, colliders, audio, and scripts via **Add Component...**.
- **Multi-Tag System**: Assign multiple tags to an entity and rename tags across all scenes at once.
- **Prefab Syncing**: Track **Sync** and **Override** badges on [prefab](components/entities_and_prefabs) instances and update the master prefab.
:::

## Layout {#layout}

The **Property Inspector** switches between four views depending on your active selection.

| Selection State | Displayed Sections |
| --- | --- |
| Nothing selected | Shows **Quick Actions** (toggles for **Show UI Bound**, **Show World Bounds**, and collider wireframe bounds) and **Scene Properties** (**Background Color**). |
| Layer selected | Shows the **Layer** section with **ID**, **Z-Index**, **Appearance** (active, visibility, lock), and **Opacity**. |
| Single entity selected | Shows **Object**, [Transform & UI Transform](components/transform), all attached component sections, and **Add Component...** under **Actions**. |
| Multiple entities selected | Displays the **Multiple objects selected** message. |

When you select an entity, its core identity and spatial sections appear at the top, followed by any attached components.

| Section / Control | Description |
| --- | --- |
| Object | Configures the unique entity **ID**, linked **Prefab** badge, multi-tag **Tag** selector, **Z-Index**, and **Appearance** (**Active**, visibility eye icon, and lock icon). |
| Transform / UI Transform | Controls **Position**, **Rotation**, **Pivot**, **Size (px)**, **Scale**, **Flip**, and (for user interface elements) the 3x3 **Anchor** grid. |
| Sync / Override Badge | Appears on [prefab](components/entities_and_prefabs) instances. **Sync** (green) means the section matches the master prefab; **Override** (amber) means a property was modified in the scene. |
| Section Menu (3-dots) | Click the 3-dots icon on any section header to **Reset Values**, **Remove Component**, **Sync Component**, or **Apply to Master**. |
| Add Component... | Dropdown under **Actions** that attaches [Visual Renderers](components/renderers), [Sprite Animator](components/sprite_animator), [Physics Body](components/physics_body), [Multi-Collider](components/multi_collider), [Audio Source](components/audio_source), or [Script Controller](components/script_controller). |

> [!NOTE]
> An entity can have only one visual renderer at a time (**Image Renderer**, **Shape Renderer**, **Text Renderer**, or **Tilemap**). Once one is attached, the other three show **(Conflict)** in **Add Component...**.

## Common tasks {#common-tasks}

Add components at the bottom of the inspector to give an entity visuals, physics, audio, or scripts.

:::steps
1. Select an entity in the [Scene Hierarchy](interface/scene_hierarchy) or [Scene Viewport](interface/scene_viewport).
2. Scroll to the bottom of the **Property Inspector** and click **Add Component...** under **Actions**.
3. Choose a component such as **Physics Body** or **Collider**. The component section appears in the inspector.
4. To remove a component, click the 3-dots icon on that component's header and click **Remove Component**.
:::

Assign one or more tags in the **Object** section so your visual scripts can identify or group entities.

:::steps
1. Select an entity and locate the **Object** section at the top of the **Property Inspector**.
2. Click the **Tag** dropdown (**Select tag...**) and choose **Create New Tag...**.
3. Enter a tag name (such as **Player** or **Enemy**) and confirm. The tag appears in the assigned list above the dropdown.
4. Hover over an assigned tag and click the trash icon to remove it from the entity.
:::

When you edit a property on a [prefab](components/entities_and_prefabs) instance (other than its X and Y position), the section badge changes from **Sync** to **Override**.

:::steps
1. Select the modified prefab instance in the scene.
2. In the **Object** section header, click the 3-dots icon.
3. Click **Apply to Master** to push your local changes to the master prefab and update all synced instances.
4. Alternatively, click **Revert to Sync** to restore the master prefab values while keeping the entity's current position.
:::

> [!WARNING]
> You cannot add or remove components on a linked prefab instance in the scene. Edit the master prefab from the **Prefabs** dock, or open the **Object** 3-dots menu and click **Unpack Prefab** first.

## Shortcuts {#shortcuts}

Use this shortcut to clear your active entity or layer selection and return to **Quick Actions** and **Scene Properties**. For all editor shortcuts, see [Shortcuts Reference](interface/shortcuts).

:::shortcuts
- `Esc`: Clear the active selection and show scene settings
:::

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Entities & Prefabs](components/entities_and_prefabs) | You want to learn how entities, master prefabs, and overrides work. |
| [Transform & UI Transform](components/transform) | You want to configure position, pivot, size, scale, and UI anchors. |
| [Visual Renderers](components/renderers) | You want to render sprites, shapes, text, or tilemaps on an entity. |
| [Multi-Collider](components/multi_collider) | You want to attach multiple solid, trigger, hitbox, or hurtbox shapes to one entity. |
| [Script Controller](components/script_controller) | You want to attach visual scripts and override local variables per entity. |
