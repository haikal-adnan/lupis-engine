---
title: "Transform & UI Transform"
category: "Komponen"
description: "Mengatur posisi, ukuran, dan rotasi sebuah entity. Entity dunia memakai **Transform**, sedangkan entity UI memakai **UI Transform** dengan anchor layar."
---

## Gambaran umum {#overview}

Setiap entity secara otomatis memiliki komponen transformasi di bawah **Object** pada [Property Inspector](interface/property_inspector). Entity di dalam layer **World** menggunakan **Transform** untuk koordinat camera-space, sedangkan entity di dalam layer **User Interface** menggunakan **UI Transform** yang menambahkan grid **Anchor** 3x3 untuk menempelkan elemen ke layar atau parent container-nya.

:::features
- **Posisi dan Ukuran**: Menempatkan entity dalam satuan piksel serta mengatur lebar dan tinggi dengan pengunci rasio aspek opsional.
- **Matriks Pivot**: Memilih titik pivot 3x3 yang menjadi pusat rotasi, skala, dan pembalikan entity.
- **Anchor UI**: Menempelkan elemen user interface (UI) ke sudut, tepi, atau bagian tengah containernya.
- **Parent Inheritance**: Child entity mewarisi posisi, rotasi, dan skala dari parent-nya di [Scene Hierarchy](interface/scene_hierarchy).
:::

## Properti {#properties}

Baik **Transform** maupun **UI Transform** memiliki properti spasial inti yang sama. **UI Transform** menambahkan grid **Anchor** dan memperlakukan **Position** sebagai jarak pergeseran dari anchor tersebut.

| Properti | Tipe | Bawaan | Deskripsi |
| --- | --- | --- | --- |
| Position / Position (Offset) | Vector2 | 0, 0 | Koordinat lokal **X** dan **Y** dalam piksel. Relatif terhadap parent entity, atau relatif terhadap **Anchor** pada entity UI. |
| Anchor (UI Transform only) | Vector2 | 0.5, 0.5 | Grid 3x3 yang menempelkan elemen UI ke sudut kiri atas (0, 0), tengah (0.5, 0.5), kanan bawah (1, 1), atau tepi mana pun dari containernya. |
| Rotation | Number | 0 | Sudut rotasi lokal dalam derajat (0 sampai 359). Menampilkan **World Rot** di bawahnya saat entity memiliki parent. |
| Pivot | Vector2 | 0.5, 0.5 | Grid pivot 3x3 untuk rotasi, skala, dan pembalikan. Mengubah pivot menyesuaikan nilai **X** dan **Y** secara otomatis agar entity tidak berpindah tempat di kanvas. |
| Size (px) | Vector2 | 100, 100 | Lebar (**W**) dan tinggi (**H**) entity dalam piksel (bawaan 160, 40 pada entity UI). Klik ikon kunci untuk menjaga rasio aspek tetap proporsional. |
| Scale | Vector2 | 1, 1 | Pengali skala horizontal (**X**) dan vertikal (**Y**). Ikon kunci aktif secara bawaan untuk perubahan skala yang seragam. |
| Flip | Boolean | false | Aktifkan **Horz** atau **Vert** untuk membalik tampilan entity terhadap sumbu pivotnya. |

Klik ikon 3 titik pada judul **Transform** atau **UI Transform** untuk action perataan cepat dan reset nilai.

| Action Menu | Deskripsi |
| --- | --- |
| Sync Transform | Tersedia pada instance [prefab](components/entities_and_prefabs). Mengembalikan ukuran, rotasi, skala, pivot, dan pembalikan ke nilai prefab master sambil mempertahankan posisi **X** dan **Y** di scene. |
| Reset Values / Reset Position | Mengembalikan posisi, rotasi, skala, pivot, dan pembalikan ke nilai bawaannya. |
| Center Anchors (UI only) | Mengatur **Anchor** ke titik tengah (0.5, 0.5) dan mengatur ulang **Position (Offset)** ke 0, 0. |
| Fit All Child to Me | Tersedia saat entity memiliki child. Mengubah ukuran lebar, tinggi, dan pivot parent agar membungkus seluruh child entity secara pas. |

> [!TIP]
> Tahan **Shift** saat menyeret titik pengubah ukuran di [Scene Viewport](interface/scene_viewport) untuk mengunci rasio aspek sementara.

