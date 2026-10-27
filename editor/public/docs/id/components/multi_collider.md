---
title: "Multi-Collider"
category: "Komponen"
description: "Memasang satu atau beberapa bentuk collision pada satu entity. Gunakan Multi-Collider untuk menggabungkan batas fisika padat, zona trigger, hitbox serangan, dan hurtbox penerima serangan pada satu entity."
---

## Gambaran umum {#overview}

Komponen **Collider** di [Property Inspector](interface/property_inspector) mendukung beberapa bentuk collision independen pada satu [entity](components/entities_and_prefabs). Tanpa perlu membuat child entity tambahan, kamu bisa memberi satu karakter sebuah kapsul padat untuk berjalan, sebuah hurtbox untuk menerima serangan, dan sebuah hitbox bergeser untuk serangan jarak dekat.

:::features
- **Banyak Bentuk**: Menambahkan sebanyak mungkin collider bernama sesuai kebutuhan di dalam satu komponen **Collider**.
- **Empat Peran Collider**: Mengalihkan setiap bentuk di antara **Solid**, **Trigger**, **Hitbox**, dan **Hurtbox**.
- **Pembulatan Kapsul**: Menaikkan nilai **Corner Radius (Capsule)** untuk membulatkan sudut kotak agar pergerakan melewati tepi dan slope terasa mulus.
- **Balik dan Pas Otomatis**: Membalikkan posisi hitbox secara otomatis saat entity berbalik arah secara horizontal, atau mengunci ukuran mengikuti transformasi.
:::

## Tambahkan komponen {#add-the-component}

:::steps
1. Pilih sebuah entity di [Scene Hierarchy](interface/scene_hierarchy) atau [Scene Viewport](interface/scene_viewport).
2. Di [Property Inspector](interface/property_inspector), klik **Add Component...** di bawah **Actions**, lalu pilih **Collider**.
3. Untuk menambahkan bentuk lain pada entity yang sama, klik tombol 3 titik di samping dropdown **Attached Colliders**, lalu pilih **Add Collider**.
:::

> [!TIP]
> Untuk melihat wireframe collider di atas kanvas, tekan **Esc** untuk membersihkan pilihanmu, lalu centang **Show Collider Solid Bounds**, **Trigger Bounds**, **Hitbox Bounds**, atau **Hurtbox Bounds** di bawah **Quick Actions** pada **Property Inspector**.

## Properti {#properties}

Pilih sebuah bentuk dari dropdown **Attached Colliders** di bagian atas **Collider** untuk mengedit propertinya.

| Properti | Tipe | Bawaan | Deskripsi |
| --- | --- | --- | --- |
| Attached Colliders | String | col_solid_1 | Dropdown untuk memilih bentuk collider mana pada entity yang sedang kamu edit. |
| Script ID | String | col_solid_1 | Pengenal unik untuk bentuk ini agar visual script bisa menargetkannya berdasarkan nama. |
| Status | Boolean | Enabled | Mengalihkan **Enabled** atau **Disabled** khusus untuk bentuk collider ini. |
| Type | String | Solid (Physics) | Peran bentuk: **Solid (Physics)** menahan pergerakan, **Trigger (Zone)** mendeteksi overlap tanpa menahan laju, **Hitbox (Attack)** memberikan damage, dan **Hurtbox (Damage Zone)** menerima damage. |
| Offset (X, Y) | Vector2 | 0, 0 | Pergeseran posisi dalam piksel dari titik posisi entity. |
| Size (px) (W, H) | Vector2 | 32, 32 | Lebar (**W**) dan tinggi (**H**) kotak collider dalam piksel. |
| Corner Radius (Capsule) | Number | 0 | Membulatkan sudut kotak menjadi kapsul atau lingkaran (hingga setengah dari sisi terpendek). |
| Rotation & Pivot | Number | 0 (0, 0) | Rotasi lokal dalam derajat (0 hingga 359) dan titik pivot 3x3 untuk collider. |
| Fit to Transform Size & Rotation | Boolean | false | Mengunci ukuran, pergeseran, rotasi, dan pivot collider agar selalu mengikuti [Transform & UI Transform](components/transform) milik entity secara otomatis. |
| Lock World Rotation (Stay Upright) | Boolean | false | Menjaga collider tetap tegak di world-space meskipun entity berputar (cocok untuk karakter dengan perataan slope). |
| Auto Flip with Facing / flipX | Boolean | true | Membalikkan **Offset (X)** horizontal secara otomatis saat entity berbalik ke kiri atau ke kanan. |

