---
title: "Tilemap"
category: "Visual Renderer"
description: "Melukis level 2D berbasis grid menggunakan gambar tileset dan solid collision opsional. Gunakan Tilemap untuk membangun stage platformer, peta top-down, dinding, dan lantai."
---

## Gambaran umum {#overview}

Komponen **Tilemap** memungkinkanmu melukis dunia 2D ke atas grid dari satu gambar tileset. Komponen ini tersedia pada entity **World** dan menyediakan tab **Tilemap Editor** khusus berisi tool brush, eraser, bucket fill, picker (eyedropper), serta selection box, ditambah opsi solid collision satu klik untuk seluruh tile yang dilukis.

:::features
- **Palet Tile**: Memilih satu tile atau menyeret beberapa tile sekaligus untuk melukis stamp utuh.
- **Alat Lukis**: Melukis dengan **Brush**, menghapus, mengisi area tertutup dengan **Bucket**, atau mengambil sampel tile dengan **Picker**.
- **Solid Collision**: Mencentang **Solid** untuk mengubah tile yang dilukis menjadi dinding dan lantai fisik secara otomatis.
- **Batas Otomatis**: Menyesuaikan batas ukuran transformasi entity secara otomatis mengikuti area tile yang dilukis.
:::

## Tambahkan komponen {#add-the-component}

:::steps
1. Pilih sebuah entity di dalam layer **World** pada [Scene Hierarchy](interface/scene_hierarchy).
2. Di [Property Inspector](interface/property_inspector), klik **Add Component...** di bawah **Actions**, lalu pilih **Tilemap**.
3. Di panel **Assets** pada bottom dock, klik kanan sebuah gambar tileset lalu pilih **Apply to Tilemap**.
4. Di bagian **Tilemap** pada inspector, klik **Open Editor** untuk membuka tab **Tilemap Editor**.
:::

> [!TIP]
> Klik kanan sebuah layer **World** di **Scene Hierarchy**, arahkan kursor ke **Add Entity**, lalu klik **Tilemap** untuk membuat entity tilemap dalam satu langkah.

## Properti {#properties}

Atur pengaturan render dan collision di bagian **Tilemap** pada [Property Inspector](interface/property_inspector).

| Properti | Tipe | Bawaan | Deskripsi |
| --- | --- | --- | --- |
| Source (Open Editor) | Object | - | Menampilkan kotak preview tileset dan tombol **Open Editor**. |
| Opacity | Number | 100 | Persentase transparansi tilemap dari 0% hingga 100%. |
| Rendering | String | Pixelated | Mode filter tekstur: **Pixelated** untuk pixel art yang tajam atau **Smooth** untuk tile resolusi tinggi. |
| Collision (Solid) | Boolean | false | Saat dicentang, seluruh tile yang dilukis menahan laju entity yang memiliki [Physics Body](components/physics_body) dan [Multi-Collider](components/multi_collider) padat. |

Saat kamu mengklik **Open Editor**, panel kanan berpindah ke **Tilemap Editor** yang menampilkan **Tile Tool**, **Tilemap Settings**, dan **Tile Palette**.

| Kontrol / Tool Editor | Shortcut | Deskripsi |
| --- | --- | --- |
| Pan Tool | **Space** | Menggeser kanvas tilemap. |
| Select / Move | **V** | Memilih tile yang sudah dilukis dengan kotak agar kamu bisa memindahkan atau menghapusnya (atau tahan **Ctrl** saat menggunakan kuas). |
| Brush | **B** | Melukis tile yang dipilih atau multi-tile stamp ke atas grid. |
| Eraser | **E** | Menghapus tile di bawah kursor. |
| Bucket Fill | **G** | Mengisi area kosong yang tertutup atau tile sejenis yang saling berdampingan. |
| Picker | **I** | Mengambil sampel tile di bawah kursor sebagai kuas aktifmu. |
| Tile Size (Px) | - | Mengatur lebar (**W**) dan tinggi (**H**) sel dalam piksel (bawaan 16x16). Harus diatur sebelum kamu mulai melukis tile. |
| Clear Tilemap Data | - | Menghapus seluruh tile yang sudah dilukis dari tilemap setelah konfirmasi. |

## Contoh penggunaan {#usage-examples}

Bangun layer platform padat dan layer latar belakang dekoratif dengan menggunakan dua entity **Tilemap** yang terpisah.

:::steps
1. Klik kanan layer **World** di [Scene Hierarchy](interface/scene_hierarchy), arahkan kursor ke **Add Entity**, lalu klik **Tilemap**. Ubah nama **ID** menjadi **Tilemap_Ground**.
2. Pasang gambar tileset milikmu, lalu klik **Open Editor** di [Property Inspector](interface/property_inspector).
3. Di **Tilemap Settings**, atur **Tile Size (Px)** (**W** dan **H**) agar sesuai dengan ukuran grid tileset (misalnya **16** atau **32**).
4. Di **Tile Palette**, klik satu tile (atau seret melintasi beberapa tile), tekan **B**, lalu lukis platform di atas kanvas.
5. Tutup tab **Tilemap Editor**, lalu centang **Solid** di bawah **Collision** pada bagian **Tilemap**.
6. Buat entity **Tilemap** kedua dengan nilai **Z-Index** lebih rendah dan biarkan **Solid** tidak dicentang untuk dekorasi latar belakang.
:::

## Scripting {#scripting}

Gunakan node di [Rendering & Camera](node_library/game_renderer) dan [Physics & Collision](node_library/game_physics) untuk membaca atau mengubah tilemap saat game berjalan.

| Node | Deskripsi |
| --- | --- |
| [Get Tilemap](node_library/game_renderer#node-getTilemap) | Membaca asset tileset, dimensi tile, status collision **Solid**, atau opasitas. |
| [Set Tilemap](node_library/game_renderer#node-setTilemap) | Mengubah asset tileset, status collision **Solid**, atau opasitas saat game berjalan. |
| [Solid Collision](node_library/game_physics#node-solidCollision) | Memeriksa apakah sebuah entity mengalami collision dengan rintangan padat atau tilemap padat. |

## Masalah umum {#common-issues}

| Masalah | Solusi |
| --- | --- |
| Kolom input **Tile Size (Px)** (**W** dan **H**) tidak bisa diubah | Kamu tidak bisa mengubah ukuran sel selama masih ada tile yang terlukis di atas grid. Klik **Clear Tilemap Data** di **Tilemap Settings** terlebih dahulu, lalu atur **Tile Size (Px)**. |
| **Tilemap** tidak muncul di dalam **Add Component...** | **Tilemap** hanya tersedia pada entity di dalam layer **World**. Komponen ini tidak bisa ditambahkan ke entity **User Interface**. |
| Terdapat celah tipis atau tepi buram di antara tile | Atur **Rendering** ke **Pixelated** di inspector **Tilemap**. |

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Visual Renderer](components/renderers) | Kamu ingin membandingkan keempat komponen renderer. |
| [Physics Body](components/physics_body) | Kamu ingin karakter berjalan dan mendarat di atas tilemap padat. |
| [Fisika & Slope](behaviour/physics_and_collision/physics_and_slopes) | Kamu ingin karakter berjalan mulus menaiki dan menuruni medan tilemap yang miring. |
