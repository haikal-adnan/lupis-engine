---
title: "Trigger & Hitbox"
category: "Fisika & Collision"
description: "Deteksi overlap area tanpa hambatan fisik, kumpulkan item, dan aktifkan hitbox pertarungan jarak dekat yang presisi per frame."
---

## Gambaran umum {#overview}

Trigger dan hitbox mendeteksi overlap tanpa menahan pergerakan fisik untuk kebutuhan checkpoint area, pengambilan item collectable, serta pertarungan jarak dekat atau proyektil.

:::features
- **Zona Trigger Berbasis Event**: Memicu event masuk, keluar, dan berada di dalam area setiap kali sebuah entity dengan tag target melewati batas trigger.
- **Item Collectable**: Menangani pengambilan item saat disentuh atau saat tombol ditekan lengkap dengan ayunan otomatis, efek suara, nilai skor, dan respawn terjadwal.
- **Hitbox Pertarungan Tersinkronisasi Frame**: Mengaktifkan hitbox serangan pada rentang frame animasi tertentu, merangkai kombo banyak pukulan, dan memberikan efek knockback.
:::

## Persyaratan {#requirements}

Pasang komponen berikut dan siapkan node yang dibutuhkan sebelum membuat zona trigger, item collectable, atau hitbox pertarungan.

