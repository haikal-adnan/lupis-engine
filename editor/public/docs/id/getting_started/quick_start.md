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
1. Di panel **Scene Hierarchy** di sebelah kiri, cari baris **World Layer** di bawah bagian **World**. Klik kanan pada baris **World Layer**, arahkan kursor ke menu konteks **Add Entity**, lalu pilih tipe entitas **Shape** untuk membuat entity bentuk geometri.
2. Klik kanan entity baru tersebut di hierarchy, pilih **Rename Entity** (atau tekan **F2**), lalu ubah namanya menjadi **Ground** dan konfirmasi.
3. Saat **Ground** dipilih, periksa panel **Property Inspector** di sebelah kanan. Entitas **Shape** sudah otomatis memiliki komponen [Transform & UI Transform](components/transform) dan [Shape Renderer](components/renderers/shape_renderer). Gulir ke bawah ke bagian **Actions**, buka dropdown **Add Component**, lalu pilih **Collider** (untuk memasang [Multi-Collider](components/multi_collider)).
4. Di bagian **Transform & UI Transform**, atur **Size** milik **Ground** ke **800 x 40** (Width `800` dan Height `40`), posisikan di dekat bagian bawah tampilan kamera, lalu pada bagian **Collider**, pastikan **Type** diatur ke **Solid (Physics)** agar berfungsi sebagai platform padat yang kokoh.
5. Buat entity karakter pemain: klik kanan kembali pada baris **World Layer** di **Scene Hierarchy**, pilih **Add Entity** > **Shape** (atau pilih **Sprite** jika ingin menggunakan gambar tekstur), lalu klik kanan entity baru tersebut dan pilih **Rename Entity** (atau tekan **F2**) untuk mengubah namanya menjadi **Player**. Posisikan **Player** tepat di atas platform **Ground** pada [Scene Viewport](interface/scene_viewport).
6. Saat **Player** dipilih, buka dropdown **Add Component** di **Property Inspector** pada bagian **Actions**, lalu tambahkan [Physics Body](components/physics_body) dan [Multi-Collider](components/multi_collider) (**Collider**). Pada bagian **Physics Body**, pastikan **Motion Mode** diatur ke **Platformer (Side-Scroll)**, dan pada bagian **Collider**, centang kotak **Lock World Rotation (Stay Upright)** agar karakter tetap tegak dan tidak terguling saat bergerak.
:::

## Tambahkan logika pergerakan {#add-movement-logic}

Sekarang pasang visual script ke **Player** agar kamu bisa berlari dan melompat menggunakan keyboard.

:::steps
1. Pilih **Player** di [Scene Hierarchy](interface/scene_hierarchy). Di bagian **Actions** pada [Property Inspector](interface/property_inspector), buka dropdown **Add Component** dan pilih [Script Controller](components/script_controller).
2. Di panel bawah (bottom dock), buka tab **Scripts**. Klik tombol **+** (Create New Component), beri nama script seperti **PlayerMovement**, lalu klik **Create**.
3. Di panel **Scripts**, klik kanan file script `PlayerMovement` yang baru dibuat, lalu pilih **Add to Player** (atau pasang melalui dropdown **Attached Scripts** di Property Inspector).
4. Klik dua kali (double click) file `PlayerMovement` di panel Scripts (atau klik tombol **Source / Open Graph** di bagian Script Controller pada Property Inspector) untuk membuka kanvas visual scripting [Konsep Graph & Node](visual_scripting/graph_concepts).
5. Klik kanan pada area kosong kanvas graph (atau cari dari panel Node Library di sebelah kiri kanvas), cari node [On Tick](node_library/game_lifecycle#node-eventTick), lalu klik untuk menempatkannya di graph.
6. Klik kanan kanvas lagi, cari dan tambahkan [Platformer Controller](node_library/helper_tool#node-platformerController). Hubungkan pin eksekusi berwarna putih dari **On Tick** ke pin input eksekusi milik **Platformer Controller**, lalu hubungkan pin output numerik **deltaTime** dari **On Tick** ke pin input **deltaTime** pada **Platformer Controller**.
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
