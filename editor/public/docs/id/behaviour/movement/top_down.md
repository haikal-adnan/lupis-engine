---
title: "Pergerakan Top-Down"
category: "Pergerakan"
description: "Bangun character controller top-down 8 arah lengkap dengan normalisasi kecepatan diagonal, sprint, bidikan mouse, dan animasi sesuai arah hadap."
---

## Gambaran umum {#overview}

Node [Top-Down Controller](node_library/helper_tool#node-topDownController) menangani pergerakan 8 arah pada sumbu X dan Y lengkap dengan normalisasi kecepatan diagonal serta sprint multiplier. Hubungkan outputnya ke [Top-Down Animator](node_library/helper_tool#node-topDownAnimator) untuk menggerakkan sprite karakter 4 arah, 8 arah, atau rotasi sudut.

:::features
- **Pergerakan 8 Arah**: Pergerakan horizontal, vertikal, dan diagonal yang halus dengan normalisasi otomatis.
- **Dukungan Sprint**: Menahan **Shift** (atau tombol sprint yang di-mapping) untuk melipatgandakan kecepatan gerak dan memicu **onSprint**.
- **Bidikan Mouse**: Mengaktifkan **faceMouse** untuk menghitung sudut dan arah hadap menuju posisi kursor.
- **Klip Sesuai Arah**: Berpindah di antara mode animasi **4-Way (Cardinal)**, **8-Way**, atau **Rotation**.
:::

## Persyaratan {#requirements}

Siapkan [entity](components/entities_and_prefabs) karaktermu untuk pergerakan 2D tanpa gravitasi pada bidang X dan Y.

| Persyaratan | Konfigurasi |
| --- | --- |
| [Physics Body](components/physics_body) | Atur **Motion Mode** ke **Top-Down** dan **Linear Drag** ke **5.00** atau lebih tinggi agar karakter berhenti dengan sigap (gravitasi otomatis bernilai 0). |
| [Multi-Collider](components/multi_collider) | Pasang collider kotak atau lingkaran **Solid (Physics)** yang diposisikan di sekitar kaki atau badan bagian bawah karakter. |
| [Image Renderer](components/renderers/sprite_renderer) dan [Sprite Animator](components/sprite_animator) | Buat klip animasi sesuai arah (seperti **idle_down**, **walk_down**, **walk_up**, **walk_side**) atau satu klip untuk mode rotasi. |
| [Script Controller](components/script_controller) | Pasang pada entity karakter untuk menjalankan script top-down. |

## Penyiapan {#setup}

Hubungkan **Top-Down Controller** dan **Top-Down Animator** di dalam sebuah visual script.

:::steps
1. Pilih entity karaktermu, periksa bagian **Physics Body** di [Property Inspector](interface/property_inspector), dan atur **Motion Mode** ke **Top-Down** (gravitasi otomatis dinonaktifkan).
2. Buka script karakter di editor [visual scripting](visual_scripting/graph_concepts), lalu tambahkan node [On Tick](node_library/game_lifecycle#node-eventTick).
3. Tambahkan node [Top-Down Controller](node_library/helper_tool#node-topDownController) dan node [Top-Down Animator](node_library/helper_tool#node-topDownAnimator) dari [Helper & Tool](node_library/helper_tool).
4. Hubungkan **execOut** pada **On Tick** ke **execIn** pada **Top-Down Controller**, serta **execOut** pada **Top-Down Controller** ke **execIn** pada **Top-Down Animator**.
5. Hubungkan **movementState**, **facingDirection**, dan **facingAngle** dari **Top-Down Controller** ke input yang sesuai pada **Top-Down Animator**.
6. Pilih **Top-Down Animator**, tentukan **Direction Mode** (**4-Way**, **8-Way**, atau **Rotation**), masukkan nama klip animasimu, lalu klik **Play** di [Scene Viewport](interface/scene_viewport).
:::

## Pengaturan {#settings}

Sesuaikan input berikut pada **Top-Down Controller** dan **Top-Down Animator** di bagian **Parameters**.

| Pengaturan | Nilai yang disarankan | Efek |
| --- | --- | --- |
| speed | 180 hingga 240 | Kecepatan berjalan dasar dalam satuan piksel per detik. |
| sprintMultiplier | 1.4 hingga 1.7 | Mengalikan **speed** selama tombol **keySprint** (bawaan **shift**) ditahan. |
| normalizeDiagonal | True | Mencegah pergerakan diagonal menjadi 41 persen lebih cepat dibandingkan pergerakan lurus. |
| faceMouse | False (RPG) / True (Shooter) | Saat diatur ke **True**, mengarahkan **facingDirection** dan **facingAngle** ke kursor mouse, bukan ke tombol arah gerak. |
| directionMode | 4way / 8way / rotation | Pada **Top-Down Animator**, menentukan apakah klip dipilih berdasarkan 4 arah mata angin, 8 arah, atau sudut rotasi sprite. |
| autoFlipX | True | Membalikkan animasi samping secara horizontal dengan otomatis saat berpindah antara **left** dan **right**. |

## Variasi {#variations}

Sesuaikan controller ini untuk game twin-stick shooter, suara langkah kaki, atau rumus akselerasi khusus.

| Variasi | Cara membuatnya |
| --- | --- |
| Twin-Stick Shooter / Bidikan Mouse | Atur **faceMouse** ke **True** pada **Top-Down Controller** dan atur **directionMode** ke **rotation** pada **Top-Down Animator** agar karakter berputar menghadap kursor sambil bergerak menggunakan **W**, **A**, **S**, dan **D**. |
| Debu atau Audio Langkah Kaki | Hubungkan output eksekusi **onMove** atau **onSprint** dari **Top-Down Controller** ke node [Cooldown](node_library/flow_logic#node-logicCooldown) yang diikuti oleh [Play Audio](node_library/system_utilities#node-playAudio). |
| Pergerakan Tingkat Dasar Khusus | Gabungkan [Calculate Axis 2D](node_library/input_controls#node-calculateAxis2d), [Set Face Direction](node_library/game_physics#node-setFaceDirection), dan [Move and Slide](node_library/game_physics#node-moveAndSlide) saat kamu menginginkan rumus akselerasi buatan sendiri. |

## Masalah umum {#common-issues}

| Masalah | Solusi |
| --- | --- |
| Karakter jatuh ke bagian bawah layar saat game dimulai | Atur **Motion Mode** ke **Top-Down** (atau **Gravity Scale** ke **0**) pada komponen **Physics Body** milik karakter. |
| Karakter bergerak lebih cepat saat berjalan miring dibandingkan lurus | Atur **normalizeDiagonal** ke **True** pada node **Top-Down Controller**. |
| Collider karakter tersangkut di celah pintu yang terlihat lebar | Perkecil **Size (px)** pada collider **Solid (Physics)** milik karakter agar hanya mencakup bagian setengah bawah (kaki) dari sprite. |

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Patroli & Gerak Dasar](behaviour/movement/basic_motion) | Kamu ingin menambahkan musuh AI yang berpatroli dan mengejar pemain top-down. |
| [Trigger & Hitbox](behaviour/physics_and_collision/triggers_and_hitboxes) | Kamu ingin menambahkan item collectable, zona interaksi, dan pertarungan. |
| [Sprite Animator](components/sprite_animator) | Kamu ingin memutar animasi berjalan dan diam 4 arah atau 8 arah. |
