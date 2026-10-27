---
title: "Sprite Animator"
category: "Komponen"
description: "Memutar animasi spritesheet frame demi frame pada sebuah entity. Gunakan Sprite Animator untuk membuat klip diam, berjalan, melompat, dan menyerang di Animator Editor."
---

## Gambaran umum {#overview}

Komponen **Sprite Animator** menjalankan animasi 2D frame demi frame dengan memperbarui [Image Renderer](components/renderers/sprite_renderer) milik sebuah entity seiring waktu. Komponen ini membuka workspace **Animator Editor** khusus tempat kamu mengelompokkan klip ke dalam kategori, memotong frame sumber, mengatur frame rate (FPS), dan meninjau animasi menggunakan onion skin (bayangan frame sebelumnya).

:::features
- **Pustaka Klip**: Mengelompokkan animasi seperti **idle**, **run**, dan **attack** ke dalam klip bernama dan folder.
- **Auto-Fill Timeline**: Memotong spritesheet horizontal atau berbentuk grid menjadi frame timeline secara otomatis menggunakan **Auto Fill**.
- **Pivot dan FPS per Klip**: Mengatur frame rate (FPS), pengulangan, ukuran dasar, dan titik pivot 3x3 khusus untuk setiap klip.
- **Onion Skin**: Mengaktifkan **Show Shadow (Onion Skin)** di editor untuk meratakan posisi antar-frame dengan halus.
:::

## Tambahkan komponen {#add-the-component}

:::steps
1. Pilih sebuah entity yang sudah memiliki komponen [Image Renderer](components/renderers/sprite_renderer).
2. Di [Property Inspector](interface/property_inspector), klik **Add Component...** di bawah **Actions**, lalu pilih **Sprite Animator**.
3. Di bagian **Sprite Animator**, klik **Open Editor** di samping **Clips Data** untuk membuka tab **Animator Editor**.
:::

> [!NOTE]
> Jika entity belum memiliki **Image Renderer**, opsi **Sprite Animator** dinonaktifkan di dalam **Add Component...** dengan keterangan **(Requires SpriteRenderer)**.

## Properti {#properties}

Atur pemutaran animasi dan klip aktif di bagian **Sprite Animator** pada [Property Inspector](interface/property_inspector).

| Properti | Tipe | Bawaan | Deskripsi |
| --- | --- | --- | --- |
| Status | Boolean | Enabled | Mengatur apakah **Sprite Animator** mengendalikan **Image Renderer** milik entity. Atur ke **Disabled** untuk mengedit sprite secara manual. |
| Playback | Boolean | Playing | Mengalihkan status **Playing** atau **Paused** untuk meninjau klip aktif langsung di [Scene Viewport](interface/scene_viewport). |
| Current Frame | Number | 1 | Melangkah maju atau mundur per frame saat **Playback** dijeda. |
| Current Clip | String | None | Memilih klip animasi bawaan (**ID**) yang diputar saat scene dimulai. |
| Clips Data (Open Editor) | Object | 0 clip(s) | Menampilkan jumlah total klip dan tombol **Open Editor**. |

Di dalam tab **Animator Editor**, pilih sebuah klip pada panel **Clip** di sebelah kiri untuk mengatur **Clip Properties** di sebelah kanan dan urutan framenya pada **Timeline** di bagian bawah.

| Properti / Kontrol Klip | Tipe | Bawaan | Deskripsi |
| --- | --- | --- | --- |
| ID | String | clip_default | Pengenal unik klip yang digunakan untuk memutar klip ini dari visual script. |
| Texture | String | None | Asset gambar spritesheet yang digunakan oleh klip ini. |
| Rendering & SDF | String | Pixelated | Filter sampel (**Pixelated** atau **Smooth**) dan tombol **SDF** untuk klip ini. |
| Base Size (W, H) & Pivot | Vector2 | 32, 32 | Lebar dan tinggi sel frame dalam piksel, beserta titik pivot 3x3 untuk klip tersebut. |
| Frame Rate (FPS) | Number | 12 | Kecepatan putar dalam satuan frame per detik (1 hingga 60). |
| Loop Animation | Boolean | true | **True (Loop)** mengulang klip secara terus-menerus; **False (Once)** berhenti pada frame terakhir. |
| Flip Horizontal | Boolean | false | Membalik klip secara horizontal. |
| Add Frame / Auto Fill / Clear | Object | - | Tombol **Timeline** di bagian bawah untuk menambahkan satu frame, memotong spritesheet secara otomatis berdasarkan **Base Size**, atau menghapus semua frame. |

