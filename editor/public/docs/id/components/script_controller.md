---
title: "Script Controller"
category: "Komponen"
description: "Memasang satu atau beberapa visual script pada sebuah entity dan menampilkan variabel script lokal di inspector. Gunakan Script Controller untuk menjalankan logika game dan menyesuaikan nilai per entity."
---

## Gambaran umum {#overview}

Komponen **Script Controller** menghubungkan graph [visual scripting](visual_scripting/graph_concepts) dari panel **Scripts** ke sebuah [entity](components/entities_and_prefabs). Satu **Script Controller** bisa menjalankan beberapa script pada entity yang sama, dan setiap [variabel](visual_scripting/variables_and_collections) lokal yang dibuat di dalam script tersebut muncul langsung di [Property Inspector](interface/property_inspector) agar kamu bisa menyesuaikan nilainya untuk masing-masing instance entity.

:::features
- **Tumpukan Multi-script**: Memasang beberapa script modular (seperti pergerakan, combat, dan HP) pada satu entity.
- **Variabel Terbuka**: Menyesuaikan variabel script lokal seperti kecepatan atau kekuatan lompat langsung di inspector.
- **Override per Instance**: Mengubah nilai variabel pada masing-masing entity dan mengembalikannya ke nilai bawaan dengan satu klik.
- **Buka Graph Cepat**: Mengklik **Open Visual Script** untuk langsung membuka tab graph node.
:::

## Tambahkan komponen {#add-the-component}

:::steps
1. Pilih sebuah entity di [Scene Hierarchy](interface/scene_hierarchy) atau [Scene Viewport](interface/scene_viewport).
2. Di [Property Inspector](interface/property_inspector), klik **Add Component...** di bawah **Actions**, lalu pilih **Script Controller**.
3. Di bottom bar, klik **Scripts** untuk membuka panel **Scripts** (atau klik tombol 3 titik di samping **Attached Scripts** lalu pilih **Add Script...**).
4. Klik kanan sebuah script di panel **Scripts**, lalu pilih **Add to [Entity ID]**.
:::

## Properti {#properties}

Pilih script yang terpasang dari dropdown **Attached Scripts** di bagian **Script Controller** untuk mengelola status dan variabelnya.

| Properti / Kontrol | Tipe | Bawaan | Deskripsi |
| --- | --- | --- | --- |
| Attached Scripts | String | None | Dropdown berisi daftar seluruh visual script yang terpasang pada entity ini. Script yang aktif menampilkan tanda centang. |
| Script Options (3-dots) | Object | - | Menu di samping dropdown yang berisi **Add Script...** (membuka dock **Scripts**) dan **Remove Current** (melepas script yang sedang dipilih). |
| Active Status | Boolean | Active | Mengalihkan **Active** atau **Inactive** untuk mengaktifkan atau menjeda eksekusi script yang dipilih pada entity ini. |
| Source (Open Visual Script) | Object | - | Membuka graph node milik script yang dipilih di tab workspace. |
| Exposed Local Variables | Any | Script default | Menampilkan setiap variabel lokal (angka, boolean, atau string) yang didefinisikan di dalam script. Nilai yang diubah disorot dengan warna kuning dan menampilkan tombol atur ulang. |

> [!TIP]
> Klik ikon atur ulang berwarna kuning di samping variabel script yang sudah diubah untuk mengembalikan nilai bawaannya dari Variable Manager script tersebut.

## Contoh penggunaan {#usage-examples}

Gunakan satu script patroli yang sama pada beberapa musuh sekaligus sambil memberi kecepatan gerak yang berbeda untuk masing-masing musuh.

:::steps
1. Buka script musuh di editor graph, lalu buat variabel **Number** lokal bernama **MoveSpeed** dengan nilai bawaan **150**.
2. Pasang script tersebut ke dua entity musuh di dalam scene menggunakan **Script Controller**.
3. Pilih musuh kedua di [Scene Hierarchy](interface/scene_hierarchy).
4. Di bagian **Script Controller** pada [Property Inspector](interface/property_inspector), ubah nilai **MoveSpeed** menjadi **300**. Kolom input disorot dengan warna kuning, dan hanya musuh kedua tersebut yang bergerak lebih cepat.
:::

## Scripting {#scripting}

script yang dipasang pada **Script Controller** memulai eksekusinya dari node event [Scene & Lifecycle](node_library/game_lifecycle), input, atau sinyal, serta membaca maupun memperbarui variabel dari [Audio & System](node_library/system_utilities).

| Node | Deskripsi |
| --- | --- |
| [On Scene Start](node_library/game_lifecycle#node-eventSceneStart) | Dijalankan satu kali saat scene selesai dimuat. |
| [On Tick](node_library/game_lifecycle#node-eventTick) | Dijalankan pada setiap frame selama entity dan script berstatus aktif. |
| [Get Variable](node_library/system_utilities#node-variableGet) | Membaca nilai variabel lokal (termasuk override inspector per entity) atau variabel global. |
| [Set Variable](node_library/system_utilities#node-variableSet) | Memperbarui nilai variabel lokal atau global saat game berjalan. |
| [Emit Signal](node_library/system_utilities#node-actionEmitSignal) | Memancarkan event bernama ke script lain di dalam scene. |
| [On Signal Received](node_library/system_utilities#node-eventOnSignal) | Menjalankan logika saat sinyal dengan nama yang cocok diterima. |

## Masalah umum {#common-issues}

| Masalah | Solusi |
| --- | --- |
| **Add to [Entity]** tidak muncul saat mengklik kanan script | Pilih entity tujuan di **Scene Hierarchy** terlebih dahulu dan pastikan entity tersebut sudah memiliki komponen **Script Controller**. |
| Variabel dari script tidak muncul di **Script Controller** | Hanya variabel **Local** (Number, Boolean, dan String) yang ditampilkan pada inspector entity. Variabel **Global** dipakai bersama di seluruh proyek dan dikelola di [Variabel & Koleksi](visual_scripting/variables_and_collections). |
| Script yang terpasang tidak berjalan saat preview | Pastikan tombol **Active** milik entity di bagian **Object** dan **Active Status** milik script di **Script Controller** sama-sama diatur ke **Active**. |

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Konsep Graph & Node](visual_scripting/graph_concepts) | Kamu ingin mempelajari cara membuat script serta menghubungkan node eksekusi dan data. |
| [Variabel & Koleksi](visual_scripting/variables_and_collections) | Kamu ingin membuat variabel lokal, variabel global, list, dan map. |
| [Custom Node & Code Panel](visual_scripting/custom_node_and_code) | Kamu ingin menulis kode JavaScript khusus di dalam visual script. |
| [Overview & Architecture](node_library/overview) | Kamu ingin menjelajahi seluruh node bawaan di Node Library. |
