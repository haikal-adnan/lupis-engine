---
title: "Proyek & Ekspor"
category: "Memulai"
description: "Kelola proyek di Dashboard, atur Project Settings serta auto-save, dan ekspor game dalam mode Development atau Release ke Web (.ZIP), Windows (.EXE), atau arsip .lupisproject."
---

## Gambaran umum {#overview}

Lupis Engine menyimpan proyek aktifmu di penyimpanan lokal yang cepat dan memungkinkanmu mengemasnya menjadi arsip proyek portabel, paket web HTML5 standalone, atau aplikasi desktop Windows.

:::features
- **Arsip Proyek**: Menyimpan atau memuat paket **.lupisproject** satu file untuk mem-backup atau membagikan pekerjaanmu.
- **Auto-Save dan Thumbnail**: Menyinkronkan perubahan secara otomatis menggunakan timer dan mengambil gambar sampul dari viewport.
- **Web Standalone (.ZIP)**: Mengemas game ke paket HTML5 langsung di browser dalam mode **Development** (debug/unminified) atau **Release** (obfuscated/encrypted).
- **Aplikasi Desktop (.EXE)**: Mengompilasi proyekmu menjadi aplikasi Windows standalone untuk dimainkan secara offline dalam mode **Development** atau **Release**.
:::

## Kelola proyek {#manage-projects}

Kamu bisa membuat, mengimpor, mengubah nama, dan mem-backup proyek dari dashboard **My Projects**.

:::steps
1. Untuk mengimpor backup proyek yang sudah ada, seret dan lepas file **.lupisproject** ke bagian mana pun di dashboard **My Projects**, atau klik **Load Project** lalu pilih file-nya.
2. Klik kanan proyek mana pun di dashboard untuk membuka menu konteksnya.
3. Pilih **Open** atau **Open in New Tab** untuk membuka proyek di workspace [Gambaran Umum Editor](interface/editor_overview).
4. Pilih **Save Project** untuk men-download file backup **.lupisproject** terkompresi ke komputermu.
5. Pilih **Rename** atau **Edit Description** untuk memperbarui judul dan ringkasan proyek, atau pilih **Delete Project** untuk menghapusnya dari penyimpanan.
:::

> [!CAUTION]
> Mengklik **Delete Project** menghapus folder proyek secara permanen dari penyimpanan dan tidak bisa dibatalkan. Selalu ekspor arsip **.lupisproject** terlebih dahulu jika kamu masih memerlukan proyek tersebut nanti.

## Pengaturan proyek dan penyimpanan {#project-settings-and-saving}

Di dalam editor, buka **Project Settings** untuk mengatur metadata game, scene awal, resolusi kanvas, nilai bawaan fisika, dan sinkronisasi penyimpanan.

| Tab pengaturan | Opsi utama | Fungsi |
| --- | --- | --- |
| **Project Info** | **Project Name**, **Version**, **Game Thumbnail**, **Enable Auto Save**, **Revert Changes** | Mengelola identitas proyek, gambar sampul (**Upload Thumbnail** atau **Capture Scene Now**), dan sinkronisasi penyimpanan. |
| **Preferences** | Tampilan editor dan preferensi workspace | Menyesuaikan tema dan perilaku workspace visual. |
| **Engine & Canvas** | **Initial Scene**, **Simulation Tick Rate**, **Global Background**, **Target Resolution** | Mengatur scene awal, frame rate (bawaan **60 FPS**), batas layer UI, dan preset resolusi. |
| **Physics & Bounds** | Gravitasi global, koefisien hambatan, dan batas dunia | Mengonfigurasi gaya simulasi bawaan yang diterapkan pada entity [Physics Body](components/physics_body). |
| **Grid & Camera** | Panduan perataan grid dan perspektif kamera bawaan | Mengatur garis bantu perataan di [Scene Viewport](interface/scene_viewport). |
| **Resources** | Manajemen asset global, kompresi, dan volume audio | Mengonfigurasi penyimpanan cache asset, pengemasan tekstur, dan volume suara utama. |
| **Debugging** | Wireframe collider dan tampilan performa saat game berjalan | Menampilkan diagnostik visual saat kamu menguji game. |
| **Publish & Export** | **Development (.ZIP)**, **Release (.ZIP)**, **Development (.EXE)**, **Release (.EXE)**, **Export (.lupisproject)** | Mengemas proyekmu menjadi paket distribusi atau arsip backup. |
| **About** | Versi engine, link repositori, dan komunitas | Menampilkan informasi versi rilis engine, dokumentasi, dan link eksternal. |