| Persyaratan | Entity tujuan | Fungsi |
| --- | --- | --- |
| [Multi-Collider](components/multi_collider) | Zona Trigger dan Item Collectable | Menentukan area overlap dengan **Type** diatur ke **Trigger (Zone)** agar entity bisa melewatinya tanpa tertahan secara fisik. |
| [Physics Body](components/physics_body) | Pemain dan Musuh | Menggerakkan karakter dalam simulasi fisika dan menerima efek knockback saat pertarungan. |
| [Sprite Animator](components/sprite_animator) | Pemain, Musuh, dan Item Collectable | Memutar klip diam, pengambilan item, dan serangan bertahap yang disinkronkan dengan frame aktif hitbox. |
| [Script Controller](components/script_controller) | Zona, Item Collectable, atau Karakter | Menjalankan [Trigger Zone](node_library/game_physics#node-triggerZone), [Collectable Item](node_library/helper_tool#node-collectableItem), atau [Platformer Combat](node_library/helper_tool#node-platformerCombat). |

## Penyiapan {#setup}

Ikuti langkah berikut untuk mengatur zona trigger tanpa hambatan dan hitbox pertarungan jarak dekat beranimasi.

:::steps
1. Di [Scene Hierarchy](interface/scene_hierarchy), buat entity untuk checkpoint atau item collectable (klik kanan **World Layer** > **Add Entity** > **Sprite** atau **Shape**), lalu di [Property Inspector](interface/property_inspector) buka dropdown **Add Component...** di bawah **Actions**, pilih **Collider** ([Multi-Collider](components/multi_collider)), dan atur **Type** ke **Trigger (Zone)**.
2. Pilih entity pemain dan atur kolom **Tag** di bagian atas Property Inspector menjadi **player** agar node trigger bisa memfilter overlap.
3. Buka [Konsep Graph & Node](visual_scripting/graph_concepts) milik entity trigger, lalu hubungkan [On Tick](node_library/game_lifecycle#node-eventTick) ke [Trigger Zone](node_library/game_physics#node-triggerZone) dengan **Target Tag** diatur ke **player**.
4. Hubungkan output eksekusi **On Enter** dari **Trigger Zone** ke logika penyimpanan checkpoint, pemicu dialog, atau pengurangan HP akibat rintangan.
5. Untuk item collectable, ganti **Trigger Zone** dengan [Collectable Item](node_library/helper_tool#node-collectableItem), atur **Collector Tag** ke **player**, lalu hubungkan **On Collected** untuk memperbarui variabel skormu.
6. Untuk serangan jarak dekat, buka graph pemain, tambahkan [Platformer Combat](node_library/helper_tool#node-platformerCombat), lalu atur **Target Tag** ke **enemy** dan **Attack Key** ke **j**.
7. Hubungkan **On Hit** dari **Platformer Combat** ke [Apply Knockback](node_library/game_physics#node-applyKnockback) dengan meneruskan **Hit Target** sebagai entity tujuan agar musuh yang terkena serangan terkena knockback ke belakang.
:::

## Pengaturan {#settings}

Sesuaikan parameter berikut pada [Trigger Zone](node_library/game_physics#node-triggerZone), [Collectable Item](node_library/helper_tool#node-collectableItem), dan [Platformer Combat](node_library/helper_tool#node-platformerCombat) untuk mengatur deteksi overlap serta waktu serangan.

| Pengaturan | Nilai yang disarankan | Efek |
| --- | --- | --- |
| **Target Tag / Collector Tag** | player / enemy | Menyaring pengecekan overlap sehingga hanya entity dengan tag yang cocok yang dapat mengaktifkan trigger, item collectable, atau hitbox. |
| **Pickup Mode** | collision | Mengambil item secara langsung saat disentuh ketika diatur ke **collision**, atau menunggu tombol **Interact Key** (**e**) ditekan ketika diatur ke **interact_key**. |
| **Despawn Action** | destroy | Menentukan apakah item yang sudah diambil menghancurkan dirinya secara permanen, menjadi nonaktif selama **Respawn Time** detik, atau tetap aktif. |
| **Auto Bobbing** | true | Memberikan gerakan mengayun vertikal yang halus dan sedikit rotasi pada sprite item collectable saat diam. |
| **Attacks Config** | daftar darat dan udara | Menentukan klip animasi, nilai damage, pergeseran hitbox (**offsetX**, **offsetY**), ukuran (**width**, **height**), dan rentang frame aktif untuk setiap tahap kombo. |
| **Combo Buffer Time** | 0.35 | Rentang waktu dalam detik setelah satu serangan selesai sebelum counter kombo kembali ke pukulan pertama. |
| **Attack Cooldown** | 0.25 | Jeda waktu minimum dalam detik setelah rangkaian kombo berakhir sebelum karakter bisa memulai serangan baru. |

## Variasi {#variations}

Sesuaikan zona trigger dan hitbox untuk peti interaktif, serangan AI musuh, dan pengubahan ukuran collider saat game berjalan.

| Variasi | Konfigurasi |
| --- | --- |
| **Peti atau Pintu dengan Tombol Interaksi** | Pada [Collectable Item](node_library/helper_tool#node-collectableItem), atur **Pickup Mode** ke **interact_key**, **Interact Key** ke **e**, dan **Despawn Action** ke **none** agar menekan **E** memutar animasi peti terbuka. |
| **Serangan Jarak Dekat dan AI Agresif Musuh** | Hubungkan [Enemy Combat](node_library/helper_tool#node-enemyCombat) pada entity musuh untuk mendeteksi pemain di dalam radius agresif, memicu klip serangan, dan men-spawn hitbox damage yang tersinkronisasi. |
| **Mengubah Ukuran Collider Saat Game Berjalan** | Panggil [Manage Collider](node_library/game_physics#node-manageCollider) untuk mengubah ukuran, menggeser, atau menonaktifkan hitbox milik entity saat merunduk, meluncur, atau berada dalam status invulnerable sementara (iframe). |
| **Hit Impact dan Screen Shake** | Picu [Shake Transform](node_library/game_animation#node-actionShakeTransform) dari output **On Hit** milik [Platformer Combat](node_library/helper_tool#node-platformerCombat) untuk memberikan feedback benturan pada setiap pukulan. |

## Masalah umum {#common-issues}

| Masalah | Solusi |
| --- | --- |
| Pemain terpantul saat menyentuh zona trigger atau koin dan tidak bisa melewatinya | Pilih entity trigger atau koin tersebut, lalu atur **Type** pada [Multi-Collider](components/multi_collider) ke **Trigger (Zone)** agar mendeteksi overlap tanpa menahan laju fisik. |
| [Trigger Zone](node_library/game_physics#node-triggerZone) tidak pernah memicu **On Enter** | Pastikan nilai **Tag** milik entity yang masuk di [Property Inspector](interface/property_inspector) cocok dengan **Target Tag** dan kedua entity sama-sama memiliki collider yang aktif. |
| [Platformer Combat](node_library/helper_tool#node-platformerCombat) memutar animasi tetapi tidak memberikan damage | Periksa apakah musuh target memiliki tag yang sama persis dengan **Target Tag** (**enemy**) serta pastikan nilai **startFrame** dan **endFrame** di dalam **Attacks Config** berada dalam jumlah frame klip tersebut. |
| Hitbox serangan muncul di sisi yang salah saat pemain berbalik arah | Hubungkan output **Facing Direction** dari [Platformer Controller](node_library/helper_tool#node-platformerController) ke input **Facing Direction** pada **Platformer Combat**. |

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Fisika & Slope](behaviour/physics_and_collision/physics_and_slopes) | Kamu ingin mengatur solid collision, medan miring, dan one-way platform. |
| [Pergerakan Platformer](behaviour/movement/platformer) | Kamu ingin menghubungkan arah hadap horizontal dan status grounded (berpijak di tanah) ke dalam node pertarungan. |
| [Multi-Collider](components/multi_collider) | Kamu ingin mengonfigurasi peran collider, zona trigger, dan batas ukuran collider (bounds). |
| [Helper & Tool](node_library/helper_tool) | Kamu ingin melihat seluruh port untuk Collectable Item, Platformer Combat, dan Enemy Combat. |
