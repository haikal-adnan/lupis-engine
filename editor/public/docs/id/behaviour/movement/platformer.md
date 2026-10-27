---
title: "Pergerakan Platformer"
category: "Pergerakan"
description: "Buat karakter platformer 2D yang responsif lengkap dengan lari horizontal, lompatan, turun menembus one-way platform, dan animasi yang tersinkronisasi."
---

## Gambaran umum {#overview}

Node [Platformer Controller](node_library/helper_tool#node-platformerController) memberi karaktermu kemampuan bergerak menyamping, deteksi ground platform, lompatan, dan turun menembus one-way platform di dalam satu node. Pasangkan node ini dengan [Platformer Animator](node_library/helper_tool#node-platformerAnimator) untuk berpindah di antara klip diam, berlari, melompat, dan jatuh serta membalik arah sprite secara otomatis.

:::features
- **Berjalan dan Melompat**: Kecepatan horizontal dan dorongan lompat vertikal yang responsif lengkap dengan pemeriksaan ground platform.
- **Drop-Through One-Way Platform**: Menahan tombol **Down** dan menekan **Jump** di atas platform bertag khusus untuk turun menembusnya.
- **Pin Pemicu Event**: Memicu efek suara atau partikel dari pin **onJump**, **onLand**, dan **onDrop**.
- **Animasi Otomatis**: Menyinkronkan **movementState** dan **facingDirection** langsung ke **Platformer Animator**.
:::

## Persyaratan {#requirements}

Sebelum menyusun script, siapkan [entity](components/entities_and_prefabs) pemain dan ground platform di dalam scene.

| Persyaratan | Konfigurasi |
| --- | --- |
| [Image Renderer](components/renderers/sprite_renderer) dan [Sprite Animator](components/sprite_animator) | Pasang keduanya pada entity pemain dan buat klip animasi seperti **idle**, **run**, **jump**, dan **fall**. |
| [Physics Body](components/physics_body) | Pasang pada entity pemain dengan **Motion Mode** diatur ke **Platformer (Side-Scroll)** dan **Gravity Scale** diatur di antara **1.5** dan **2.5**. |
| [Multi-Collider](components/multi_collider) | Pasang collider **Solid (Physics)** pada pemain (naikkan nilai **Corner Radius (Capsule)** agar kaki karakter tidak tersangkut pada sambungan tile) serta pada lantai atau [Tilemap](components/renderers/tilemap). |
| [Script Controller](components/script_controller) | Pasang pada entity pemain untuk menjalankan visual script platformer. |

## Penyiapan {#setup}

Hubungkan node controller dan animator di dalam script pemainmu.

:::steps
1. Buka script pemain di editor [visual scripting](visual_scripting/graph_concepts), lalu tambahkan node [On Tick](node_library/game_lifecycle#node-eventTick).
2. Tambahkan node [Platformer Controller](node_library/helper_tool#node-platformerController) dan node [Platformer Animator](node_library/helper_tool#node-platformerAnimator) dari [Helper & Tool](node_library/helper_tool).
3. Hubungkan **execOut** pada **On Tick** ke **execIn** pada **Platformer Controller**, lalu hubungkan **execOut** pada **Platformer Controller** ke **execIn** pada **Platformer Animator**.
4. Hubungkan output data **movementState** dan **facingDirection** dari **Platformer Controller** ke input yang sesuai pada **Platformer Animator**.
5. Pilih **Platformer Animator**, lalu ketik nama klip milikmu pada **idleClips**, **runClips**, **jumpClips**, dan **fallClips** di [Property Inspector](interface/property_inspector).
6. Pasang script ke entity pemain, lalu klik **Play** di [Scene Viewport](interface/scene_viewport) untuk menguji gerakan berlari dan melompat menggunakan **A**, **D**, dan **Space**.
:::

## Pengaturan {#settings}

Sesuaikan nilai input berikut pada **Platformer Controller** dan **Platformer Animator** agar sesuai dengan rasa kendali game milikmu.

| Pengaturan | Nilai yang disarankan | Efek |
| --- | --- | --- |
| speed | 220 hingga 300 | Kecepatan gerak horizontal dalam satuan piksel per detik. |
| jumpForce | 480 hingga 600 | Kecepatan ke atas yang diberikan saat melompat. Pasangkan dengan nilai **Gravity Scale** yang lebih tinggi pada **Physics Body** agar lompatan terasa sigap. |
| keyLeft / keyRight / keyJump / keyDown | a / d / space / s | Tombol keyboard untuk bergerak ke kiri, bergerak ke kanan, melompat, dan merunduk atau turun dari platform. |
| oneWayTag | platform | Tag entity yang menandai one-way platform yang bisa ditembus ke bawah saat pemain menekan **keyDown** dan **keyJump**. |
| dropNudge | 6 | Pergeseran piksel ke arah bawah yang diterapkan saat turun menembus one-way platform. |
| autoFlipX | True | Pada **Platformer Animator**, membalikkan sprite secara horizontal dengan otomatis saat **facingDirection** bernilai **left**. |

## Variasi {#variations}

Kembangkan penyiapan dasar platformer dengan kamera yang mengikuti pemain, audio feedback, atau pertarungan jarak dekat.

| Variasi | Cara membuatnya |
| --- | --- |
| Kamera Mengikuti Secara Halus | Hubungkan node [On Scene Start](node_library/game_lifecycle#node-eventSceneStart) ke [Camera Follow](node_library/game_renderer#node-actionCameraFollow) dan atur **targetEntity** ke ID pemainmu. |
| Efek Suara Lompat dan Mendarat | Hubungkan pin eksekusi **onJump** dan **onLand** pada **Platformer Controller** ke node [Play Audio](node_library/system_utilities#node-playAudio). |
| Serangan Kombo Jarak Dekat | Rangkaikan [Platformer Combat](node_library/helper_tool#node-platformerCombat) setelah **Platformer Controller**, lalu hubungkan **facingDirection** dan **isGrounded** ke dalamnya. Lihat [Trigger & Hitbox](behaviour/physics_and_collision/triggers_and_hitboxes). |

## Masalah umum {#common-issues}

| Masalah | Solusi |
| --- | --- |
| Karakter tidak bisa melompat meskipun tombol **Space** ditekan | Pastikan ground platform memiliki collider **Solid (Physics)** sehingga **isGrounded** bernilai **true** saat pemain mendarat. |
| Karakter tersangkut pada sambungan tilemap yang rata saat berjalan | Pilih collider **Solid (Physics)** milik pemain di **Multi-Collider**, lalu naikkan nilai **Corner Radius (Capsule)** ke **4** atau lebih tinggi. |
| Lompatan terasa melayang dan lambat | Naikkan **Gravity Scale** pada **Physics Body** pemain ke **2.0** atau **2.5**, lalu naikkan **jumpForce** pada **Platformer Controller** untuk menyeimbangkannya. |

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Fisika & Slope](behaviour/physics_and_collision/physics_and_slopes) | Kamu ingin karakter platformer berjalan naik dan turun di atas slope dengan mulus. |
| [Trigger & Hitbox](behaviour/physics_and_collision/triggers_and_hitboxes) | Kamu ingin menambahkan koin, rintangan, dan pertarungan jarak dekat ke dalam game platformer. |
| [Physics Body](components/physics_body) | Kamu ingin menyesuaikan linear drag, gravity scale, dan pengaturan slope. |
| [Sprite Animator](components/sprite_animator) | Kamu ingin memutar klip animasi lari, melompat, jatuh, dan menyerang yang sesuai. |
