---
title: "Fisika & Slope"
category: "Fisika & Collision"
description: "Atur collider kapsul, slope, perataan slope, dan medan padat agar karakter bisa mendaki bukit dan melewati sambungan tile dengan mulus."
---

## Gambaran umum {#overview}

Collider persegi panjang dengan sudut tajam dapat tersangkut pada sambungan antartile atau terhenti di kaki slope. Dengan menggabungkan pembulatan sudut kapsul pada [Multi-Collider](components/multi_collider), geometri vektor miring pada [Shape Renderer](components/renderers/shape_renderer), dan perataan slope pada [Physics Body](components/physics_body), karaktermu bisa berjalan mulus melintasi tile datar maupun perbukitan.

:::features
- **Kaki Kapsul**: Membulatkan sudut collider menggunakan **Corner Radius (Capsule)** agar meluncur mulus melewati sambungan tilemap dan peralihan slope.
- **Slope Poligon**: Menggambar medan miring di **Shape Renderer** dan mengaktifkan fisika **Solid** dengan satu klik.
- **Perataan Slope (Align to Slope)**: Memiringkan sprite karakter mengikuti sudut bukit secara otomatis menggunakan **Align to Slope**.
- **Pengunci Collider Tegak**: Menjaga collision box fisik tetap vertikal menggunakan **Lock World Rotation (Stay Upright)**.
:::

## Persyaratan {#requirements}

Kamu memerlukan sebuah [entity](components/entities_and_prefabs) karakter dan sebuah entity tanah miring di dalam layer **World** yang sama.

| Entity | Komponen yang Dibutuhkan |
| --- | --- |
| Entity Karakter | [Physics Body](components/physics_body) (**Platformer**), [Multi-Collider](components/multi_collider) (**Solid (Physics)**), dan movement controller seperti [Pergerakan Platformer](behaviour/movement/platformer). |
| Entity Slope / Tanjakan | [Shape Renderer](components/renderers/shape_renderer) dengan bentuk slope **Polygon** tertutup dan opsi **Solid** diaktifkan pada pengaturan **Physics** (atau collider kotak **Solid (Physics)** yang diputar). |

## Penyiapan {#setup}

Ikuti langkah berikut untuk membuat slope dan menyiapkan karaktermu agar bisa mendakinya dengan mulus.

:::steps
1. Buat sebuah entity slope di dalam layer **World**, pasang [Shape Renderer](components/renderers/shape_renderer), lalu klik **Edit Shape** di [Property Inspector](interface/property_inspector).
2. Tekan **G** untuk memilih alat **Polygon**, gambar bentuk segitiga atau slope, lalu tekan **Enter** untuk menerapkan bentuknya.
3. Di bagian **Shape Renderer** pada **Property Inspector**, centang **Solid** di bawah **Physics**.
4. Pilih entity karaktermu, buka bagian **Collider**, lalu naikkan nilai **Corner Radius (Capsule)** menjadi setengah dari lebar collider agar bagian bawahnya membentuk kapsul yang mulus.
5. Masih di bagian **Collider** milik karakter, centang **Lock World Rotation (Stay Upright)** agar collider fisik tidak pernah miring menancap ke dalam slope.
6. Di bagian **Physics Body** milik karakter, centang **Align to Slope**, atur **Max Slope (deg)** ke **60**, lalu klik **Play** di [Scene Viewport](interface/scene_viewport).
:::

## Pengaturan {#settings}

Sesuaikan properti berikut pada **Physics Body** dan **Collider** untuk mengatur bagaimana karakter menghadapi slope dan medan.

| Pengaturan | Nilai yang disarankan | Efek |
| --- | --- | --- |
| Corner Radius (Capsule) (Collider) | 8 hingga 16 (setengah lebar) | Membulatkan sudut collider agar karakter meluncur mulus ke atas slope dan melewati sambungan [Tilemap](components/renderers/tilemap). |
| Lock World Rotation (Stay Upright) (Collider) | Dicentang (true) | Menjaga batas solid collision tetap vertikal di world-space sementara sprite visual entity berputar mengikuti kemiringan permukaan. |
| Align to Slope (Physics Body) | Dicentang (true) | Memutar entity agar sejajar dengan kemiringan permukaan tanah di bawahnya. |
| Adapt Speed (Physics Body) | 10 hingga 15 | Mengatur seberapa cepat rotasi entity bertransisi saat memasuki atau meninggalkan slope. |
| Max Slope (deg) (Physics Body) | 45 hingga 60 | Kemiringan maksimum dalam derajat (5 hingga 89) yang bisa didaki oleh karakter tanpa tergelincir turun. |
| Gravity Scale (Physics Body) | 1.5 hingga 2.5 | Menjaga platform karakter tetap menapak kuat saat melewati puncak slope. |

## Variasi {#variations}

Gunakan node fisika dan collision dari [Physics & Collision](node_library/game_physics) untuk menyesuaikan perilaku karakter di berbagai jenis permukaan.

| Variasi | Cara membuatnya |
| --- | --- |
| Slope atau One-Way Platform | Tetapkan tag **platform** pada sebuah entity jembatan dan samakan nilai **oneWayTag** pada [Platformer Controller](node_library/helper_tool#node-platformerController) agar pemain bisa melompat menembus dari bawah atau turun dari atasnya. |
| Permukaan Es atau Lumpur | Deteksi tag permukaan menggunakan [Solid Collision](node_library/game_physics#node-solidCollision), lalu ubah **drag** atau **velocityX** saat game berjalan menggunakan [Set Physics Info](node_library/game_physics#node-setPhysics). |
| Raycast Tanah dan Tepi Jurang | Gunakan [Raycast 2D](node_library/game_physics#node-raycast2D) yang diarahkan ke bawah di depan musuh untuk mendeteksi tepi jurang atau turunan curam sebelum melangkah maju. |

## Masalah umum {#common-issues}

| Masalah | Solusi |
| --- | --- |
| Karakter tersangkut atau tersendat di kaki slope | Naikkan nilai **Corner Radius (Capsule)** pada collider **Solid (Physics)** milik karakter agar sudut kotak yang tajam tidak menabrak tepi awal slope. |
| Sprite karakter miring di atas slope lalu terjepit ke dalam lantai | Centang **Lock World Rotation (Stay Upright)** di bagian **Collider** milik karakter. |
| Karakter tidak sanggup mendaki slope yang curam | Naikkan nilai **Max Slope (deg)** di **Physics Body** hingga melebihi sudut kemiringan slope-mu. |

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Physics Body](components/physics_body) | Kamu ingin melihat referensi properti lengkap untuk Physics Body. |
| [Multi-Collider](components/multi_collider) | Kamu ingin mengatur radius kapsul, pergeseran posisi, dan pengunci rotasi tegak. |
| [Shape Renderer](components/renderers/shape_renderer) | Kamu ingin menggambar medan poligon khusus dan slope di Shape Editor. |
| [Pergerakan Platformer](behaviour/movement/platformer) | Kamu ingin menyiapkan gerakan berjalan, melompat, dan animasi pada karaktermu. |
