---
title: "Property Inspector"
category: "Antarmuka"
description: "Menampilkan pengaturan, tag, transformasi, dan komponen dari pilihan aktifmu. Gunakan Property Inspector untuk mengonfigurasi scene, layer, entity, dan override prefab."
---

## Gambaran umum {#overview}

**Property Inspector** berada di sisi kanan editor dan menyesuaikan tampilannya secara otomatis dengan item yang kamu pilih di [Scene Hierarchy](interface/scene_hierarchy) atau [Scene Viewport](interface/scene_viewport). Setiap perubahan yang kamu buat langsung memperbarui kanvas saat itu juga.

:::features
- **Kontekstual**: Berpindah antara pengaturan scene, pengaturan layer, dan komponen entity secara otomatis.
- **Komponen Modular**: Memasang renderer, fisika, collider, audio, dan script melalui **Add Component...**.
- **Sistem Multi-Tag**: Menetapkan beberapa tag pada sebuah entity dan mengubah nama tag di seluruh scene sekaligus.
- **Sinkronisasi Prefab**: Melacak badge **Sync** dan **Override** pada instance [prefab](components/entities_and_prefabs) serta memperbarui prefab master.
:::

## Tata letak {#layout}

**Property Inspector** berpindah di antara empat tampilan sesuai dengan pilihan aktifmu.

| Status Pilihan | Bagian yang Ditampilkan |
| --- | --- |
| Tidak ada yang dipilih | Menampilkan **Quick Actions** (tombol untuk **Show UI Bound**, **Show World Bounds**, dan wireframe collider) serta **Scene Properties** (**Background Color**). |
| Layer dipilih | Menampilkan bagian **Layer** yang berisi **ID**, **Z-Index**, **Appearance** (aktif, visibilitas, kunci), dan **Opacity**. |
| Satu entity dipilih | Menampilkan **Object**, [Transform & UI Transform](components/transform), seluruh bagian komponen yang terpasang, serta **Add Component...** di bawah **Actions**. |
| Beberapa entity dipilih | Menampilkan pesan **Multiple objects selected**. |

Saat kamu memilih sebuah entity, bagian identitas inti dan spasialnya muncul di paling atas, diikuti oleh seluruh komponen yang terpasang.

| Bagian / Kontrol | Deskripsi |
| --- | --- |
| Object | Mengatur **ID** unik entity, badge **Prefab** yang terhubung, pemilih multi-tag **Tag**, **Z-Index**, dan **Appearance** (**Active**, ikon mata visibilitas, serta ikon kunci). |
| Transform / UI Transform | Mengatur **Position**, **Rotation**, **Pivot**, **Size (px)**, **Scale**, **Flip**, dan (khusus elemen UI) grid **Anchor** 3x3. |
| Sync / Override Badge | Muncul pada instance [prefab](components/entities_and_prefabs). **Sync** (hijau) berarti bagian tersebut sama dengan prefab master; **Override** (kuning) berarti ada properti yang diubah di dalam scene. |
| Section Menu (3-dots) | Klik ikon 3 titik pada judul bagian mana pun untuk memilih **Reset Values**, **Remove Component**, **Sync Component**, atau **Apply to Master**. |
| Add Component... | Dropdown di bawah **Actions** untuk memasang [Visual Renderer](components/renderers), [Sprite Animator](components/sprite_animator), [Physics Body](components/physics_body), [Multi-Collider](components/multi_collider), [Audio Source](components/audio_source), atau [Script Controller](components/script_controller). |

> [!NOTE]
> Sebuah entity hanya bisa memiliki satu visual renderer pada satu waktu (**Image Renderer**, **Shape Renderer**, **Text Renderer**, atau **Tilemap**). Setelah salah satu dipasang, tiga renderer lainnya menampilkan keterangan **(Conflict)** di dalam **Add Component...**.

## Tugas umum {#common-tasks}

Tambahkan komponen di bagian bawah inspector untuk memberi tampilan visual, fisika, audio, atau script pada entity.

:::steps
1. Pilih sebuah entity di [Scene Hierarchy](interface/scene_hierarchy) atau [Scene Viewport](interface/scene_viewport).
2. Gulir ke bagian bawah **Property Inspector**, lalu klik **Add Component...** di bawah **Actions**.
3. Pilih komponen seperti **Physics Body** atau **Collider**. Bagian komponen tersebut muncul di inspector.
4. Untuk menghapus komponen, klik ikon 3 titik pada judul komponen tersebut, lalu klik **Remove Component**.
:::

Tetapkan satu atau beberapa tag di bagian **Object** agar script visualmu bisa mengenali atau mengelompokkan entity.

:::steps
1. Pilih sebuah entity dan temukan bagian **Object** di bagian atas **Property Inspector**.
2. Klik dropdown **Tag** (**Select tag...**), lalu pilih **Create New Tag...**.
3. Ketik nama tag (seperti **Player** atau **Enemy**) lalu konfirmasi. Tag tersebut muncul di daftar tag di atas dropdown.
4. Arahkan kursor ke tag yang sudah terpasang, lalu klik ikon tempat sampah untuk menghapusnya dari entity.
:::

Saat kamu mengubah nilai properti pada instance [prefab](components/entities_and_prefabs) (selain posisi X dan Y), badge bagian tersebut berubah dari **Sync** menjadi **Override**.

:::steps
1. Pilih instance prefab yang sudah dimodifikasi di dalam scene.
2. Pada judul bagian **Object**, klik ikon 3 titik.
3. Klik **Apply to Master** untuk menyimpan perubahan lokalmu ke prefab master dan memperbarui seluruh instance yang tersinkronisasi.
4. Sebagai alternatif, klik **Revert to Sync** untuk mengembalikan nilai dari prefab master sambil mempertahankan posisi entity saat ini.
:::

> [!WARNING]
> Kamu tidak bisa menambahkan atau menghapus komponen pada instance prefab yang terhubung di dalam scene. Edit prefab master melalui dock **Prefabs**, atau buka menu 3 titik pada **Object** lalu klik **Unpack Prefab** terlebih dahulu.

## Shortcut {#shortcuts}

Gunakan shortcut ini untuk membersihkan pilihan entity atau layer yang aktif dan kembali ke **Quick Actions** serta **Scene Properties**. Untuk seluruh shortcut editor, lihat [Referensi Shortcut](interface/shortcuts).

:::shortcuts
- `Esc`: Bersihkan pilihan aktif dan tampilkan pengaturan scene
:::

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Entity & Prefab](components/entities_and_prefabs) | Kamu ingin mempelajari cara kerja entity, prefab master, dan override. |
| [Transform & UI Transform](components/transform) | Kamu ingin mengatur posisi, pivot, ukuran, skala, dan anchor UI. |
| [Visual Renderer](components/renderers) | Kamu ingin menampilkan sprite, bentuk, teks, atau tilemap pada sebuah entity. |
| [Multi-Collider](components/multi_collider) | Kamu ingin memasang beberapa bentuk padat, trigger, hitbox, atau hurtbox pada satu entity. |
| [Script Controller](components/script_controller) | Kamu ingin memasang visual script dan mengatur override variabel lokal per entity. |