> [!TIP]
> Di **Project Info**, aktifkan **Enable Auto Save** dan atur **Auto Save Interval** (dalam menit) agar editor menyimpan perubahan ke penyimpanan secara otomatis. Kamu juga bisa mengklik **Revert Changes** sebelum menyimpan untuk memuat ulang status terakhir yang tersimpan.

## Ekspor game {#export-your-game}

Tab **Publish & Export** (**Build & Publish Module**) di **Project Settings** menyediakan tiga format ekspor.

| Opsi ekspor | Tombol | Hasil yang dibuat |
| --- | --- | --- |
| **Web Standalone (.ZIP)** | **Development (.ZIP)** / **Release (.ZIP)** | Paket HTML5 berbasis browser. **Development** menyertakan source map dan data yang dapat dibaca langsung untuk debugging; **Release** meng-obfuscate script dan mengenkripsi data game untuk distribusi. |
| **Desktop App (.EXE)** | **Development (.EXE)** / **Release (.EXE)** | Aplikasi Windows standalone. **Development** mengaktifkan DevTools dan kode unminified; **Release** membangun aplikasi desktop produksi yang teroptimasi dan terproteksi. |
| **Lupis Project Archive** | **Export (.lupisproject)** | Satu file **.lupisproject** terkompresi yang berisi seluruh scene, graph node, dan asset untuk backup atau impor ulang. |

:::steps
1. Tekan **Ctrl + S** (atau klik **Save Project** di **Project Settings**) agar semua perubahan terbaru pada scene dan script tersimpan.
2. Buka **Project Settings**, pilih **Engine & Canvas**, dan pastikan **Initial Scene** serta **Target Resolution** sudah diatur ke level awal dan ukuran layar yang kamu inginkan.
3. Pilih tab **Publish & Export** pada sidebar kiri **Project Settings**.
4. Untuk mengekspor build web, klik **Development (.ZIP)** untuk pengujian atau **Release (.ZIP)** untuk hosting produksi. Browser mengemas dan men-download arsip **.zip** sepenuhnya di client-side.
5. Untuk membangun aplikasi Windows, pastikan service backend berjalan pada port **37602**, lalu klik **Development (.EXE)** atau **Release (.EXE)** dan tunggu proses kompilasi selesai.
:::

> [!WARNING]
> Mengompilasi **Desktop App (.EXE)** memerlukan layanan backend yang berjalan pada port **37602** (lihat [Instalasi & Pengaturan Awal](getting_started/installation#run-with-docker)). Ekspor Web (.ZIP) berjalan 100% di sisi client (client-side) browser dan tidak membutuhkan layanan backend.

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Instalasi & Pengaturan Awal](getting_started/installation) | Kamu perlu menjalankan layanan backend Docker atau Node.js untuk membuat paket desktop **.EXE**. |
| [Mulai Cepat](getting_started/quick_start) | Kamu ingin membuat dan menguji proyek baru dari Dashboard. |
| [Gambaran Umum Editor](interface/editor_overview) | Kamu ingin mempelajari kontrol top bar, indikator simpan, dan dock workspace. |
| [Entity & Prefab](components/entities_and_prefabs) | Kamu ingin mengemas template entity yang dapat dipakai ulang di dalam proyekmu. |
