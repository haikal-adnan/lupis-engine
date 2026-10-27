---
title: "User Interface (UI)"
category: "Perilaku"
description: "Bangun menu interaktif, slider audio, kotak dialog, dan tampilan HUD berbasis data."
---

## Gambaran umum {#overview}

Perilaku user interface (UI) mengubah layer screen-space, sprite, dan entity teks menjadi menu interaktif, heads-up display (HUD), kotak dialog, serta grid berbasis data.

:::features
- **Kontrol Interaktif**: Membangun tombol beranimasi, slider audio yang bisa di-drag, toggle switch, dan pilihan dialog visual novel bercabang.
- **HUD dan Grid Berbasis Data**: Mengikat variabel langsung ke label teks, menganimasikan health bar dan progres, serta mengisi grid inventaris dari template prefab.
:::

## Pilih halaman {#choose-a-page}

| Halaman | Gunakan saat |
| --- | --- |
| [Widget Interaktif](behaviour/ui/interactive_widgets) | Kamu ingin membuat tombol yang bisa diklik, slider volume, toggle switch, dan pilihan dialog interaktif. |
| [UI Dinamis & Data Binding](behaviour/ui/dynamic_ui) | Kamu ingin mengikat variabel game ke teks HUD, menganimasikan fill bar, dan men-spawn grid inventaris dengan data binding. |

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Text Renderer](components/renderers/text_renderer) | Kamu ingin mengatur jenis font, ukuran, perataan, dan variable binding pada label UI. |
| [Scene Hierarchy](interface/scene_hierarchy) | Kamu ingin membuat layer UI screen-space agar elemen HUD tetap menempel pada pandangan kamera. |
| [Helper & Tool](node_library/helper_tool) | Kamu ingin menjelajahi seluruh node blueprint untuk widget UI, slider, dialog, dan grid spawning. |
