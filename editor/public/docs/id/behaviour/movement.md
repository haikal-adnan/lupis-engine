---
title: "Pergerakan"
category: "Perilaku"
description: "Bangun character controller 2D yang responsif, patroli musuh, dan moving platform menggunakan komponen fisika serta perangkat visual scripting di Lupis Engine."
---

## Gambaran umum {#overview}

Lupis Engine menyediakan node pergerakan siap pakai di [Helper & Tool](node_library/helper_tool) beserta kontrol kecepatan dan transformasi tingkat dasar di [Physics & Collision](node_library/game_physics). Pasangkan [Physics Body](components/physics_body) dan [Multi-Collider](components/multi_collider) dengan [Script Controller](components/script_controller) untuk menggerakkan karakter pemain, musuh AI, atau prop lingkungan.

> [!TIP]
> Gunakan mode gerak **Platformer (Side-Scroll)** atau **Top-Down** untuk karakter pemain, serta **Custom / Arcade** untuk moving platform agar posisinya tidak terdorong oleh gravitasi.

## Pilih halaman {#choose-a-page}

| Halaman | Gunakan saat |
| --- | --- |
| [Pergerakan Platformer](behaviour/movement/platformer) | Kamu ingin pergerakan berjalan menyamping, melompat, turun menembus one-way platform, dan animasi sprite yang mengikuti status gerak. |
| [Pergerakan Top-Down](behaviour/movement/top_down) | Kamu ingin pergerakan RPG 8 arah atau twin-stick shooter dengan normalisasi kecepatan diagonal, sprint, dan animasi sesuai arah hadap. |
| [Patroli & Gerak Dasar](behaviour/movement/basic_motion) | Kamu ingin moving platform, rintangan berayun, atau musuh AI yang berpatroli dan mengejar pemain. |

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Fisika & Collision](behaviour/physics_and_collision) | Kamu ingin mengatur medan padat, slope, trigger, dan hitbox pertarungan. |
| [Sprite Animator](components/sprite_animator) | Kamu ingin membuat klip animasi diam, berjalan, berlari, dan melompat. |
| [Physics Body](components/physics_body) | Kamu ingin mengonfigurasi skala gravitasi, hambatan gerak, dan perataan slope pada entity yang bergerak. |
| [Script Controller](components/script_controller) | Kamu ingin memasang graph logika dan menghubungkan node pergerakan ke entity. |
