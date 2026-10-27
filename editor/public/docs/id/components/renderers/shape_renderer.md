---
title: "Shape Renderer"
category: "Visual Renderer"
description: "Menggambar poligon vektor khusus, segmen garis, dan lingkaran dengan warna fill, outline, serta collision geometri opsional. Gunakan Shape Renderer untuk platform, penghalang, zona, dan UI vektor."
---

## Gambaran umum {#overview}

Komponen **Shape Renderer** menggambar geometri vektor langsung di dalam engine tanpa memerlukan asset gambar eksternal. Komponen ini menyediakan workspace **Shape Editor** khusus tempat kamu menempatkan vertex, menghubungkan segmen, menggambar poligon tertutup atau lingkaran, serta mengaktifkan collision fisika padat langsung pada geometri yang digambar.

:::features
- **Alat Vektor**: Menggambar titik, segmen garis, poligon tertutup, dan lingkaran di **Shape Editor**.
- **Fill dan Outline**: Menyesuaikan warna fill, ketebalan outline, dan nilai opasitas secara terpisah.
- **Fisika Bawaan**: Mengaktifkan **Polygon Physics**, **Segment Physics**, atau **Circle Physics** untuk slope dan dinding.
- **Overlay Scene**: Meredupkan atau menyembunyikan bagian scene lainnya saat mengedit vertex agar penjiplakan lebih presisi.
:::

## Tambahkan komponen {#add-the-component}

:::steps
1. Pilih sebuah entity di [Scene Hierarchy](interface/scene_hierarchy) atau [Scene Viewport](interface/scene_viewport).
2. Di [Property Inspector](interface/property_inspector), klik **Add Component...** di bawah **Actions**, lalu pilih **Shape Renderer**.
3. Klik **Open Shape Editor** di bagian **Shape Renderer** untuk membuka tab penggambaran interaktif.
:::

> [!TIP]
> Klik kanan sebuah layer di **Scene Hierarchy**, arahkan kursor ke **Add Entity** (atau **Add UI Element**), lalu klik **Shape** (atau **UI Shape**) untuk membuat entity bentuk dalam satu langkah.

## Properti {#properties}

Atur warna, ketebalan outline, dan collision fisika di bagian **Shape Renderer** pada [Property Inspector](interface/property_inspector).

| Properti | Tipe | Bawaan | Deskripsi |
| --- | --- | --- | --- |
| Fill (Checkbox) | Boolean | true | Mengaktifkan atau menonaktifkan warna fill untuk poligon tertutup dan lingkaran. |
| Fill Color | String | #ff1e00 | Warna heksadesimal untuk fill. |
| Fill Opacity | Number | 100 | Transparansi fill dari 0% hingga 100%. |
| Outline Width | Number | 0 | Ketebalan outline dalam piksel untuk sisi poligon, segmen, dan lingkaran. |
| Outline Color | String | #0066FF | Warna heksadesimal untuk outline. |
| Outline Opacity | Number | 100 | Transparansi outline dari 0% hingga 100%. |
| Open Shape Editor | Object | - | Membuka tab **Shape Editor** untuk menggambar dan memindahkan vertex. |
| Polygon Physics | Boolean | false | Mengaktifkan collision fisika padat pada poligon tertutup. |
| Segment Physics | Boolean | false | Mengaktifkan solid edge collision di sepanjang segmen garis dan garis berantai yang digambar. |
| Circle Physics | Boolean | false | Mengaktifkan solid circle collision pada lingkaran yang digambar. |

Saat kamu mengklik **Open Shape Editor**, panel kanan berpindah ke **Custom Shape Inspector** yang berisi alat gambar dan kontrol visibilitas scene.

| Tool Shape | Shortcut | Deskripsi |
| --- | --- | --- |
| Pan Tool | **Space** | Menggeser kamera kanvas. |
| Select / Move | **V** | Memilih dan menyeret vertex yang sudah ada. |
| Delete Point | **E** | Menghapus vertex mana pun yang kamu klik. |
| Point Tool | **P** | Menempatkan satu titik vertex. |
| Segment Tool | **S** | Menggambar segmen garis banyak titik yang saling terhubung. Tekan **Enter** untuk menyelesaikan. |
| Line Tool | **L** | Menggambar satu garis lurus di antara dua titik. |
| Polygon Tool | **G** | Menggambar bentuk poligon tertutup. Tekan **Enter** untuk menutup dan menerapkan bentuk. |
| Circle Tool | **C** | Menggambar lingkaran dengan menyeret jari-jarinya. |

## Contoh penggunaan {#usage-examples}

Gunakan **Shape Renderer** dengan **Polygon Physics** atau **Segment Physics** untuk membuat bukit landai dan medan khusus.

:::steps
1. Buat sebuah entity **Shape** di dalam layer **World**, lalu klik **Open Shape Editor** di [Property Inspector](interface/property_inspector).
2. Tekan **G** untuk memilih **Polygon Tool** (atau **S** untuk **Segment Tool**).
3. Klik pada kanvas untuk menempatkan vertex mengikuti slope yang diinginkan, lalu tekan **Enter** untuk menerapkan bentuk tersebut.
4. Tekan **V** dan seret vertex mana pun untuk menyempurnakan kemiringannya.
5. Tutup tab **Shape Editor**, kembali ke **Property Inspector**, lalu centang **Polygon Physics** (atau **Segment Physics**).
:::

## Scripting {#scripting}

Gunakan node di [Rendering & Camera](node_library/game_renderer) dan [Animation](node_library/game_animation) untuk membaca atau memperbarui tampilan bentuk saat game berjalan.

| Node | Deskripsi |
| --- | --- |
| [Get Shape](node_library/game_renderer#node-getShape) | Membaca warna fill, warna outline, ketebalan outline, atau opasitas dari **Shape Renderer**. |
| [Set Shape](node_library/game_renderer#node-setShape) | Memperbarui warna fill, warna outline, ketebalan outline, atau opasitas saat game berjalan. |
| [Fade To](node_library/game_animation#node-tweenFadeTo) | Menganimasikan opasitas bentuk secara halus selama durasi tertentu. |

## Masalah umum {#common-issues}

| Masalah | Solusi |
| --- | --- |
| Segmen garis tidak terlihat di viewport | Segmen garis tidak memiliki fill. Atur **Outline Width** ke **1** atau lebih tinggi agar garisnya terlihat. |
| Tombol **Open Shape Editor** tidak aktif | Entity tersebut merupakan instance [prefab](components/entities_and_prefabs) yang terhubung. Edit prefab master dari dock **Prefabs** atau jalankan Unpack Prefab terlebih dahulu. |
| Pemain menembus poligon atau slope yang digambar | Centang **Polygon Physics**, **Segment Physics**, atau **Circle Physics** di bagian bawah **Shape Renderer**, dan pastikan pemain memiliki [Physics Body](components/physics_body) serta [Multi-Collider](components/multi_collider). |

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Visual Renderer](components/renderers) | Kamu ingin membandingkan keempat komponen renderer. |
| [Fisika & Slope](behaviour/physics_and_collision/physics_and_slopes) | Kamu ingin mengatur pergerakan karakter di atas bentuk slope. |
| [Referensi Shortcut](interface/shortcuts) | Kamu ingin melihat daftar cepat seluruh shortcut keyboard **Shape Editor**. |
