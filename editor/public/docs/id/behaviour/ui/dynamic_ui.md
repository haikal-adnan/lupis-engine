---
title: "UI Dinamis & Data Binding"
category: "User Interface (UI)"
description: "Ikatkan variabel langsung ke teks HUD, animasikan fill bar, dan spawn grid inventaris dengan data binding."
---

## Gambaran umum {#overview}

Antarmuka pengguna (UI) dinamis dan data binding menjaga label HUD, health bar, serta grid inventaris tetap tersinkronisasi dengan variabel dan koleksi game secara langsung.

:::features
- **Interpolasi Teks Langsung**: Mengikat variabel komponen atau token status global langsung ke dalam label teks tanpa penggabungan string manual.
- **Fill Bar Beranimasi**: Menganimasikan health bar, mana bar, dan EXP bar secara halus ke arah pengisian horizontal maupun vertikal.
- **Spawning Grid Prefab**: Membuat baris dan kolom slot item dari sebuah prefab serta mengikat child element di setiap slot ke array data.
:::

## Persyaratan {#requirements}

Siapkan komponen dan asset berikut sebelum mengikat data game ke layar HUD atau inventaris milikmu.

| Persyaratan | Entity tujuan | Fungsi |
| --- | --- | --- |
| [Text Renderer](components/renderers/text_renderer) | Label HUD dan Teks Slot | Menampilkan string terformat, counter skor, dan token variabel yang diinterpolasi. |
| [Image Renderer](components/renderers/sprite_renderer) | Health Bar dan Ikon Item | Menampilkan fill bar yang dipotong serta tekstur item yang ditukar secara dinamis di dalam slot UI. |
| [Variabel & Koleksi](visual_scripting/variables_and_collections) | Graph Logika atau Status Global | Menyimpan statistik pemain, skor, dan map item inventaris yang dibaca oleh node UI binder. |
| [Entity & Prefab](components/entities_and_prefabs) | Prefab Slot | Menyediakan prefab slot UI yang dapat dipakai ulang dan di-spawn oleh [UI Grid Spawner](node_library/helper_tool#node-uiGridSpawner). |

## Penyiapan {#setup}

Ikuti langkah berikut untuk mengikat counter teks langsung, menganimasikan health bar, dan mengisi grid inventaris berbasis data.

:::steps
1. Pilih entity label HUD milikmu, periksa komponen [Text Renderer](components/renderers/text_renderer) di [Property Inspector](interface/property_inspector), atur **Bind Variable** ke variabel skormu, lalu atur **Bind Format** ke **Score: {value}**.
2. Untuk memformat beberapa variabel di dalam sebuah graph, masukkan template string seperti **HP: {hp}/{maxHp}** ke [Format String](node_library/system_utilities#node-stringFormat), lalu hubungkan **Result** ke [Set Text](node_library/game_renderer#node-setText).
3. Buat sebuah entity health bar dengan komponen [Image Renderer](components/renderers/sprite_renderer) yang ditempatkan di atas sprite bingkai latar pada layer UI milikmu.
4. Saat HP pemain berubah, bagi HP saat ini dengan max HP, kalikan dengan **100**, lalu teruskan nilai persentase tersebut ke [Fill Amount](node_library/game_animation#node-tweenFillAmount) yang menargetkan sprite health bar.
5. Untuk membangun grid inventaris, rancang satu entity slot yang memiliki child entity bernama **Icon** (**Image Renderer**) dan **Count** (**Text Renderer**), lalu simpan slot tersebut sebagai [prefab](components/entities_and_prefabs) yang dapat dipakai ulang.
6. Di dalam graph UI milikmu, tambahkan [UI Grid Spawner](node_library/helper_tool#node-uiGridSpawner), atur **Prefab Name** ke prefab slot tersebut, lalu hubungkan list inventarismu ke **Data List**.
7. Hubungkan **On Spawn Item** dari **UI Grid Spawner** ke [UI Prefab Data Binder](node_library/helper_tool#node-uiPrefabBinder) dengan menyambungkan **Spawned Entity**, **Item Data**, dan **Item Index** agar setiap slot menampilkan ikon dan jumlah itemnya masing-masing.
:::

## Pengaturan {#settings}

Atur parameter berikut pada [Fill Amount](node_library/game_animation#node-tweenFillAmount), [UI Grid Spawner](node_library/helper_tool#node-uiGridSpawner), dan [UI Prefab Data Binder](node_library/helper_tool#node-uiPrefabBinder) untuk mengendalikan tata letak serta data binding.

| Pengaturan | Nilai yang disarankan | Efek |
| --- | --- | --- |
| **Fill %** | 0 hingga 100 | Persentase bagian sprite yang terlihat dan dipotong sepanjang **Direction** yang dipilih (**left_to_right**, **right_to_left**, **top_to_bottom**, atau **bottom_to_top**). |
| **Duration (Fill Amount)** | 0.25 | Waktu dalam detik untuk menganimasikan bar secara halus dari persentase isi sebelumnya ke nilai yang baru. |
| **Total Count & Columns** | 15 / 5 | Menentukan jumlah total sel grid yang di-spawn dan berapa banyak sel yang muat di setiap baris horizontal sebelum berpindah ke baris baru. |
| **Spacing X & Spacing Y** | 120 / 120 | Jarak piksel secara horizontal dan vertikal di antara titik tengah sel grid yang saling bersebelahan. |
| **Bindings (Data Binder)** | Map child-ke-properti | Memetakan setiap nama child entity (atau **$self**) ke properti tujuan (**text**, **sprite**, **color**, **alpha**, **visible**) dan key data. |

## Variasi {#variations}

Perluas data binding UI dinamis untuk tampilan HUD modular, penyorotan slot bersyarat, dan pembaruan properti secara massal.

| Variasi | Konfigurasi |
| --- | --- |
| **Inject Layer HUD Bersama** | Rancang HUD atau menu jeda di dalam scene UI khusus, lalu muat ke dalam level game mana pun saat game berjalan menggunakan [Inject Layer](node_library/game_lifecycle#node-injectLayer). |
| **Timer dan Mata Uang Terformat** | Gunakan [Format String](node_library/system_utilities#node-stringFormat) dengan placeholder **{0}** dan **{1}** untuk menyusun string banyak bagian sebelum memanggil [Set Text](node_library/game_renderer#node-setText). |
| **Pembaruan Tema atau Opasitas Massal** | Teruskan array **Spawned Entities** dari [UI Grid Spawner](node_library/helper_tool#node-uiGridSpawner) ke [Batch Set Properties](node_library/game_renderer#node-batchSet) untuk memudarkan atau mengubah warna seluruh slot grid sekaligus. |

## Masalah umum {#common-issues}

| Masalah | Solusi |
| --- | --- |
| [Fill Amount](node_library/game_animation#node-tweenFillAmount) meregangkan atau menggeser bar alih-alih me-crop-nya | Pastikan entity tujuan menggunakan komponen [Image Renderer](components/renderers/sprite_renderer) yang memiliki tekstur, bukan sekadar [Shape Renderer](components/renderers/shape_renderer). |
| [UI Prefab Data Binder](node_library/helper_tool#node-uiPrefabBinder) menghasilkan jumlah binding nol | Pastikan nama child entity di dalam map **Bindings** sama persis dengan nama child entity di dalam hierarki prefab yang di-spawn. |
| Item grid yang di-spawn berada di belakang panel latar inventaris | Atur **Layer ID** pada [UI Grid Spawner](node_library/helper_tool#node-uiGridSpawner) ke layer UI milikmu atau tetapkan container panel sebagai **Parent Entity**. |
| [Format String](node_library/system_utilities#node-stringFormat) membiarkan **{token}** tidak berubah di dalam teks | Pastikan nama variabel di dalam tanda kurung kurawal tersedia di input **Custom Map** yang terhubung, input port, atau variabel global. |

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Widget Interaktif](behaviour/ui/interactive_widgets) | Kamu ingin menambahkan interaksi klik, hover, slider, dan toggle switch pada elemen UI. |
| [Text Renderer](components/renderers/text_renderer) | Kamu ingin memeriksa properti inspector untuk gaya font dan variable binding bawaan. |
| [Variabel & Koleksi](visual_scripting/variables_and_collections) | Kamu ingin menyusun list dan map yang diteruskan ke UI Grid Spawner serta UI Prefab Data Binder. |
| [Helper & Tool](node_library/helper_tool) | Kamu ingin memeriksa detail port untuk Interpolate Variables, UI Grid Spawner, dan UI Prefab Data Binder. |
