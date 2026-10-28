---
title: "Variabel & Koleksi"
category: "Visual Scripting"
description: "Simpan dan bagikan data game menggunakan variabel Local dan Global, List berurutan, serta Map pasangan key-value. Kelola nilai di Variable Manager dan ikatkan ke node."
---

## Gambaran umum {#overview}

Variabel menyimpan data yang dibaca dan diperbarui oleh game saat berjalan, seperti HP pemain, skor, daftar inventaris, atau tabel dialog. Kamu mengelola variabel di panel **Variables** di sisi kiri workspace [visual scripting](visual_scripting/graph_concepts).

:::features
- **Scope Local dan Global**: Menyimpan data khusus untuk satu instance script (**Local**) atau membagikannya ke seluruh scene (**Global**).
- **List dan Map**: Menyusun nested array dan dictionary key-value secara visual atau menggunakan **Raw JSON Editor**.
- **Direct Port Binding**: Mengikat variabel langsung ke port input node dan menerapkan pengubah nilai tanpa node tambahan.
- **Override Inspector**: Menyesuaikan nilai variabel dasar **Local** per entity di inspector [Script Controller](components/script_controller).
:::

## Konsep utama {#key-concepts}

Setiap variabel memiliki **Scope** yang mengatur dari mana variabel tersebut bisa diakses dan **Type** yang menentukan jenis nilai yang disimpan.

| Scope | Masa Aktif dan Visibilitas | Override Inspector | Paling Cocok Untuk |
| --- | --- | --- | --- |
| Local | Terpisah untuk setiap entity yang menjalankan script tersebut. Diatur ulang saat entity atau scene ditutup. | Ya (Number, String, dan Boolean muncul di Script Controller) | Kecepatan gerak, jarak patroli musuh, HP entity, flag cooldown. |
| Global | Dipakai bersama di seluruh script dan scene di dalam proyek selama sesi game berlangsung. | Tidak (dikelola di Variable Manager) | Skor total, koin yang dikumpulkan, inventaris pemain, pengaturan audio, status misi. |

Lupis Engine mendukung tiga tipe data dasar dan dua tipe koleksi terstruktur.

| Tipe | Badge | Bawaan | Deskripsi |
| --- | --- | --- | --- |
| string | String | "" | Nilai teks seperti nama, baris dialog, tag, atau ID asset. |
| number | Number | 0 | Nilai angka untuk counter, timer, statistik, dan koordinat. |
| boolean | Boolean | false | Flag true atau false untuk status dan kondisi. |
| list | Array | [] | Daftar item berurutan dimulai dari indeks nol. Elemennya bisa berupa nilai dasar maupun list dan map bersarang. |
| map | Object | {} | Dictionary pasangan key-value yang diakses menggunakan key string. Nilainya bisa berupa nilai dasar atau koleksi bersarang. |

> [!NOTE]
> Centang kotak **Panel** pada baris variabel di **Variable Manager** untuk menampilkan variabel tersebut di sidebar kiri **Variables** agar lebih cepat diedit dan diseret ke kanvas.

## Cara kerja {#how-it-works}

Buat dan susun struktur variabelmu di modal **Variable Manager**, lalu seret atau ikatkan variabel tersebut ke dalam graph node.

:::steps
1. Buka sebuah tab script, lalu klik ikon slider **Manage Variables** pada judul panel **Variables**.
2. Pilih **Local** atau **Global** di sudut kiri atas **Variable Manager**, lalu klik **Add New Variable**.
3. Centang kotak **Panel** untuk menyematkan variabel ke sidebar, ketik **Variable Name**, lalu pilih **Type**.
4. Untuk **number**, **string**, atau **boolean**, ketik nilai awalnya secara langsung di kolom **Value / Structure**.
5. Untuk **list** atau **map**, klik **Configure LIST** atau **Configure MAP** untuk menambahkan item bersarang, atau klik ikon **Edit Raw JSON** di bagian judul untuk menempelkan array atau objek JSON.
6. Klik tombol tutup modal. Kamu bisa menempatkan variabel ke dalam kanvas graph dengan beberapa cara praktis:
   - **Dari Sidebar Variables**: Seret variabel ke atas kanvas sambil menahan **Ctrl** (untuk membuat **Get Variable**) atau **Alt** (untuk membuat **Set Variable**).
   - **Dari Variable Manager Modal**: Tekan **Ctrl + Double Click** pada baris variabel untuk membuat node **Get**, tekan **Alt + Double Click** untuk membuat node **Set**, atau buka menu 3 titik pada baris variabel lalu pilih **Add Get to Graph** atau **Add Set to Graph**.
