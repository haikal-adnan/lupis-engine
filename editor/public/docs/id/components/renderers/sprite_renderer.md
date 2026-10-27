---
title: "Image Renderer"
category: "Visual Renderer"
description: "Menampilkan tekstur 2D atau potongan area spritesheet pada sebuah entity. Gunakan Image Renderer untuk karakter, prop, latar belakang, dan gambar UI."
---

## Gambaran umum {#overview}

Komponen **Image Renderer** menggambar asset gambar yang diimpor (**.png**, **.jpg**, atau **.webp**) di dalam batas [Transform & UI Transform](components/transform) milik sebuah entity. Komponen ini menyediakan modal crop interaktif untuk memotong frame tunggal dari spritesheet serta mendukung penyaringan piksel tajam maupun halus.

:::features
- **Crop Interaktif**: Mengklik kotak preview untuk memotong spritesheet dengan perataan grid.
- **Mode Piksel dan Halus**: Berpindah antara penyaringan **Pixelated** untuk pixel art retro dan **Smooth** untuk grafis resolusi tinggi.
- **Render SDF**: Mengaktifkan **SDF** agar tepi ikon dan siluet tetap tajam saat skalanya diubah.
- **Siap untuk Animator**: Dipasangkan dengan [Sprite Animator](components/sprite_animator) untuk memutar klip animasi frame demi frame.
:::

## Tambahkan komponen {#add-the-component}

:::steps
1. Pilih sebuah entity di [Scene Hierarchy](interface/scene_hierarchy) atau [Scene Viewport](interface/scene_viewport).
2. Di [Property Inspector](interface/property_inspector), klik **Add Component...** di bawah **Actions**, lalu pilih **Image Renderer**.
3. Di panel **Assets** pada bottom dock, klik kanan sebuah asset gambar lalu pilih **Apply to SpriteRenderer** (atau klik kotak **Texture** di inspector untuk memilih asset).
:::

> [!TIP]
> Klik kanan sebuah layer **World** atau **User Interface** di **Scene Hierarchy**, arahkan kursor ke **Add Entity** (atau **Add UI Element**), lalu klik **Sprite** (atau **UI Image**) untuk membuat entity yang langsung memiliki **Image Renderer**.

## Properti {#properties}

| Properti | Tipe | Bawaan | Deskripsi |
| --- | --- | --- | --- |
| Crop Thumbnail | Object | Full image | Kotak preview 52x52 di sebelah kiri. Klik kotak ini untuk membuka modal crop sprite interaktif. |
| Texture | String | None | **ID** asset gambar yang digunakan. |
| Source Rect (X, Y, W, H) | Number | 0, 0, 100, 100 | Area persegi panjang dalam piksel yang diambil dari tekstur sumber (pergeseran **X**, **Y** dan ukuran **W**, **H**). |
| Opacity | Number | 100 | Persentase transparansi dari 0% (tidak terlihat) hingga 100% (pekat). |
| Rendering (Filter Mode) | String | Pixelated | Penyaringan sampel tekstur: **Pixelated** (nearest-neighbor untuk pixel art) atau **Smooth** (bilinear untuk gambar resolusi tinggi). |
| SDF | Boolean | false | Mengaktifkan render Signed Distance Field untuk menghasilkan tepi yang tajam pada skala berapa pun. |

Klik ikon 3 titik pada judul **Image Renderer** untuk mengakses action ukuran dan komponen.

| Action Menu | Deskripsi |
| --- | --- |
| Reset to Native Size | Mengatur ulang **Source Rect** ke ukuran penuh tekstur serta menyesuaikan lebar dan tinggi transformasi entity agar sama dengan dimensi piksel gambar. |
| Sync Component | Tersedia pada instance [prefab](components/entities_and_prefabs). Mengembalikan pengaturan sprite ke nilai prefab master. |
| Remove Component | Menghapus **Image Renderer** dari entity. |

## Contoh penggunaan {#usage-examples}

Gunakan modal crop interaktif untuk mengambil satu frame atau prop dari spritesheet yang besar.

:::steps
1. Pasang tekstur spritesheet ke **Image Renderer** milik entity.
2. Di bagian **Image Renderer** pada [Property Inspector](interface/property_inspector), klik **Crop Thumbnail** berukuran 52x52.
3. Di toolbar modal crop, atur **Snap** sesuai ukuran tile milikmu (**16px**, **32px**, atau **64px**).
4. Seret handle crop mengelilingi frame sprite yang diinginkan, atau geser kotak tersebut menggunakan **Arrow Keys**.
5. Tekan **Enter** atau klik **Done**. Sprite terpotong ke area tersebut dan ukuran transformasi entity menyesuaikan secara proporsional.
:::

## Scripting {#scripting}

Gunakan node di [Rendering & Camera](node_library/game_renderer) dan [Animation](node_library/game_animation) untuk mengubah sprite atau menganimasikan efek saat game berjalan.

| Node | Deskripsi |
| --- | --- |
| [Get Sprite](node_library/game_renderer#node-getSprite) | Membaca asset tekstur, koordinat source crop, opasitas, atau pengaturan filter dari sebuah entity. |
| [Set Sprite](node_library/game_renderer#node-setSprite) | Mengubah asset tekstur, area crop, atau opasitas saat game berjalan. |
| [Fade To](node_library/game_animation#node-tweenFadeTo) | Menganimasikan opasitas sprite secara halus selama durasi tertentu. |
| [Crop Image](node_library/game_animation#node-tweenCropTo) | Menganimasikan koordinat **Source Rect** sprite seiring waktu. |
| [Fill Amount](node_library/game_animation#node-tweenFillAmount) | Memotong tampilan sprite dari 0% hingga 100% untuk health bar, progress bar, serta efek sapuan melingkar atau searah. |

## Masalah umum {#common-issues}

| Masalah | Solusi |
| --- | --- |
| **Image Renderer** terkunci dengan keterangan **Controlled by Animator** | Komponen [Sprite Animator](components/sprite_animator) yang aktif menimpa tekstur dan area crop pada setiap frame. Atur **Status** ke **Disabled** di **Sprite Animator** untuk mengedit **Image Renderer** secara manual. |
| Tidak bisa menghapus **Image Renderer** | **Sprite Animator** membutuhkan **Image Renderer**. Hapus **Sprite Animator** terlebih dahulu, lalu hapus **Image Renderer**. |
| Pixel art terlihat buram saat diperbesar | Atur **Rendering** ke **Pixelated** dan pastikan **SDF** dinonaktifkan. |

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Visual Renderer](components/renderers) | Kamu ingin membandingkan keempat komponen renderer. |
| [Sprite Animator](components/sprite_animator) | Kamu ingin memutar animasi spritesheet frame demi frame. |
| [Transform & UI Transform](components/transform) | Kamu ingin mengubah ukuran, membalik, atau menambatkan anchor sprite. |
| [UI Dinamis & Data Binding](behaviour/ui/dynamic_ui) | Kamu ingin mengendalikan health bar atau ikon UI dari data game. |
