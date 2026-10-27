---
title: "Audio Source"
category: "Komponen"
description: "Memutar musik latar, efek suara, dan klip suara pada sebuah entity. Mendukung channel volume, pengulangan, ketahanan lintas scene, transisi fade, dan falloff jarak spasial 2D."
---

## Gambaran umum {#overview}

Komponen **Audio** memasang asset suara yang diimpor (**.ogg**, **.mp3**, atau **.wav**) pada sebuah [entity](components/entities_and_prefabs). Kamu bisa mengaturnya sebagai musik latar global yang tetap berlanjut saat berpindah scene, atau sebagai efek suara 2D berposisi yang volumenya mengecil seiring bertambahnya jarak dari kamera.

:::features
- **Channel Audio**: Mengarahkan suara ke channel **Background**, **Sound Effect (SFX)**, atau **Voice** untuk pengaturan volume terpisah.
- **Ketahanan Lintas Scene**: Menggunakan **Persist Across Scenes** agar musik tetap mengalun tanpa terputus saat memuat level baru.
- **Spatial 2D Falloff (Attenuation)**: Mengecilkan volume suara secara otomatis di antara jarak **Min Distance** dan **Max Distance**.
- **Preview Bawaan**: Mengklik nama file yang terpasang di inspector untuk mendengarkan waveform melalui pemutar popup.
:::

## Tambahkan komponen {#add-the-component}

:::steps
1. Pilih sebuah entity di [Scene Hierarchy](interface/scene_hierarchy) atau [Scene Viewport](interface/scene_viewport).
2. Di [Property Inspector](interface/property_inspector), klik **Add Component...** di bawah **Actions**, lalu pilih **Audio**.
3. Di panel **Assets** pada bottom dock, klik kanan sebuah file audio lalu pilih **Apply to Audio Component** (atau klik ikon pencarian di samping **Audio File** di inspector).
:::

## Properti {#properties}

| Properti | Tipe | Bawaan | Deskripsi |
| --- | --- | --- | --- |
| Active Status | Boolean | Active | Mengalihkan status **Active** atau **Muted** untuk sumber audio ini. |
| Audio Type | String | Sound Effect (SFX) | Menentukan channel mixer: **Background**, **Sound Effect (SFX)**, atau **Voice**. |
| Audio File | String | None | **ID** asset audio yang dipasang. Klik nama file untuk membuka popup preview waveform, atau klik ikon folder untuk memilih file lain. |
| Volume | Number | 100 | Persentase volume pemutaran dari 0% hingga 100%. |
| Pitch (Speed) | Number | 1.0 | Pengali kecepatan putar dan tinggi nada dari 0.1 hingga 3.0. |
| Play on Awake | Boolean | false | Memutar audio secara otomatis segera setelah scene dimuat atau entity di-spawn. |
| Loop | Boolean | false | Mengulang klip audio secara terus-menerus. |
| Global Audio | Boolean | Destroy on Load | **Destroy on Load** menghentikan suara saat meninggalkan scene; **Persist Across Scenes** menjaga suara tetap berputar melintasi perpindahan scene. |
| Fade In / Out (s) | Number | 0, 0 | Durasi peningkatan (**In**) dan penurunan (**Out**) volume secara halus dalam detik (0 hingga 10). |
| Spatial 2D | Boolean | Disabled (Global) | Saat diatur ke **Enabled (Positional)**, volume suara mengecil ketika entity menjauh dari kamera. |
| Min Distance | Number | 100 | Muncul saat **Spatial 2D** diaktifkan. Jarak dalam piksel di mana suara diputar dengan volume penuh. |
| Max Distance | Number | 1000 | Muncul saat **Spatial 2D** diaktifkan. Jarak dalam piksel di mana suara memudar hingga senyap sepenuhnya. |

## Contoh penggunaan {#usage-examples}

Siapkan musik latar yang langsung berputar secara otomatis dan tetap menyala saat pemain berpindah ke scene baru.

:::steps
1. Buat sebuah **Empty Entity** di scene awalmu, ubah nama **ID** menjadi **BGM_Player**, lalu tambahkan komponen **Audio**.
2. Pasang file musikmu ke **Audio File** dan atur **Audio Type** ke **Background**.
3. Aktifkan **Play on Awake** dan **Loop**.
4. Klik **Destroy on Load** di samping **Global Audio** untuk mengubahnya menjadi **Persist Across Scenes**.
5. Atur **Fade In / Out (s)** ke **1.5** untuk menghasilkan efek masuk yang halus.
:::

## Scripting {#scripting}

Gunakan node di [Audio & System](node_library/system_utilities) dan [Helper & Tool](node_library/helper_tool) untuk memicu suara dan mengendalikan channel mixer saat game berjalan.

| Node | Deskripsi |
| --- | --- |
| [Play Audio](node_library/system_utilities#node-playAudio) | Memutar sumber audio pada entity target. |
| [Stop Audio](node_library/system_utilities#node-stopAudio) | Menghentikan pemutaran audio pada entity target. |
| [Set Volume](node_library/system_utilities#node-setAudioVolume) | Mengatur volume (0 hingga 100) untuk master channel atau channel tertentu (**background**, **sfx**, atau **voice**). |
| [Get Volume](node_library/system_utilities#node-getAudioVolume) | Membaca nilai volume saat ini dari sebuah channel audio. |
| [Set Channel Mute](node_library/system_utilities#node-setAudioMute) | Me-mute atau meng-unmute sebuah channel audio. |
| [Volume Slider Manager](node_library/helper_tool#node-volumeSliderManager) | Menghubungkan slider UI secara langsung ke volume channel audio. |

## Masalah umum {#common-issues}

| Masalah | Solusi |
| --- | --- |
| Tombol **Spatial 2D** tidak bisa diklik | **Spatial 2D** tidak bisa digabungkan dengan **Persist Across Scenes**. Ubah **Global Audio** kembali ke **Destroy on Load** untuk mengaktifkan audio 2D berposisi. |
| Suara tidak berputar saat scene dimulai | Pastikan **Play on Awake** sudah diaktifkan, **Active Status** diatur ke **Active**, dan asset suara sudah dipasang pada **Audio File**. |
| Suara berposisi terdengar terlalu pelan | Naikkan nilai **Min Distance** dan **Max Distance** agar posisi entity masuk ke dalam jangkauan dengar kamera. |

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Audio & System](node_library/system_utilities) | Kamu ingin melihat seluruh node audio dan sinyal di Node Library. |
| [Widget Interaktif](behaviour/ui/interactive_widgets) | Kamu ingin membuat menu pengaturan volume audio di dalam game. |
| [Entity & Prefab](components/entities_and_prefabs) | Kamu ingin menyimpan entity penghasil suara sebagai prefab. |