:::

Kamu juga bisa mengikat variabel secara langsung ke port input node yang tidak terhubung di [Property Inspector](interface/property_inspector) atau memanipulasi koleksi menggunakan node dari [Collections & Data](node_library/data_collections).

| Metode / Node | Deskripsi |
| --- | --- |
| Switch to Variable (Port Toggle) | Klik ikon variabel di samping input mana pun di bagian **Parameters** untuk mengikat variabel secara langsung dan menerapkan pengubah seperti **Add (+)**, **Invert (NOT !)**, atau **Random Item**. |
| [Get Variable](node_library/system_utilities#node-variableGet) / [Set Variable](node_library/system_utilities#node-variableSet) | Membaca atau menulis variabel **Local** maupun **Global** di dalam graph. |
| [List Get](node_library/data_collections#node-listGet) / [List Set](node_library/data_collections#node-listSet) | Membaca atau memperbarui sebuah item pada indeks berbasis nol tertentu di dalam **List**. |
| [List Push](node_library/data_collections#node-listPush) / [List Remove At](node_library/data_collections#node-listRemoveAt) | Menambahkan item baru ke bagian akhir **List** atau menghapus item berdasarkan indeks. |
| [Map Get](node_library/data_collections#node-mapGet) / [Map Set](node_library/data_collections#node-mapSet) | Membaca atau memperbarui nilai yang terkait dengan key string di dalam **Map**. |
| [Get Value by Path](node_library/data_collections#node-getFromPath) / [Set Value by Path](node_library/data_collections#node-setFromPath) | Membaca atau menulis nilai bersarang di dalam **List** atau **Map** menggunakan dot notation atau bracket path seperti **player.stats.hp** atau **items[0].name**. |

> [!TIP]
> Saat kamu mengikat variabel **String** secara langsung ke port input sebuah node, ketik teks di sekeliling **{value}** pada kotak format (misalnya **Score: {value}**) untuk memformat string output secara langsung.

## Contoh {#example}

Buat variabel global **Score**, tambahkan 10 poin saat sebuah event dipicu, lalu tampilkan skor yang sudah diformat pada [Text Renderer](components/renderers/text_renderer).

:::steps
1. Buka **Variable Manager**, berpindah ke **Global**, lalu klik **Add New Variable**.
2. Centang **Panel**, beri nama variabel **Score**, atur **Type** ke **number**, dan atur nilainya ke **0**.
3. Tahan **Alt** dan seret **Score** dari panel **Variables** ke atas kanvas untuk membuat node **Set Score**.
4. Di bagian **Parameters** pada **Set Score**, klik **Switch to Variable** di samping **Value**, pilih **Score (Global)**, lalu terapkan pengubah **Add (+)** dengan nilai **10**.
5. Tambahkan node [Set Text](node_library/game_renderer#node-setText), hubungkan **execOut** dari **Set Score** ke **execIn** pada **Set Text**, dan atur **targetEntity** ke ID label skormu.
6. Pada node **Set Text**, klik **Switch to Variable** di samping **text**, pilih **Score (Global)**, lalu ketik **Score: {value}** di kolom format.
:::

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Konsep Graph & Node](visual_scripting/graph_concepts) | Kamu ingin mempelajari cara kerja node, port, dan wire eksekusi. |
| [Script Controller](components/script_controller) | Kamu ingin mengatur override variabel lokal pada masing-masing entity di dalam scene. |
| [Collections & Data](node_library/data_collections) | Kamu ingin melihat referensi lengkap untuk ke-20 node list, map, dan data path. |
| [UI Dinamis & Data Binding](behaviour/ui/dynamic_ui) | Kamu ingin mengikat variabel game ke health bar, counter, dan teks UI. |
| [Context System API](visual_scripting/context_system_api) | Kamu ingin membaca dan menulis variabel lokal atau global di dalam kode JavaScript khusus. |
