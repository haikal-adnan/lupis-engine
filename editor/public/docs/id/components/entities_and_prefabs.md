---
title: "Entity & Prefab"
category: "Komponen"
description: "Setiap item di dalam scene adalah sebuah entity yang dikonfigurasi melalui komponen modular. Prefab menyimpan entity beserta child-nya sebagai template yang dapat dipakai ulang lintas scene."
---

## Gambaran umum {#overview}

**Entity** adalah elemen penyusun di dalam scene milikmu, seperti pemain, musuh, tilemap, atau tombol user interface (UI). Setiap entity memiliki bagian identitas **Object** dan komponen [Transform & UI Transform](components/transform), lalu kamu bisa memasang komponen tambahan di [Property Inspector](interface/property_inspector) untuk memberinya tampilan visual, fisika, audio, atau logika.

**Prefab** adalah template entity yang bisa dipakai ulang dan disimpan di panel **Prefabs** pada bottom dock. Saat kamu memperbarui prefab master, seluruh instance yang tersinkronisasi di dalam scene ikut diperbarui secara otomatis.

:::features
- **Identitas Object**: Setiap entity memiliki **ID** unik, **Z-Index**, serta status aktif dan visibilitas.
- **Sistem Multi-Tag**: Menetapkan beberapa tag pada sebuah entity agar script bisa menyaring atau mengelompokkan target.
- **Prefab Master**: Mengubah entity tree yang sudah dikonfigurasi menjadi template **World** atau **UI** yang dapat dipakai ulang.
- **Override Langsung**: Menyesuaikan instance prefab satu per satu dan menyimpan atau mengembalikan perubahan kapan saja.
:::

## Buat entity dan prefab {#create-entities-and-prefabs}

Kamu bisa membuat entity dari [Scene Hierarchy](interface/scene_hierarchy) atau langsung di [Scene Viewport](interface/scene_viewport), lalu mengubahnya menjadi prefab untuk dipakai ulang.

:::steps
1. Di **Scene Hierarchy**, klik kanan sebuah baris layer **World** atau **User Interface**.
2. Arahkan kursor ke **Add Entity** (atau **Add UI Element**), lalu pilih template seperti **Sprite**, **Shape**, **Text**, atau **Empty Entity**.
3. Di [Property Inspector](interface/property_inspector), atur pengaturan **Object**, transformasi, dan komponen milik entity tersebut.
4. Klik kanan entity tersebut di **Scene Hierarchy**, lalu klik **Use as Prefab**.
5. Ketik nama prefab, lalu klik **Create**. Ikon entity berubah menjadi kotak biru dan template-nya muncul di dock **Prefabs**.
:::

> [!TIP]
> Untuk men-spawn salinan (instance) baru dari sebuah prefab, buka tab **Prefabs** di bottom dock, klik kanan prefab tersebut, lalu pilih **Instantiate to...**.

## Properti {#properties}

Setiap entity menampilkan bagian **Object** di bagian paling atas [Property Inspector](interface/property_inspector).

| Properti | Tipe | Bawaan | Deskripsi |
| --- | --- | --- | --- |
| ID | String | entity_1 | Pengenal unik yang dipakai untuk merujuk ke entity ini di dalam visual script. |
| Prefab | String | None | Menampilkan nama prefab master yang terhubung pada instance prefab, beserta tombol untuk membuka prefab master tersebut. |
| Tag | Array | [] | Daftar tag proyek yang ditetapkan pada entity. Pilih **Create New Tag...** di dropdown untuk menambahkan tag baru. |
| Z-Index | Number | 0 | Urutan render di dalam layer entity. Angka yang lebih besar dirender di depan angka yang lebih kecil. |
| Active | Boolean | true | Mengaktifkan atau menonaktifkan entity beserta script dan fisikanya saat game berjalan. |
| Visibility (Eye) | Boolean | true | Menampilkan atau menyembunyikan entity di viewport dan saat game berjalan. |
| Lock | Boolean | false | Mengunci entity agar tidak terpilih atau tergeser secara tidak sengaja di atas kanvas. |

Saat sebuah entity terhubung ke prefab, setiap judul bagian di inspector menampilkan badge **Sync** (hijau) atau **Override** (kuning). Buka menu 3 titik pada judul **Object** untuk mengelola link prefab.

