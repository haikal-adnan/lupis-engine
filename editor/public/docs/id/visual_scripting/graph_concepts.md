---
title: "Konsep Graph & Node"
category: "Visual Scripting"
description: "Bangun logika game dengan menghubungkan node event, action, dan data di editor graph. Pelajari cara kerja alur eksekusi, port data bertipe, dan Edge Modifier."
---

## Gambaran umum {#overview}

Visual scripting di Lupis Engine memungkinkanmu membuat logika game dengan menghubungkan node di atas kanvas interaktif. Kamu membuat script di panel **Scripts** pada bottom dock, memasangnya ke entity menggunakan [Script Controller](components/script_controller), lalu mengedit graph nodenya di tab workspace.

:::features
- **Peran Node**: Menggabungkan node **Event**, **Action**, dan **Pure** untuk memicu serta memproses logika game.
- **Port Data Bertipe**: Mengirimkan angka, string, boolean, list, dan map melalui pin berkode warna.
- **Input Langsung dan Variabel**: Mengetik nilai secara langsung, mengikat variabel, atau menghubungkan pin output dari node lain.
- **Edge Modifier**: Mengklik data wire mana pun untuk menerapkan operasi matematika, string, atau boolean secara langsung.
:::

## Konsep utama {#key-concepts}

Setiap node di dalam katalog [Overview & Architecture](node_library/overview) termasuk ke dalam salah satu dari tiga peran. Peran sebuah node menentukan apakah node tersebut memulai eksekusi, menjalankan action secara berurutan, atau menghitung data sesuai permintaan.

