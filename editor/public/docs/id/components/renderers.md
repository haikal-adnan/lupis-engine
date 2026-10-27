---
title: "Visual Renderer"
category: "Komponen"
description: "Komponen visual renderer menggambar sprite, bentuk vektor, teks, dan tilemap di dalam scene. Setiap entity hanya bisa memasang satu visual renderer pada satu waktu."
---

## Gambaran umum {#overview}

Visual renderer menentukan bagaimana sebuah [entity](components/entities_and_prefabs) ditampilkan di layar. Kamu bisa memasang satu renderer per entity melalui **Add Component...** di [Property Inspector](interface/property_inspector), lalu menggabungkannya dengan komponen simulasi atau logika seperti [Sprite Animator](components/sprite_animator), [Physics Body](components/physics_body), atau [Multi-Collider](components/multi_collider).

> [!NOTE]
> Sebuah entity hanya bisa memiliki satu visual renderer pada satu waktu. Setelah kamu memasang satu renderer, tiga renderer lainnya menampilkan keterangan **(Conflict)** di menu **Add Component...**.

## Pilih halaman {#choose-a-page}

| Halaman | Gunakan saat |
| --- | --- |
| [Image Renderer](components/renderers/sprite_renderer) | Kamu ingin menampilkan tekstur 2D, sprite, ikon user interface (UI), atau potongan area dari sebuah spritesheet. |
| [Shape Renderer](components/renderers/shape_renderer) | Kamu ingin menggambar poligon vektor khusus, lingkaran, atau segmen garis dengan fisika bentuk opsional. |
| [Text Renderer](components/renderers/text_renderer) | Kamu ingin menampilkan teks tajam yang dapat diubah ukurannya lengkap dengan perataan, outline, dan bayangan. |
| [Tilemap](components/renderers/tilemap) | Kamu ingin melukis level 2D berbasis grid dan medan padat di dalam layer **World**. |

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Sprite Animator](components/sprite_animator) | Kamu ingin menganimasikan **Image Renderer** dengan klip frame demi frame. |
| [Transform & UI Transform](components/transform) | Kamu ingin mengatur posisi, ukuran, rotasi, atau membalik entity yang dirender. |
| [Rendering & Camera](node_library/game_renderer) | Kamu ingin mengubah nilai properti renderer atau target kamera dari visual script. |
