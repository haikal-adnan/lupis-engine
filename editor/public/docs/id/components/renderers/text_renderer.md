---
title: "Text Renderer"
category: "Visual Renderer"
description: "Menampilkan tipografi tajam yang dapat diubah ukurannya lengkap dengan perataan, pelipatan baris, outline, dan bayangan. Gunakan Text Renderer untuk dialog, counter skor, label, dan teks pertarungan melayang."
---

## Gambaran umum {#overview}

Komponen **Text Renderer** menggambar teks yang tajam di dalam layer **World** maupun **User Interface**. Saat kamu mengimpor font **.ttf** atau **.otf** ke panel **Assets**, editor mengubahnya secara otomatis menjadi font Multi-channel Signed Distance Field (MSDF) sehingga teks tetap tajam pada ukuran font atau perbesaran kamera berapa pun.

:::features
- **Font MSDF Tajam**: Mengimpor font **.ttf** atau **.otf** yang dapat diperbesar dengan bersih tanpa pecah.
- **Tata Letak Fleksibel**: Mengatur perataan horizontal dan vertikal, jarak antarbaris, jarak antarhuruf, dan peluapan teks.
- **Outline dan Drop Shadow**: Menambahkan outline serta drop shadow yang bisa diatur agar teks HUD selalu terbaca.
- **Ukuran Baris Otomatis**: Memperluas tinggi transformasi entity secara otomatis mengikuti jumlah baris teks.
:::

## Tambahkan komponen {#add-the-component}

:::steps
1. Pilih sebuah entity di [Scene Hierarchy](interface/scene_hierarchy) atau [Scene Viewport](interface/scene_viewport).
2. Di [Property Inspector](interface/property_inspector), klik **Add Component...** di bawah **Actions**, lalu pilih **Text Renderer**.
3. Ketik isi teks ke dalam kolom **Text**.
4. Untuk menggunakan font khusus, impor file **.ttf** atau **.otf** ke panel **Assets**, klik kanan asset font tersebut, lalu klik **Apply to TextRenderer**.
:::

> [!TIP]
> Klik kanan sebuah layer di **Scene Hierarchy**, arahkan kursor ke **Add Entity** (atau **Add UI Element**), lalu klik **Text** (atau **UI Text**) untuk membuat entity teks secara langsung.

## Properti {#properties}

| Properti | Tipe | Bawaan | Deskripsi |
| --- | --- | --- | --- |
| Font | String | Default | **ID** asset font MSDF yang digunakan. |
| Mode | String | Static | Mode render teks: **Static** atau **Rich Text**. |
| Text | String | New Text | Isi teks banyak baris yang ditampilkan oleh entity. |
| Font Size (SZ) | Number | 24 | Ukuran huruf dalam satuan piksel. |
| Auto Line | Boolean | true | Menyesuaikan jumlah baris secara otomatis dan mengunci tinggi transformasi entity agar pas dengan teks. |
| Max Line (L) | Number | 1 | Jumlah baris maksimum yang ditampilkan saat **Auto Line** tidak dicentang. |
| Overflow | String | Wrap | Perilaku teks panjang saat mencapai lebar container: dilipat ke baris baru (**Wrap**) atau dipotong dengan tanda titik tiga (**Ellipsis**). |
| Line Space (H) | Number | 1.2 | Pengali tinggi jarak antarbaris secara vertikal. |
| Char Space (S) | Number | 0 | Jarak tambahan secara horizontal di antara setiap huruf. |
| Alignment | String | left | Perataan horizontal: **Left**, **Center**, **Right**, atau **Justify**. |
| Align Line | String | top | Perataan vertikal di dalam bounding box: **Top**, **Middle**, atau **Bottom**. |
| Text Color & Opacity (OP) | String | #FFFFFF (100%) | Warna heksadesimal dan persentase transparansi (0% hingga 100%) untuk huruf teks. |
| Outline (Color & W) | Number | #000000 (0) | Warna outline dan ketebalannya (**W** dari 0.00 hingga 1.00) di sekeliling setiap huruf. |
| Drop Shadow | Boolean | false | Mengaktifkan drop shadow dengan kontrol **Color**, **Opacity (OP)**, **Offset (X, Y)**, dan **Blur (B)**. |

## Contoh penggunaan {#usage-examples}

Buat counter skor rata tengah dengan outline dan drop shadow agar tetap terbaca di atas latar belakang apa pun.

:::steps
1. Di [Scene Hierarchy](interface/scene_hierarchy), klik kanan sebuah layer **User Interface**, arahkan kursor ke **Add UI Element**, lalu klik **UI Text**.
2. Di bagian **Text Renderer**, atur **Text** ke **0000** dan **Font Size** ke **36**.
3. Klik **Center** di bawah **Alignment** dan **Middle** di bawah **Align Line**.
4. Atur ketebalan **Outline** (**W**) ke **0.25** dan pilih warna outline yang gelap.
5. Centang **Drop Shadow**, lalu atur **Offset** ke **X: 2**, **Y: -2** serta **Blur** ke **4**.
:::

## Scripting {#scripting}

Gunakan node di [Rendering & Camera](node_library/game_renderer), [Flow & Logic](node_library/flow_logic), dan [Helper & Tool](node_library/helper_tool) untuk memperbarui teks secara dinamis saat game berjalan.

| Node | Deskripsi |
| --- | --- |
| [Get Text](node_library/game_renderer#node-getText) | Membaca string teks saat ini, ukuran font, warna, atau opasitas. |
| [Set Text](node_library/game_renderer#node-setText) | Memperbarui string teks yang ditampilkan, ukuran font, warna, atau opasitas saat game berjalan. |
| [Format String](node_library/system_utilities#node-stringFormat) | Menyusun string dinamis seperti label skor atau HP menggunakan placeholder. |
| [Typewriter Effect](node_library/flow_logic#node-logicTypewriter) | Menampilkan teks huruf demi huruf dengan kecepatan yang bisa diatur dan dukungan lewati. |
| [Dialogue Runner](node_library/helper_tool#node-vnDialogueRunner) | Menjalankan rangkaian dialog lengkap dengan nama pembicara, potret karakter, dan teks efek typewriter. |

## Masalah umum {#common-issues}

| Masalah | Solusi |
| --- | --- |
| Tidak bisa mengubah tinggi (**H**) di **Transform** | **Auto Line** sedang dicentang di **Text Renderer**, sehingga tinggi kotak diatur secara otomatis. Hapus centang **Auto Line** jika kamu ingin mengatur tinggi kotak tetap dan batas **Max Line**. |
| Perataan vertikal (**Align Line**) tidak menunjukkan perubahan | Saat **Auto Line** aktif, bounding box mengikuti tinggi teks secara pas. Hapus centang **Auto Line** dan perbesar tinggi transformasi (**H**) untuk meratakan teks secara vertikal di dalam kotak yang lebih besar. |

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Visual Renderer](components/renderers) | Kamu ingin membandingkan keempat komponen renderer. |
| [Transform & UI Transform](components/transform) | Kamu ingin menempelkan label teks ke tepi layar menggunakan anchor. |
| [UI Dinamis & Data Binding](behaviour/ui/dynamic_ui) | Kamu ingin mengikat label teks ke variabel skor, HP, atau inventaris. |