## Contoh penggunaan {#usage-examples}

Siapkan karakter yang memiliki kapsul fisika padat sekaligus hitbox serangan di dalam komponen **Collider** yang sama.

:::steps
1. Pilih entity karaktermu dan tambahkan komponen **Collider**.
2. Biarkan **Script ID** collider pertama tetap **col_solid_1**, atur **Type** ke **Solid (Physics)**, dan naikkan nilai **Corner Radius (Capsule)** agar sudut bawahnya membulat.
3. Klik tombol 3 titik di samping **Attached Colliders**, lalu klik **Add Collider**.
4. Atur **Script ID** collider baru tersebut menjadi **col_sword_hitbox** dan ubah **Type** ke **Hitbox (Attack)**.
5. Atur **Offset** **X** ke **24** agar hitbox berada di depan karakter, dan biarkan **Auto Flip with Facing / flipX** tetap tercentang agar posisinya ikut berbalik saat karakter berputar arah.
:::

## Scripting {#scripting}

Gunakan node di [Physics & Collision](node_library/game_physics) dan [Helper & Tool](node_library/helper_tool) untuk mendeteksi collision, trigger, dan serangan berdasarkan **Script ID**.

| Node | Deskripsi |
| --- | --- |
| [Solid Collision](node_library/game_physics#node-solidCollision) | Memeriksa collision fisik terhadap collider **Solid (Physics)** dan tilemap padat. |
| [Trigger Zone](node_library/game_physics#node-triggerZone) | Memicu **onEnter**, **onStay**, dan **onExit** saat entity saling overlap dengan bentuk **Trigger**, **Hitbox**, atau **Hurtbox**. |
| [Manage Collider](node_library/game_physics#node-manageCollider) | Mengaktifkan, menonaktifkan, mengubah ukuran, atau memperbarui bentuk collider tertentu berdasarkan **Script ID** saat game berjalan. |
| [Raycast 2D](node_library/game_physics#node-raycast2D) | Menembakkan garis raycast untuk mendeteksi collider di sepanjang arah tertentu. |
| [Platformer Combat](node_library/helper_tool#node-platformerCombat) | Mengaktifkan collider **Hitbox** serangan selama kombo jarak dekat dan mendeteksi benturan terhadap bentuk **Hurtbox** musuh. |

## Masalah umum {#common-issues}

| Masalah | Solusi |
| --- | --- |
| Tidak bisa mengubah **Offset**, **Size (px)**, atau **Rotation** | **Fit to Transform Size & Rotation** sedang dicentang. Hapus centangnya untuk memasukkan dimensi atau pergeseran khusus. |
| Karakter tersangkut pada sambungan antartile lantai | Naikkan nilai **Corner Radius (Capsule)** pada collider **Solid (Physics)** milik karakter agar tepi bawahnya sedikit membulat. |
| Menghapus collider ikut menghapus seluruh bentuk pada entity | Gunakan menu 3 titik di samping dropdown **Attached Colliders** lalu klik **Remove Current** untuk menghapus bentuk yang sedang dipilih saja. Opsi **Remove All Colliders** pada judul bagian atas menghapus seluruh komponen. |

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Physics Body](components/physics_body) | Kamu ingin entity merespons gravitasi, kecepatan, dan solid collision. |
| [Trigger & Hitbox](behaviour/physics_and_collision/triggers_and_hitboxes) | Kamu ingin menyiapkan damage zone, item collectable, dan pertarungan jarak dekat. |
| [Fisika & Slope](behaviour/physics_and_collision/physics_and_slopes) | Kamu ingin pergerakan yang mulus di atas tanjakan dan bentuk slope. |