## Contoh penggunaan {#usage-examples}

Gunakan grid **Anchor** pada **UI Transform** agar elemen HUD tetap menempel di tepi layar saat ukuran jendela game berubah.

:::steps
1. Di [Scene Hierarchy](interface/scene_hierarchy), klik kanan sebuah layer di bawah **User Interface**, arahkan kursor ke **Add UI Element**, lalu klik **UI Image**.
2. Di [Property Inspector](interface/property_inspector), temukan bagian **UI Transform**.
3. Klik titik kiri atas pada grid **Anchor** 3x3 (0, 0) dan atur **Pivot** ke kiri atas (0, 0).
4. Atur **Position (Offset)** ke **X: 20** dan **Y: 20**. Elemen tetap berjarak 20 piksel dari sudut kiri atas pada resolusi layar berapa pun.
:::

Gunakan **Fit All Child to Me** saat mengelompokkan beberapa sprite atau widget UI di dalam sebuah entity container kosong.

:::steps
1. Buat sebuah **Empty Entity**, lalu seret beberapa child entity ke dalamnya di **Scene Hierarchy**.
2. Pilih parent container entity tersebut.
3. Pada judul **Transform** (atau **UI Transform**), klik ikon 3 titik lalu pilih **Fit All Child to Me**. Bounding box parent menyesuaikan ukurannya untuk mencakup seluruh child-nya.
:::

## Scripting {#scripting}

Gunakan node di [Entity & Transform](node_library/game_entity) dan [Animation](node_library/game_animation) untuk membaca, mengubah, atau menganimasikan nilai transformasi saat game berjalan.

| Node | Deskripsi |
| --- | --- |
| [Get Transform](node_library/game_entity#node-getTransform) | Membaca posisi, rotasi, skala, ukuran, pembalikan, atau **Z-Index** dari sebuah entity. |
| [Set Transform](node_library/game_entity#node-setTransform) | Memperbarui posisi, rotasi, skala, ukuran, pembalikan, atau **Z-Index** pada sebuah entity. |
| [Move To](node_library/game_animation#node-tweenMoveTo) | Menganimasikan posisi entity secara halus menuju koordinat X dan Y tujuan selama durasi tertentu. |
| [Scale To](node_library/game_animation#node-tweenScaleTo) | Menganimasikan skala entity secara halus selama durasi tertentu. |
| [Rotate To](node_library/game_animation#node-tweenRotateTo) | Menganimasikan sudut rotasi entity dalam derajat secara halus. |
| [Resize To](node_library/game_animation#node-tweenResizeTo) | Menganimasikan lebar dan tinggi entity secara halus. |

## Masalah umum {#common-issues}

| Masalah | Solusi |
| --- | --- |
| Kolom input tinggi atau lebar pada **Size (px)** tidak bisa diubah | Saat [Text Renderer](components/renderers/text_renderer) mengaktifkan **Auto Line**, komponen tersebut mengatur tinggi secara otomatis. Saat [Tilemap](components/renderers/tilemap) terpasang, grid tilemap mengatur lebar sekaligus tinggi. |
| Entity berputar mengelilingi sudutnya, bukan titik tengahnya | Periksa grid **Pivot** 3x3 di bagian **Transform**, lalu klik titik tengah (0.5, 0.5). |
| Child entity tampil dengan sudut atau ukuran yang tidak sesuai | Child entity mengalikan rotasi dan skala lokalnya dengan transformasi parent-nya. Periksa informasi **World Rot** dan **World Scale** berwarna kuning di bawah kolom input. |

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Entity & Prefab](components/entities_and_prefabs) | Kamu ingin mengelompokkan entity atau menyimpannya sebagai prefab yang dapat dipakai ulang. |
| [Scene Viewport](interface/scene_viewport) | Kamu ingin memindahkan, mengubah ukuran, dan memutar entity menggunakan gizmo kanvas. |
| [Multi-Collider](components/multi_collider) | Kamu ingin bentuk collision yang mengikuti ukuran transformasi entity secara otomatis. |
| [Widget Interaktif](behaviour/ui/interactive_widgets) | Kamu ingin membuat tombol, slider, dan toggle switch UI yang memiliki anchor. |