| Peran | Pin Eksekusi | Fungsi | Contoh |
| --- | --- | --- | --- |
| Event | Output saja (execOut) | Memulai rantai eksekusi saat lifecycle engine, input, atau sinyal dipicu. | [On Tick](node_library/game_lifecycle#node-eventTick), [On Scene Start](node_library/game_lifecycle#node-eventSceneStart), [On Key](node_library/input_controls#node-eventOnKey) |
| Action | Input dan Output (execIn, execOut) | Memperbarui status entity, memutar audio, menggerakkan benda fisik, atau mengarahkan alur saat dipicu. | [Branch](node_library/flow_logic#node-logicBranch), [Set Transform](node_library/game_entity#node-setTransform), [Move and Slide](node_library/game_physics#node-moveAndSlide) |
| Pure | Tidak ada (Data saja) | Menghitung atau membaca nilai sesuai permintaan setiap kali node Action yang terhubung dijalankan. | [Add](node_library/math_operations#node-mathAdd), [Compare](node_library/flow_logic#node-logicCompare), [Get Transform](node_library/game_entity#node-getTransform) |

Node menerima input di sisi kiri dan mengirimkan output dari sisi kanan. Warna port menunjukkan tipe data yang dibawa oleh masing-masing pin dan wire.

| Tipe Port | Badge | Warna Pin | Deskripsi |
| --- | --- | --- | --- |
| execution | Execution | Putih | Mengarahkan urutan eksekusi kronologis dari **execOut** satu node ke **execIn** node berikutnya. |
| number | Number | Biru | Membawa bilangan bulat dan desimal seperti kecepatan, HP, timer, atau koordinat. |
| string | String | Merah Muda | Membawa nilai teks, ID entity, tag, atau nama klip animasi. |
| boolean | Boolean | Merah | Membawa kondisi benar atau salah untuk percabangan dan flag status. |
| list | Array | Sian / Hijau | Membawa susunan item berurutan yang dikelola melalui [Variabel & Koleksi](visual_scripting/variables_and_collections). |
| map | Object | Oranye | Membawa dictionary pasangan key-value untuk data terstruktur. |
| any | Any | Abu-abu | Menerima atau mengeluarkan tipe data apa pun. |

> [!NOTE]
> Memilih sebuah node menampilkan bagian **Header**, **Parameters**, dan **Ports Configuration** di [Property Inspector](interface/property_inspector). Di bagian **Parameters**, klik tombol toggle di samping input yang tidak terhubung untuk berpindah antara **Direct Input** dan binding **Variable**.

## Cara kerja {#how-it-works}

Saat kamu membuka tab script dari panel **Scripts**, sidebar kiri berpindah ke **Variables** dan **Node Library**, bagian tengah menampilkan kanvas graph, dan panel kanan memeriksa node atau wire yang sedang dipilih.

:::steps
1. Di bottom bar, klik **Scripts**, klik **+** untuk membuat script baru, lalu klik dua kali script tersebut untuk membuka tab graph.
2. Di sidebar kiri di bawah **Node Library**, cari sebuah node atau klik **Open Node Library** untuk menjelajahi ke-11 kategori.
3. Klik dua kali sebuah node atau seret ke atas kanvas untuk menempatkannya.
4. Seret dari pin output di sisi kanan (**execOut** atau output data) ke pin input di sisi kiri pada node lain untuk menghubungkan wire.
5. Pilih sebuah node untuk mengedit nilai input yang tidak terhubung di bagian **Parameters** pada [Property Inspector](interface/property_inspector).
6. Klik data wire mana pun di antara dua node untuk membuka bagian **Edge Modifier**, tempat kamu bisa menerapkan operasi langsung seperti **Add (+)**, **Multiply (x)**, **Append (Suffix)**, atau **Invert (NOT !)** tanpa menambahkan node tambahan.
:::

> [!TIP]
> Node dinamis seperti [Switch](node_library/flow_logic#node-logicSwitch), [Add](node_library/math_operations#node-mathAdd), dan [Set Transform](node_library/game_entity#node-setTransform) memungkinkanmu menambah atau menghapus port di **Parameters** atau **Ports Configuration** menggunakan **+ Add Case**, **+ Add Value**, atau **+ Select property...**.

## Contoh {#example}

Bangun graph pergerakan yang membaca tombol arah pada setiap frame, mengalikan vektor input menggunakan Edge Modifier, dan menggerakkan entity.

:::steps
1. Buka script di editor graph, lalu tambahkan node [On Tick](node_library/game_lifecycle#node-eventTick) dari [Scene & Lifecycle](node_library/game_lifecycle).
2. Tambahkan node [Calculate Axis 2D](node_library/input_controls#node-calculateAxis2d) dari [Input & Controls](node_library/input_controls) dan node [Move and Slide](node_library/game_physics#node-moveAndSlide) dari [Physics & Collision](node_library/game_physics).
3. Hubungkan **execOut** pada **On Tick** ke **execIn** pada **Calculate Axis 2D**, lalu hubungkan **execOut** pada **Calculate Axis 2D** ke **execIn** pada **Move and Slide**.
4. Seret data wire dari **axisX** dan **axisY** pada **Calculate Axis 2D** ke **velocityX** dan **velocityY** pada **Move and Slide**.
5. Klik masing-masing data wire berwarna hijau, atur **Operation** ke **Multiply (x)** di **Edge Modifier**, lalu atur **Operand Value** ke **200**.
6. Pasang script ke sebuah entity melalui [Script Controller](components/script_controller#add-the-component), lalu klik **Play** di [Scene Viewport](interface/scene_viewport) untuk bergerak menggunakan **W**, **A**, **S**, dan **D**.
:::

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Script Controller](components/script_controller) | Kamu ingin memasang script pada sebuah entity dan mengubah variabel lokal di inspector. |
| [Variabel & Koleksi](visual_scripting/variables_and_collections) | Kamu ingin menyimpan data lokal atau global, list, dan map. |
| [Custom Node & Code Panel](visual_scripting/custom_node_and_code) | Kamu ingin memeriksa kode node atau membuat node JavaScript khusus. |
| [Overview & Architecture](node_library/overview) | Kamu ingin menjelajahi seluruh node bawaan di ke-11 kategori. |
| [Referensi Shortcut](interface/shortcuts#visual-scripting-and-code) | Kamu ingin melihat shortcut keyboard dan mouse untuk menggeser, memilih, serta mengedit node. |