| Action Prefab | Deskripsi |
| --- | --- |
| Apply to Master | Menyimpan seluruh override properti lokal pada instance ini kembali ke prefab master dan memperbarui semua instance yang tersinkronisasi. |
| Revert to Sync | Mengembalikan seluruh komponen, tag, dan status ke nilai bawaan prefab master sambil mempertahankan posisi X dan Y instance saat ini. |
| Sync Component | Tersedia di menu 3 titik pada masing-masing komponen. Mengembalikan komponen tersebut saja ke nilai prefab master. |
| Unpack Prefab | Memutus link ke prefab master dan mengubah instance menjadi entity mandiri (standalone) biasa. |

## Contoh penggunaan {#usage-examples}

Gunakan tag dan prefab secara bersamaan saat kamu membuat item game yang berulang seperti koin, musuh, atau proyektil.

:::steps
1. Buat sebuah entity **Sprite** dan beri nama **ID** **Enemy_Slime**.
2. Di bagian **Object**, buka dropdown **Tag**, klik **Create New Tag...**, lalu tambahkan tag **Enemy**.
3. Pasang [Physics Body](components/physics_body), [Multi-Collider](components/multi_collider), dan [Script Controller](components/script_controller).
4. Klik kanan **Enemy_Slime** di [Scene Hierarchy](interface/scene_hierarchy), lalu klik **Use as Prefab**.
5. Spawn beberapa instance di berbagai titik level dari dock **Prefabs**. Pindahkan setiap instance dengan bebas tanpa mengubah status **Sync**.
:::

## Scripting {#scripting}

Gunakan node di [Entity & Transform](node_library/game_entity) untuk men-spawn prefab, mengelola lifecycle entity, dan memeriksa tag saat game berjalan.

| Node | Deskripsi |
| --- | --- |
| [Spawn Prefab](node_library/game_entity#node-entitySpawn) | Men-spawn instance prefab baru pada posisi dan layer tertentu saat game berjalan. |
| [Clone Entity](node_library/game_entity#node-entityClone) | Menggandakan entity yang sudah ada di dalam scene aktif. |
| [Destroy Entity](node_library/game_entity#node-entityDestroy) | Menghapus entity dari scene. |
| [Get Object Info](node_library/game_entity#node-getObject) | Membaca **ID**, tag, status aktif, atau visibilitas milik sebuah entity. |
| [Set Object Info](node_library/game_entity#node-setObject) | Mengubah tag, status aktif, atau visibilitas sebuah entity saat game berjalan. |
| [Entity Has Tag](node_library/game_entity#node-entityHasTag) | Memeriksa apakah sebuah entity memiliki tag tertentu. |
| [Find Closest By Tag](node_library/game_entity#node-findClosestByTag) | Mencari entity aktif terdekat yang memiliki tag yang cocok. |

## Masalah umum {#common-issues}

| Masalah | Solusi |
| --- | --- |
| Tidak bisa menambahkan atau menghapus komponen pada instance prefab | Instance prefab mengunci daftar komponennya agar selalu sesuai dengan prefab master. Edit prefab master dari dock **Prefabs**, atau klik menu 3 titik pada **Object** lalu pilih **Unpack Prefab**. |
| Memindahkan instance prefab tidak menampilkan badge **Override** | Perilaku ini memang disengaja. **Position** (**X** dan **Y**) di dalam scene dikecualikan dari override prefab agar kamu bisa menempatkan instance di mana saja di dalam level. |
| **Use as Prefab** tidak aktif di menu konteks | Entity tersebut sudah menjadi instance prefab atau merupakan child entity di dalam hierarki prefab. Lepaskan link parent prefab terlebih dahulu atau pilih parent entity yang belum terhubung. |

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Scene Hierarchy](interface/scene_hierarchy) | Kamu ingin mengelompokkan entity ke dalam layer dan struktur parent-child tree. |
| [Property Inspector](interface/property_inspector) | Kamu ingin memeriksa bagian entity, tag, dan menu komponen. |
| [Transform & UI Transform](components/transform) | Kamu ingin mengatur posisi, skala, rotasi, atau anchor entity. |
| [Visual Renderer](components/renderers) | Kamu ingin menampilkan sprite, bentuk, teks, atau tilemap pada sebuah entity. |
