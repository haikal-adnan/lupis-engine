---
title: "Audio Source"
category: "Components"
description: "Plays background music, sound effects, and voice clips on an entity. Supports volume channels, looping, scene persistence, fade transitions, and 2D spatial distance falloff."
---

## Overview {#overview}

The **Audio** component attaches an imported sound asset (**.ogg**, **.mp3**, or **.wav**) to an [entity](components/entities_and_prefabs). You can configure it as global background music that persists across scene changes, or as a positional 2D sound effect whose volume fades with distance from the camera.

:::features
- **Audio Channels**: Route sounds to **Background**, **Sound Effect (SFX)**, or **Voice** buses for mixer control.
- **Scene Persistence**: Use **Persist Across Scenes** so music continues smoothly when loading a new level.
- **Spatial 2D Falloff**: Attenuate sound volume automatically between **Min Distance** and **Max Distance**.
- **Built-in Preview**: Click the assigned filename in the inspector to audition the waveform in a popup player.
:::

## Add the component {#add-the-component}

:::steps
1. Select an entity in the [Scene Hierarchy](interface/scene_hierarchy) or [Scene Viewport](interface/scene_viewport).
2. In the [Property Inspector](interface/property_inspector), click **Add Component...** under **Actions** and select **Audio**.
3. In the **Assets** panel of the bottom dock, right-click an audio file and choose **Apply to Audio Component** (or click the search icon next to **Audio File** in the inspector).
:::

## Properties {#properties}

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| Active Status | Boolean | Active | Toggles **Active** or **Muted** for this audio source. |
| Audio Type | String | Sound Effect (SFX) | Assigns the mixer channel: **Background**, **Sound Effect (SFX)**, or **Voice**. |
| Audio File | String | None | The assigned audio asset **ID**. Click the filename to open the waveform preview popup, or click the folder icon to pick another file. |
| Volume | Number | 100 | Playback volume percentage from 0% to 100%. |
| Pitch (Speed) | Number | 1.0 | Playback speed and pitch multiplier from 0.1 to 3.0. |
| Play on Awake | Boolean | false | Automatically starts playing as soon as the scene loads or the entity spawns. |
| Loop | Boolean | false | Repeats the audio clip continuously. |
| Global Audio | Boolean | Destroy on Load | **Destroy on Load** stops the sound when leaving the scene; **Persist Across Scenes** keeps the sound playing across scene transitions. |
| Fade In / Out (s) | Number | 0, 0 | Smooth volume ramp-up (**In**) and ramp-down (**Out**) durations in seconds (0 to 10). |
| Spatial 2D | Boolean | Disabled (Global) | When set to **Enabled (Positional)**, volume decreases as the entity moves away from the camera. |
| Min Distance | Number | 100 | Visible when **Spatial 2D** is enabled. Distance in pixels within which the sound plays at full volume. |
| Max Distance | Number | 1000 | Visible when **Spatial 2D** is enabled. Distance in pixels beyond which the sound fades to silence. |

## Usage examples {#usage-examples}

Configure seamless background music that starts automatically and keeps playing when the player moves to a new scene.

:::steps
1. Create an **Empty Entity** in your starting scene, rename its **ID** to **BGM_Player**, and add an **Audio** component.
2. Assign your music track to **Audio File** and set **Audio Type** to **Background**.
3. Enable **Play on Awake** and **Loop**.
4. Click **Destroy on Load** next to **Global Audio** to switch it to **Persist Across Scenes**.
5. Set **Fade In / Out (s)** to **1.5** for a smooth intro fade.
:::

## Scripting {#scripting}

Use the nodes in [Audio & System](node_library/system_utilities) and [Helper & Tool](node_library/helper_tool) to trigger sounds and control mixer channels at runtime.

| Node | Description |
| --- | --- |
| [Play Audio](node_library/system_utilities#node-playAudio) | Plays the audio source on a target entity. |
| [Stop Audio](node_library/system_utilities#node-stopAudio) | Stops audio playback on a target entity. |
| [Set Volume](node_library/system_utilities#node-setAudioVolume) | Sets the volume (0 to 100) of the master bus or a specific channel (**background**, **sfx**, or **voice**). |
| [Get Volume](node_library/system_utilities#node-getAudioVolume) | Reads the current volume of an audio channel. |
| [Set Channel Mute](node_library/system_utilities#node-setAudioMute) | Mutes or unmutes an audio channel. |
| [Volume Slider Manager](node_library/helper_tool#node-volumeSliderManager) | Connects a UI slider directly to an audio channel volume. |

## Common issues {#common-issues}

| Problem | Solution |
| --- | --- |
| **Spatial 2D** button is disabled | **Spatial 2D** cannot be combined with **Persist Across Scenes**. Switch **Global Audio** back to **Destroy on Load** to enable positional 2D audio. |
| Sound does not play when the scene starts | Make sure **Play on Awake** is enabled, **Active Status** is set to **Active**, and an asset is assigned to **Audio File**. |
| Positional sound is too quiet | Increase **Min Distance** and **Max Distance** so the entity is within hearing range of the camera. |

## Related {#related}

| Page | Use it when |
| --- | --- |
| [Audio & System](node_library/system_utilities) | You want to view all audio and signal nodes in the Node Library. |
| [Interactive Widgets](behaviour/ui/interactive_widgets) | You want to build an in-game audio volume settings menu. |
| [Entities & Prefabs](components/entities_and_prefabs) | You want to save sound-emitting objects as prefabs. |
