---
title: "Fisika & Collision"
category: "Perilaku"
description: "Atur medan padat, slope, collider kapsul, zona trigger, dan hitbox pertarungan di Lupis Engine."
---

## Gambaran umum {#overview}

Lupis Engine memisahkan collision fisik yang menahan laju dari deteksi overlap non-fisik agar kamu bisa membangun pergerakan medan yang mulus sekaligus sistem pertarungan yang responsif pada [entity](components/entities_and_prefabs) yang sama. Gabungkan [Physics Body](components/physics_body) dan [Multi-Collider](components/multi_collider) dengan node di [Physics & Collision](node_library/game_physics) serta [Helper & Tool](node_library/helper_tool).

> [!NOTE]
> Tekan **Esc** di [Scene Viewport](interface/scene_viewport) dan aktifkan tombol batas collider di bawah **Quick Actions** pada [Property Inspector](interface/property_inspector) untuk melihat wireframe collider padat, trigger, hitbox, dan hurtbox saat mengedit.

## Pilih halaman {#choose-a-page}

| Halaman | Gunakan saat |
| --- | --- |
| [Fisika & Slope](behaviour/physics_and_collision/physics_and_slopes) | Kamu ingin karakter berjalan mulus melewati sambungan tile, mendaki slope, dan menyesuaikan kemiringan tubuh dengan permukaan medan. |
| [Trigger & Hitbox](behaviour/physics_and_collision/triggers_and_hitboxes) | Kamu ingin membuat item collectable, zona bahaya, checkpoint, serta pertarungan jarak dekat antara hitbox dan hurtbox. |

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Physics Body](components/physics_body) | Kamu ingin melihat referensi lengkap seluruh properti dan mode gerak Physics Body. |
| [Multi-Collider](components/multi_collider) | Kamu ingin memasang beberapa bentuk collider pada satu entity. |
| [Pergerakan](behaviour/movement) | Kamu ingin menyiapkan controller platformer, top-down, atau patroli AI. |
