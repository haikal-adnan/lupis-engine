---
title: "Pengenalan"
category: "Memulai"
description: "Lupis Engine adalah game engine 2D open source dengan visual editor untuk membuat game platformer, RPG top-down, dan visual novel."
---

## Gambaran umum {#overview}

**Lupis Engine** menggabungkan editor scene visual, sistem komponen modular (ECS), dan visual scripting berbasis node dalam satu workspace. Kamu bisa merancang level, menyusun logika game tanpa menulis kode, dan menguji game dengan satu klik.

## Konsep utama {#key-concepts}

Setiap game di Lupis Engine dibangun dari empat elemen dasar yang bekerja bersama secara langsung.

:::features
- **Scene dan Layer**: Mengelompokkan level ke dalam layer dunia yang mengikuti kamera dan layer user interface (UI) yang tetap di layar.
- **Entity dan Komponen**: Membangun karakter, prop, dan tilemap dengan memasang komponen visual, fisika, dan audio yang modular.
- **Visual Scripting**: Membuat mekanika game dengan menghubungkan node event, action, dan helper pada graph interaktif.
- **Preview dan Ekspor Instan**: Menguji perubahan secara langsung di viewport dan mengemas game yang sudah selesai untuk web atau desktop.
:::

| Konsep | Tempat mengeditnya | Fungsinya |
| --- | --- | --- |
| **Scene & Layer** | [Scene Hierarchy](interface/scene_hierarchy) | Mengelompokkan entity ke dalam bidang render berurutan untuk dunia game dan lapisan heads-up display (HUD). |
| **Entity & Prefab** | [Entity & Prefab](components/entities_and_prefabs) | Mewakili setiap elemen di dalam game; **prefab** menyimpan entity yang sudah dikonfigurasi sebagai template yang dapat dipakai ulang. |
| **Component** | [Property Inspector](interface/property_inspector) | Menambahkan kemampuan tertentu pada entity, seperti [Visual Renderer](components/renderers), [Physics Body](components/physics_body), atau [Multi-Collider](components/multi_collider). |
| **Blueprint Graph** | [Konsep Graph & Node](visual_scripting/graph_concepts) | Menentukan bagaimana entity bereaksi terhadap input, collision, timer, dan status game menggunakan node yang saling terhubung. |

## Cara kerja {#how-it-works}

Kamu membuat game dengan menyusun entity di dalam scene, memasang komponen untuk tampilan dan fisika, lalu menghubungkan graph node untuk mengatur perilaku.

:::steps
1. Buka Lupis Engine di browser atau jalankan aplikasi desktop (lihat [Instalasi & Pengaturan Awal](getting_started/installation)).
2. Buat proyek di dashboard **My Projects** untuk membuka workspace [Gambaran Umum Editor](interface/editor_overview).
3. Tambahkan entity di **Scene Hierarchy** dan atur posisinya di [Scene Viewport](interface/scene_viewport).
4. Pilih sebuah entity, lalu klik **Add Component** di **Property Inspector** untuk memasang sprite, collider, atau animasi.
5. Pasang [Script Controller](components/script_controller) dan hubungkan node dari [Overview & Architecture](node_library/overview) untuk mengatur pergerakan, pertarungan, atau UI.
6. Klik **Play** di top bar untuk menguji game secara langsung, lalu kemas proyekmu di [Proyek & Ekspor](getting_started/project_and_export).
:::

## Contoh {#example}

Lupis Engine menyediakan node game tingkat tinggi untuk berbagai genre 2D umum agar kamu bisa membuat prototipe mekanika secara lengkap dalam hitungan menit.

| Genre | Mekanika utama | Tempat memulai |
| --- | --- | --- |
| **2D Platformer** | Gravitasi, variable jump, wall slide, slope, dan kombo serangan jarak dekat. | [Pergerakan Platformer](behaviour/movement/platformer) |
| **Top-Down RPG** | Pergerakan 8 arah ternormalisasi, animasi arah hadap, tilemap, dan trigger area. | [Pergerakan Top-Down](behaviour/movement/top_down) |
| **Visual Novel & Interactive UI** | Dialog efek typewriter, menu pilihan bercabang, slider audio, dan HUD dengan data binding. | [UI Dinamis & Data Binding](behaviour/ui/dynamic_ui) |

> [!TIP]
> Jika kamu baru menggunakan Lupis Engine, ikuti [Mulai Cepat](getting_started/quick_start) untuk membuat dan menguji scene interaktif pertamamu.

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Instalasi & Pengaturan Awal](getting_started/installation) | Kamu ingin menjalankan Lupis Engine di web, men-download aplikasi desktop, atau menjalankan server lokal. |
| [Mulai Cepat](getting_started/quick_start) | Kamu ingin membuat proyek dan menggerakkan entity pemain dalam waktu kurang dari lima menit. |
| [Gambaran Umum Editor](interface/editor_overview) | Kamu ingin mengenal tata letak panel, toolbar, dan dock di dalam workspace. |
| [Proyek & Ekspor](getting_started/project_and_export) | Kamu ingin menyimpan backup atau mengekspor game sebagai paket web atau aplikasi Windows. |
