---
title: "Physics Body"
category: "Komponen"
description: "Menambahkan gravitasi, velocity (kecepatan), linear drag (hambatan gerak), dan respons collision pada sebuah entity. Pasangkan Physics Body dengan Multi-Collider agar entity bergerak dan bereaksi seperti objek fisik."
---

## Gambaran umum {#overview}

Komponen **Physics Body** menghubungkan sebuah entity ke simulasi fisika 2D. Komponen ini mengatur bagaimana gravitasi, velocity, drag (hambatan), dan slope memengaruhi entity tersebut. Pasangkan komponen ini dengan [Multi-Collider](components/multi_collider) agar entity bisa mengalami collision dengan dinding, lantai, dan entity lainnya.

:::features
- **Mode Gerak**: Memilih **Platformer (Side-Scroll)**, **Top-Down**, atau **Custom / Arcade** untuk menyesuaikan pengaturan secara otomatis.
- **Gravitasi dan Drag**: Mengatur nilai **Gravity Scale** dan **Linear Drag** per entity dengan rapi di inspector.
- **Perataan Slope (Align to Slope)**: Mengaktifkan **Align to Slope** untuk memutar karakter secara halus mengikuti kemiringan medan.
- **Tombol Simulasi Langsung**: Menjeda atau melanjutkan simulasi fisika pada masing-masing entity kapan saja.
:::

## Tambahkan komponen {#add-the-component}

:::steps
1. Pilih entity di [Scene Hierarchy](interface/scene_hierarchy) atau [Scene Viewport](interface/scene_viewport).
2. Di [Property Inspector](interface/property_inspector), klik **Add Component...** di bawah **Actions**, lalu pilih **Physics Body**.
3. Klik **Add Component...** lagi dan pilih **Collider** agar physics body memiliki bentuk collision.
:::

## Properti {#properties}

| Properti | Tipe | Bawaan | Deskripsi |
| --- | --- | --- | --- |
| Simulation | Boolean | Running | Mengalihkan **Running** atau **Paused** untuk mengaktifkan atau membekukan pembaruan fisika pada entity ini. |
| Motion Mode | String | Platformer (Side-Scroll) | Mengatur tipe pergerakan: **Platformer (Side-Scroll)**, **Top-Down** (gravitasi 0, redaman bidang datar), atau **Custom / Arcade**. |
| Linear Drag | Number | 1.00 | Hambatan yang memperlambat kecepatan seiring waktu (minimum 0). Sangat penting untuk pengereman gerak top-down. |
| Gravity Scale | Number | 1.00 | Pengali gravitasi scene pada entity ini (disembunyikan pada mode Top-Down). |
| Align to Slope | Boolean | false | Memutar entity secara otomatis agar sejajar dengan sudut slope di bawahnya (disembunyikan pada mode Top-Down). |
| Adapt Speed | Number | 12 | Muncul saat **Align to Slope** dicentang. Mengatur seberapa cepat entity berputar mengikuti kemiringan permukaan. |
| Max Slope (deg) | Number | 60 | Muncul saat **Align to Slope** dicentang. Sudut slope paling curam (5 hingga 89 derajat) yang masih bisa didaki oleh entity. |

> [!TIP]
> Pilih **Top-Down** pada **Motion Mode** untuk game RPG atau game top-down agar gravitasi otomatis dinonaktifkan ke 0 dan planar damping (redaman bidang datar) diterapkan secara penuh.

## Contoh penggunaan {#usage-examples}

Pilih kombinasi **Motion Mode** dan **Gravity Scale** yang sesuai untuk berbagai peran entity game.

| Peran Entity | Motion Mode | Gravity Scale | Catatan |
| --- | --- | --- | --- |
| Pemain Platformer | **Platformer** | **1.00** hingga **2.50** | Centang **Align to Slope** jika level memiliki slope. |
| Pemain / Musuh Top-Down | **Top-Down** | **0.00** (Otomatis) | Atur **Linear Drag** ke **5.00** atau lebih tinggi agar berhenti dengan responsif. |
| Moving Platform / Scripted | **Custom / Arcade** | **0.00** | Gerakkan menggunakan [Ping Pong Stepper](node_library/helper_tool#node-pingPongStepper) atau node kecepatan. |
| Dinding Statis / Prop | *(Tanpa Fisika)* | - | Pasang **Collider** (padat) saja. Tidak memerlukan Physics Body. |

## Scripting {#scripting}

Gunakan node di [Physics & Collision](node_library/game_physics) dan [Helper & Tool](node_library/helper_tool) untuk menggerakkan physics body dan membaca status fisika saat game berjalan.

| Node | Deskripsi |
| --- | --- |
| [Get Physics Info](node_library/game_physics#node-getPhysics) | Membaca velocity (kecepatan), status grounded (berpijak di tanah), drag, atau arah hadap. |
| [Set Physics Info](node_library/game_physics#node-setPhysics) | Memperbarui velocity (kecepatan), **Gravity Scale**, atau **Linear Drag** saat game berjalan. |
| [Move and Slide](node_library/game_physics#node-moveAndSlide) | Menggerakkan physics body lengkap dengan wall sliding otomatis dan deteksi ground platform. |
| [Apply Knockback](node_library/game_physics#node-applyKnockback) | Mendorong entity menggunakan kecepatan knockback dan redaman gesekan (friction decay). |
| [Platformer Controller](node_library/helper_tool#node-platformerController) | Node pergerakan platformer 2D lengkap dengan pemicu berjalan, melompat, dan mendarat. |
| [Top-Down Controller](node_library/helper_tool#node-topDownController) | Node pergerakan top-down 8 arah lengkap dengan normalisasi diagonal dan sprint. |

## Masalah umum {#common-issues}

| Masalah | Solusi |
| --- | --- |
| Entity jatuh menembus lantai | Pastikan baik entity maupun lantai memiliki [Multi-Collider](components/multi_collider) yang diatur ke **Solid (Physics)** (atau [Tilemap](components/renderers/tilemap) dengan **Solid** tercentang). |
| Entity berputar di slope sehingga collider padatnya menancap ke tanah | Di bagian **Collider** milik entity tersebut, centang **Lock World Rotation (Stay Upright)** agar sprite visual mengikuti kemiringan permukaan sementara collider fisiknya tetap tegak. |
| Karakter top-down meluncur turun dengan sendirinya | Pilih **Top-Down** pada **Motion Mode** (atau atur **Gravity Scale** ke **0**) di **Physics Body**. |

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Multi-Collider](components/multi_collider) | Kamu ingin menentukan collision box padat, kapsul, trigger, atau hitbox. |
| [Fisika & Slope](behaviour/physics_and_collision/physics_and_slopes) | Kamu ingin panduan lengkap tentang cara mengatur slope, kapsul, dan collision medan. |
| [Pergerakan Platformer](behaviour/movement/platformer) | Kamu ingin membuat karakter platformer yang bisa berlari dan melompat. |
| [Pergerakan Top-Down](behaviour/movement/top_down) | Kamu ingin membuat karakter top-down 8 arah. |
