---
title: "Mulai Cepat"
category: "Memulai"
description: "Buat proyek pertamamu, tempatkan pemain dan platform di dalam scene, pasang logika pergerakan, dan uji game milikmu dalam waktu kurang dari lima menit."
---

## Gambaran umum {#overview}

Panduan ini memandumu membangun scene platformer yang bisa dimainkan dari awal. Dalam beberapa menit, kamu membuat proyek, menambahkan entity fisik, menghubungkan node pergerakan, dan menguji karaktermu di viewport.

:::features
- **Buat Proyek**: Memulai workspace game baru dari dashboard **My Projects**.
- **Bangun Scene**: Menempatkan ground platform padat dan entity pemain aktif di viewport.
- **Hubungkan Pergerakan**: Menyambungkan **On Tick** ke **Platformer Controller** untuk kontrol keyboard instan.
- **Mainkan dan Simpan**: Menjalankan simulasi langsung di editor dan menyimpan proyekmu ke penyimpanan.
:::

## Buat proyek {#create-a-project}

Mulai dari **Dashboard** (**My Projects**) untuk membuat container proyek baru.

:::steps
1. Di halaman **My Projects**, klik **New** di samping judul (atau klik **Create First Project** jika daftar proyekmu masih kosong).
2. Di dialog **New Project**, ketik **Project Name** seperti **My First Game** beserta **Description** opsional.
3. Klik **Create**. Editor membuka proyek barumu di workspace [Gambaran Umum Editor](interface/editor_overview).
:::

## Tempatkan entity di scene {#place-entities-in-the-scene}

Selanjutnya, buat ground platform padat dan karakter pemain menggunakan [Scene Hierarchy](interface/scene_hierarchy), [Scene Viewport](interface/scene_viewport), dan [Property Inspector](interface/property_inspector).

:::steps
1. Di **Scene Hierarchy** di sebelah kiri, tambahkan sebuah entity ke layer dunia dan ubah namanya menjadi **Ground**.
2. Saat **Ground** dipilih, klik **Add Component** di **Property Inspector**, lalu tambahkan [Shape Renderer](components/renderers/shape_renderer) dan [Multi-Collider](components/multi_collider).
3. Di **Property Inspector**, atur **Size** pada [Transform & UI Transform](components/transform) milik **Ground** ke **800 x 40**, posisikan di dekat bagian bawah tampilan kamera, lalu pastikan **Type** pada **Multi-Collider** diatur ke **Solid (Physics)** agar berfungsi sebagai platform padat yang kokoh.
4. Buat entity kedua di **Scene Hierarchy**, ubah namanya menjadi **Player**, dan posisikan di atas **Ground** pada **Scene Viewport**.
5. Tambahkan **Shape Renderer** (atau [Image Renderer](components/renderers/sprite_renderer)), **Physics Body**, dan **Multi-Collider** ke **Player**.
6. Pada **Physics Body** milik **Player**, biarkan **Motion Mode** diatur ke **Platformer (Side-Scroll)**, dan pada **Collider**, centang **Lock World Rotation (Stay Upright)** agar karakter tetap tegak.
:::

## Tambahkan logika pergerakan {#add-movement-logic}

Sekarang pasang visual script ke **Player** agar kamu bisa berlari dan melompat menggunakan keyboard.

:::steps
1. Pilih **Player** di [Scene Hierarchy](interface/scene_hierarchy), klik **Add Component** di [Property Inspector](interface/property_inspector), lalu pilih [Script Controller](components/script_controller).
2. Di bagian **Script Controller**, buat atau tetapkan sebuah script, lalu buka script tersebut di editor [Konsep Graph & Node](visual_scripting/graph_concepts) pada bottom dock.
3. Klik kanan kanvas graph, cari [On Tick](node_library/game_lifecycle#node-eventTick), lalu tempatkan di dalam graph.
4. Klik kanan kanvas lagi, tambahkan [Platformer Controller](node_library/helper_tool#node-platformerController), lalu hubungkan pin eksekusi berwarna putih dari **On Tick** ke **Platformer Controller**.
5. Hubungkan pin output **deltaTime** dari **On Tick** ke pin input **deltaTime** milik **Platformer Controller**.
:::

## Mainkan dan simpan {#play-and-save}

Uji scene milikmu langsung di dalam viewport dan simpan perubahannya ke penyimpanan.

:::steps
1. Klik **Play** di top bar. **Player** jatuh ke atas **Ground**.
2. Tekan **A** dan **D** (atau tombol panah **Left** dan **Right**) untuk bergerak secara horizontal, lalu tekan **W** atau **Space** untuk melompat.
3. Klik **Stop** di top bar untuk kembali ke mode edit, lalu tekan **Ctrl + S** untuk menyimpan proyekmu.
:::

:::shortcuts
- `Ctrl` + `S`: Simpan proyek
- `Ctrl` + `Z`: Undo action terakhir
- `Space` + `Left Click`: Geser tampilan Scene Viewport
- `Scroll`: Perbesar atau perkecil tampilan Scene Viewport
:::

> [!TIP]
> Perhatikan indikator status di top bar: titik hijau menandakan proyekmu sudah tersinkronisasi dengan penyimpanan, sedangkan titik merah menandakan ada perubahan yang belum disimpan.

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Pergerakan Platformer](behaviour/movement/platformer) | Kamu ingin mengembangkan scene ini dengan animasi sprite, variable jump, dan mekanika slope. |
| [Pergerakan Top-Down](behaviour/movement/top_down) | Kamu ingin membuat game petualangan top-down 8 arah sebagai pengganti platformer. |
| [Proyek & Ekspor](getting_started/project_and_export) | Kamu ingin mengatur resolusi kanvas, auto-save, atau mengekspor game milikmu. |
| [Referensi Shortcut](interface/shortcuts) | Kamu ingin melihat daftar lengkap shortcut keyboard untuk setiap panel editor. |
