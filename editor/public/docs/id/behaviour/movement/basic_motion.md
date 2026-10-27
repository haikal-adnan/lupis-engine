---
title: "Patroli & Gerak Dasar"
category: "Pergerakan"
description: "Gerakkan platform, rintangan, dan musuh AI menggunakan Ping Pong Stepper, Enemy Chaser, Proximity Sensor, serta tween transformasi."
---

## Gambaran umum {#overview}

Tidak semua entity yang bergerak dikendalikan oleh input keyboard. Lupis Engine menyediakan [Ping Pong Stepper](node_library/helper_tool#node-pingPongStepper) untuk platform yang bergerak bolak-balik, [Enemy Chaser](node_library/helper_tool#node-enemyChaser) untuk musuh yang berpatroli dan mengejar pemain, serta node tween di [Animation](node_library/game_animation) untuk pergerakan terprogram.

:::features
- **Moving Platform Bolak-Balik**: Mengayunkan posisi entity di antara **minPos** dan **maxPos** pada sumbu X atau Y serta memicu **onBounce**.
- **Patroli dan Kejaran AI**: Berpatroli sejauh jarak tertentu dan langsung mengejar pemain bertag khusus di dalam jangkauan **detectRadius**.
- **Sensor Jarak**: Mendeteksi saat target masuk atau keluar dari radius tertentu menggunakan [Proximity Sensor](node_library/helper_tool#node-proximitySensor).
- **Tween Halus**: Menganimasikan posisi, rotasi, dan skala seiring waktu menggunakan **Move To**, **Rotate To**, dan **Scale To**.
:::

## Persyaratan {#requirements}

Pilih susunan komponen yang sesuai dengan jenis [entity](components/entities_and_prefabs) yang kamu buat, baik platform terprogram maupun musuh berbasis fisika.

| Tipe Entity | Komponen yang Dibutuhkan |
| --- | --- |
| Moving Platform / Rintangan | [Transform & UI Transform](components/transform), sebuah visual renderer, [Script Controller](components/script_controller), dan [Multi-Collider](components/multi_collider) (ditambah [Physics Body](components/physics_body) **Custom / Arcade** untuk moving platform padat). |
| Musuh Patroli / Pengejar | **Physics Body** (**Platformer** atau **Top-Down**), **Multi-Collider** (**Solid**), **Script Controller**, serta sebuah entity pemain di dalam scene yang memiliki tag **player**. |

## Penyiapan {#setup}

Bangun platform yang bergerak bolak-balik menggunakan **Ping Pong Stepper** dan sebuah variabel arah lokal.

:::steps
1. Buka script platform di editor [visual scripting](visual_scripting/graph_concepts), lalu buat variabel **number** **Local** bernama **Dir** dengan nilai bawaan **1** di [Variabel & Koleksi](visual_scripting/variables_and_collections).
2. Tambahkan node [On Tick](node_library/game_lifecycle#node-eventTick) dan hubungkan pin **execOut** miliknya ke node [Ping Pong Stepper](node_library/helper_tool#node-pingPongStepper).
3. Pada **Ping Pong Stepper**, atur **targetEntity** ke **self**, **axis** ke **X Axis (Horizontal)**, **minPos** ke **100**, **maxPos** ke **400**, dan **speed** ke **2**.
4. Di [Property Inspector](interface/property_inspector), klik **Switch to Variable** di samping **direction** pada **Ping Pong Stepper**, lalu ikatkan variabel **Dir (Local)** milikmu.
5. Tahan **Alt** dan seret **Dir** ke atas kanvas untuk membuat node **Set Dir**, hubungkan **onBounce** dari **Ping Pong Stepper** ke **execIn** pada **Set Dir**, lalu sambungkan **nextDirection** ke **Value**.
6. Pasang script ke entity platform-mu, lalu klik **Play** di [Scene Viewport](interface/scene_viewport) untuk melihatnya bergerak bolak-balik di antara X 100 dan X 400.
:::

Untuk menyiapkan musuh AI yang berpatroli dan mengejar pemain, gunakan **Enemy Chaser**:

:::steps
1. Tetapkan tag **player** pada entity pemainmu di bagian **Object** pada **Property Inspector**.
2. Di dalam script musuh, hubungkan **On Tick** ke [Enemy Chaser](node_library/helper_tool#node-enemyChaser).
3. Atur **playerTag** ke **player**, **detectRadius** ke **250**, **chaseSpeed** ke **160**, dan **patrolDistance** ke **100**.
4. Sebagai opsi tambahan, hubungkan **movementState** dan **facingDirection** dari **Enemy Chaser** ke [Platformer Animator](node_library/helper_tool#node-platformerAnimator) atau [Top-Down Animator](node_library/helper_tool#node-topDownAnimator).
:::

## Pengaturan {#settings}

Sesuaikan parameter berikut pada **Ping Pong Stepper** dan **Enemy Chaser**.

| Pengaturan | Nilai yang disarankan | Efek |
| --- | --- | --- |
| minPos / maxPos (Ping Pong Stepper) | 100 / 400 | Koordinat dunia minimum dan maksimum di sepanjang sumbu **axis** yang dipilih (**x** atau **y**). |
| speed (Ping Pong Stepper) | 1 hingga 5 | Nilai langkah posisi yang ditambahkan pada setiap frame di sepanjang sumbu yang dipilih. |
| detectRadius / loseRadius (Enemy Chaser) | 250 / 350 | Jarak dalam piksel saat musuh mulai mengejar pemain dan saat musuh berhenti mengejar. |
| stopRadius (Enemy Chaser) | 40 hingga 60 | Jarak dari pemain saat musuh berhenti bergerak dan memicu **onInAttackRange**. |
| chaseSpeed / patrolSpeed (Enemy Chaser) | 160 / 70 | Kecepatan gerak dalam piksel per detik saat mengejar dibandingkan saat berpatroli. |
| patrolDistance (Enemy Chaser) | 100 | Jarak dalam piksel yang ditempuh musuh dari titik awalnya sebelum berbalik arah. |

## Variasi {#variations}

Gabungkan node pergerakan dengan tween dan sensor untuk membuat desain level yang lebih interaktif.

| Variasi | Cara membuatnya |
| --- | --- |
| Pintu atau Lift Satu Kali Jalan | Picu [Move To](node_library/game_animation#node-tweenMoveTo) saat sakelar atau [Trigger Zone](node_library/game_physics#node-triggerZone) aktif, lalu pilih penghalusan **Smooth (Ease In-Out)**. |
| Serangan Musuh Saat Dalam Jangkauan | Hubungkan pin eksekusi **onInAttackRange** dari **Enemy Chaser** ke [Enemy Combat](node_library/helper_tool#node-enemyCombat) agar musuh menyerang saat berhasil mendekati pemain. |
| Alert Turret atau Trap | Gunakan [Proximity Sensor](node_library/helper_tool#node-proximitySensor) untuk memicu **onDetected** saat pemain memasuki **radius** tanpa memindahkan entity sensor itu sendiri. |

## Masalah umum {#common-issues}

| Masalah | Solusi |
| --- | --- |
| **Ping Pong Stepper** berhenti di **maxPos** dan tidak berbalik arah | Hubungkan output **nextDirection** ke sebuah variabel lokal pada saat **onBounce**, lalu ikatkan variabel tersebut ke input **direction** agar arah yang sudah dibalik tetap tersimpan lintas frame. |
| **Enemy Chaser** tidak pernah mendeteksi pemain | Pastikan entity pemainmu memiliki tag yang sama persis dengan nilai **playerTag** (bawaan **player**) di bagian **Object** pada **Property Inspector**. |

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Pergerakan Platformer](behaviour/movement/platformer) | Kamu ingin membuat karakter pemain yang bergerak menyamping. |
| [Pergerakan Top-Down](behaviour/movement/top_down) | Kamu ingin membuat karakter pemain top-down 8 arah. |
| [Trigger & Hitbox](behaviour/physics_and_collision/triggers_and_hitboxes) | Kamu ingin menambahkan serangan jarak dekat musuh, hurtbox, dan zona bahaya. |