## Contoh penggunaan {#usage-examples}

Buat animasi berjalan berulang dari baris spritesheet horizontal menggunakan **Auto Fill**.

:::steps
1. Di bagian **Sprite Animator** pada [Property Inspector](interface/property_inspector), klik **Open Editor**.
2. Di panel **Clip** sebelah kiri, klik kanan ruang kosong lalu pilih **New Clip**.
3. Di panel **Clip Properties** sebelah kanan, atur **ID** menjadi **walk**.
4. Klik tombol **Texture** (atau klik kanan spritesheet di dock **Assets** lalu pilih **Apply to Selected Clip**).
5. Atur **Base Size** (**W** dan **H**) sesuai ukuran piksel satu frame tunggal (misalnya **32** kali **32**).
6. Di panel **Timeline** bagian bawah, klik **Auto Fill**. Editor memotong spritesheet menjadi deretan frame secara otomatis.
7. Atur **Frame Rate (FPS)** ke **12**, biarkan **Loop Animation** diatur ke **True (Loop)**, lalu klik tombol **Play** di timeline untuk melihat preview.
:::

## Scripting {#scripting}

Gunakan node di [Animation](node_library/game_animation) dan [Helper & Tool](node_library/helper_tool) untuk mengganti klip dan memicu event frame saat game berjalan.

| Node | Deskripsi |
| --- | --- |
| [Play Animation](node_library/game_animation#node-playAnimation) | Memutar klip berdasarkan **ID** dan memicu **onComplete** saat klip yang tidak berulang selesai diputar. |
| [Pause Animation](node_library/game_animation#node-pauseAnimation) | Menjeda klip animasi yang sedang diputar. |
| [Get Animator](node_library/game_animation#node-getAnimator) | Membaca **ID** klip aktif, status pemutaran, atau status pembalikan arah. |
| [Set Animator](node_library/game_animation#node-setAnimator) | Memperbarui klip saat ini, status aktif, atau status pembalikan arah. |
| [On Animation Frame](node_library/game_animation#node-onAnimationFrame) | Memicu eksekusi saat sebuah klip memasuki, berada di dalam, atau keluar dari rentang frame tertentu (berguna untuk suara langkah kaki atau ayunan pedang). |
| [Platformer Animator](node_library/helper_tool#node-platformerAnimator) | Mengganti klip diam, berlari, melompat, dan jatuh secara otomatis untuk karakter platformer. |
| [Top-Down Animator](node_library/helper_tool#node-topDownAnimator) | Mengganti klip diam dan berjalan sesuai arah hadap secara otomatis untuk karakter top-down. |

## Masalah umum {#common-issues}

| Masalah | Solusi |
| --- | --- |
| **Auto Fill** menghasilkan jumlah atau ukuran frame yang salah | Atur **Base Size** (**W** dan **H**) di **Clip Properties** agar sama persis dengan lebar dan tinggi piksel satu frame sebelum mengklik **Auto Fill**. |
| Tidak bisa mengedit properti **Image Renderer** | **Sprite Animator** mengunci **Image Renderer** selama masih aktif. Klik **Enabled** di samping **Status** pada **Sprite Animator** untuk mengubahnya menjadi **Disabled** saat kamu melakukan penyesuaian manual. |
| Posisi karakter bergeser saat berpindah antar-klip | Pastikan seluruh klip pada entity tersebut menggunakan titik **Pivot** yang sama di **Clip Properties** (misalnya tengah bawah untuk karakter yang berpijak di tanah). |

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Image Renderer](components/renderers/sprite_renderer) | Kamu ingin mengatur komponen sprite dasar yang dibutuhkan oleh **Sprite Animator**. |
| [Pergerakan Platformer](behaviour/movement/platformer) | Kamu ingin menghubungkan pergerakan karakter ke animasi diam, berlari, dan melompat. |
| [Pergerakan Top-Down](behaviour/movement/top_down) | Kamu ingin menyiapkan animasi karakter 4 arah atau 8 arah. |
