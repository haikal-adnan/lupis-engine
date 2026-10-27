---
title: "Widget Interaktif"
category: "User Interface (UI)"
description: "Buat tombol yang bisa diklik, slider yang bisa di-drag, toggle switch, dan pilihan dialog bercabang."
---

## Gambaran umum {#overview}

Widget interaktif memungkinkan pemain mengklik tombol, men-drag slider, menekan toggle switch, dan memilih cabang dialog menggunakan input mouse atau sentuhan.

:::features
- **Tombol Responsif**: Mengubah skala tombol secara halus saat di-hover dan ditekan sembari memicu event klik untuk navigasi scene atau action menu.
- **Slider dan Toggle Switch**: Menyeret handle slider untuk mengatur channel audio atau menekan toggle switch beranimasi pada menu pengaturan.
- **Dialog dan Menu Pilihan**: Menampilkan dialog efek typewriter lengkap dengan potret karakter dan menyajikan tombol pilihan cerita bercabang.
:::

## Persyaratan {#requirements}

Siapkan sebuah layer user interface (UI) screen-space dan pasang komponen visual serta interaksi pada entity widget milikmu.

| Persyaratan | Entity tujuan | Fungsi |
| --- | --- | --- |
| [Scene Hierarchy](interface/scene_hierarchy) | Layer UI | Menempelkan entity widget ke layar dengan mengatur **Parallax X** dan **Parallax Y** ke **0**. |
| [Image Renderer](components/renderers/sprite_renderer) atau [Shape Renderer](components/renderers/shape_renderer) | Tombol, Track, dan Handle | Menampilkan batas visual yang digunakan untuk deteksi klik kursor mouse dan perubahan tampilan status. |
| [Text Renderer](components/renderers/text_renderer) | Label dan Kotak Dialog | Menampilkan teks tombol, persentase slider, dan kalimat dialog efek typewriter. |
| [Script Controller](components/script_controller) | Manajer UI atau Widget | Menjalankan [Button Scale Effect](node_library/game_animation#node-uiButtonScaleEffect), [Atomic Slider](node_library/helper_tool#node-atomicSlider), atau [Switch Button Shape](node_library/helper_tool#node-switchButtonShape). |

## Penyiapan {#setup}

Ikuti langkah berikut untuk membangun tombol menu beranimasi, slider yang bisa di-drag, dan toggle switch di dalam sebuah layer UI.

:::steps
1. Di [Scene Hierarchy](interface/scene_hierarchy), buat sebuah layer **UI** khusus di atas layer game-mu, lalu atur **Parallax X** dan **Parallax Y** ke **0**.
2. Buat sebuah entity tombol di dalam layer **UI** dengan komponen [Image Renderer](components/renderers/sprite_renderer) atau [Shape Renderer](components/renderers/shape_renderer), lalu tambahkan child entity berjenis [Text Renderer](components/renderers/text_renderer) sebagai labelnya.
3. Buka [Konsep Graph & Node](visual_scripting/graph_concepts) milik UI, tambahkan [On Tick](node_library/game_lifecycle#node-eventTick), lalu hubungkan ke [Button Scale Effect](node_library/game_animation#node-uiButtonScaleEffect) yang menargetkan entity tombol tersebut.
4. Hubungkan output **On Click** dari **Button Scale Effect** ke [Change Scene](node_library/game_lifecycle#node-changeScene) atau logika action menumu.
5. Untuk menambahkan slider nilai, buat sebuah entity bar horizontal dan sebuah child entity sebagai handle, lalu hubungkan **On Tick** ke [Atomic Slider](node_library/helper_tool#node-atomicSlider) dengan mengisi **Bar Entity** dan **Handler Entity**.
6. Untuk menambahkan toggle switch pengaturan, buat sebuah shape track dan sebuah shape handle, lalu hubungkan [Switch Button Shape](node_library/helper_tool#node-switchButtonShape) untuk menganimasikan posisi handle dan warna track saat diklik.
:::

## Pengaturan {#settings}

Sesuaikan parameter berikut pada [Button Scale Effect](node_library/game_animation#node-uiButtonScaleEffect), [Atomic Slider](node_library/helper_tool#node-atomicSlider), dan [Switch Button Shape](node_library/helper_tool#node-switchButtonShape) untuk mengatur responsivitas widget.

| Pengaturan | Nilai yang disarankan | Efek |
| --- | --- | --- |
| **Scale Normal / Hover / Pressed** | 1.0 / 1.1 / 0.9 | Pengali skala tujuan yang diterapkan pada tombol saat normal (idle), di-hover, atau ditekan. |
| **Lerp Speed** | 0.2 | Faktor penghalusan untuk transisi skala tombol pada setiap frame; nilai yang lebih tinggi membuat perubahan lebih cepat. |
| **Use Raycast** | true | Memastikan hanya entity UI paling atas yang terlihat di bawah kursor yang menerima event hover atau klik. |
| **Min / Max / Step** | 0 / 100 / 1 | Menentukan rentang angka dan kelipatan pembulatan yang dikeluarkan oleh **Atomic Slider** saat pemain men-drag handle. |
| **Slide Distance** | 40 | Jarak horizontal dalam piksel yang ditempuh handle toggle switch dari titik tengah track saat dinyalakan atau dimatikan. |
| **Duration** | 0.15 | Waktu transisi dalam detik untuk pergeseran handle toggle switch dan perubahan warnanya. |

## Variasi {#variations}

Gabungkan node interaksi untuk membangun mixer audio multi-channel, toggle switch berbasis sprite, dan sistem dialog visual novel.

| Variasi | Konfigurasi |
| --- | --- |
| **Audio Mixer Multi-Channel** | Gunakan [Volume Slider Manager](node_library/helper_tool#node-volumeSliderManager) dan berikan map berisi entity bar, handle, serta indikator teks untuk **master**, **vocal**, **sfx**, dan **background** guna mengendalikan seluruh channel audio dalam satu node. |
| **Toggle Switch Berbasis Sprite** | Ganti warna bentuk dengan tekstur khusus menggunakan [Switch Button Image](node_library/helper_tool#node-switchButtonImage) untuk menukar sprite track dan handle di antara status aktif dan nonaktif. |
| **Dialog dan Pilihan Visual Novel** | Hubungkan [Dialogue Runner](node_library/helper_tool#node-vnDialogueRunner) untuk mengalirkan baris dialog JSON lengkap dengan potret karakter, lalu picu [Choice Presenter](node_library/helper_tool#node-vnChoicePresenter) untuk menampilkan tombol pilihan bercabang. |
| **Penguncian Input Popup Modal** | Panggil [Freeze Layer Input](node_library/input_controls#node-freezeLayerInput) saat membuka popup jeda atau konfirmasi agar klik tidak menembus ke layer game atau menu di bawahnya. |

## Masalah umum {#common-issues}

| Masalah | Solusi |
| --- | --- |
| Mengklik tombol UI ikut memicu entity atau tombol lain di belakangnya | Aktifkan **Use Raycast** pada [Button Scale Effect](node_library/game_animation#node-uiButtonScaleEffect) atau [Entity Mouse Event](node_library/input_controls#node-mouseEntityInteract), atau kunci layer di bawahnya menggunakan [Freeze Layer Input](node_library/input_controls#node-freezeLayerInput). |
| Tombol dan slider ikut bergeser keluar layar saat kamera bergerak | Buka pengaturan layer di [Scene Hierarchy](interface/scene_hierarchy), lalu atur **Parallax X** dan **Parallax Y** milik layer UI ke **0**. |
| Handle [Atomic Slider](node_library/helper_tool#node-atomicSlider) bergerak melewati batas tepi bar | Pastikan **Bar Entity** memiliki komponen [Image Renderer](components/renderers/sprite_renderer) atau [Shape Renderer](components/renderers/shape_renderer) dengan nilai **Width** lebih besar dari nol agar slider bisa menghitung batas drag-nya. |
| Deteksi hover dan klik terasa bergeser dari gambar tombol yang terlihat | Pastikan pivot milik entity tombol berada di tengah (**0.5, 0.5**) atau tambahkan [Multi-Collider](components/multi_collider) lalu aktifkan **Use Collider Bounds** pada **Entity Mouse Event**. |

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [UI Dinamis & Data Binding](behaviour/ui/dynamic_ui) | Kamu ingin mengikat nilai slider dan state game ke label teks, progress bar, serta grid item. |
| [Input & Controls](node_library/input_controls) | Kamu ingin memeriksa node mouse hover, klik, hold, dan pembekuan input layer. |
| [Helper & Tool](node_library/helper_tool) | Kamu ingin melihat referensi port lengkap untuk slider, toggle switch, dan node dialog visual novel. |
