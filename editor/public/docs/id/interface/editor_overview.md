---
title: "Gambaran Umum Editor"
category: "Antarmuka"
description: "Workspace Lupis Engine menyatukan pengeditan scene, visual scripting, animasi, dan pengelolaan asset dalam satu jendela. Pelajari letak setiap panel dan cara bernavigasi di workspace."
---

## Gambaran umum {#overview}

Editor mengelilingi [Scene Viewport](interface/scene_viewport) di bagian tengah dengan [Scene Hierarchy](interface/scene_hierarchy) di sebelah kiri, [Property Inspector](interface/property_inspector) di sebelah kanan, dan Resource Dock di bagian bawah. Setiap panel bisa diubah ukurannya, dilipat, dan berpindah secara otomatis saat kamu membuka tab workspace yang berbeda.

:::features
- **Pengeditan Scene**: Menempatkan, memindahkan, dan memeriksa entity secara langsung di atas kanvas.
- **Logika Visual**: Membangun mekanika game dengan node yang saling terhubung pada tab [visual scripting](visual_scripting/graph_concepts).
- **Resource Dock**: Mengelola **Assets**, **Scripts**, log **Console** (dengan tag ringkas dan hitungan pengulangan), dan **Prefabs** dalam satu panel dock.
- **Live Preview**: Mengklik **Play** untuk menguji game dan menerapkan perubahan secara langsung saat game berjalan.
:::

## Tata letak {#layout}

Workspace terbagi menjadi lima area utama. Saat kamu membuka tab alat seperti **Tilemap Editor**, **Shape Editor**, **Animator Editor**, atau graph script, panel samping dan bottom dock menyesuaikan diri dengan alat tersebut.

| Area | Deskripsi |
| --- | --- |
| Top Bar | Berisi **Project Menu** di sebelah kiri, titik status penyimpanan, dan tab workspace yang sedang terbuka di bagian atas. |
| [Scene Hierarchy](interface/scene_hierarchy) | Panel kiri (**Hierarchy** atau **UI Structure**) yang mengatur scene, layer, dan struktur parent-child entity. |
| [Scene Viewport](interface/scene_viewport) | Kanvas tengah tempat kamu menyusun entity, melukis tile, menggambar bentuk, atau menghubungkan node script. |
| [Property Inspector](interface/property_inspector) | Panel kanan (**Inspector**) untuk mengedit scene, layer, entity, atau node script yang sedang dipilih. |
| Bottom Dock | Panel dock bawah yang bisa di-collapse dengan tab **Assets**, **Scripts**, **Console** (dengan tag ringkas dan pengelompokan pesan berulang), dan **Prefabs** (atau **Timeline** saat mengedit animasi). |

Klik nama proyek di sudut kiri atas untuk membuka **Project Menu**. Titik berwarna di samping nama proyek menampilkan status penyimpanan saat ini.

| Kontrol / Indikator | Deskripsi |
| --- | --- |
| Green dot | Semua perubahan sudah disimpan. |
| Red dot | Proyek memiliki perubahan yang belum disimpan. |
| Yellow pulsing dot | Proyek sedang dimuat atau disimpan. |
| Save Project | Menyimpan seluruh scene, asset, dan pengaturan (atau tekan **Ctrl** + **S**). |
| Export Project | Men-download proyek sebagai arsip backup **.lupisproject**. Lihat [Proyek & Ekspor](getting_started/project_and_export). |
| Settings | Membuka pengaturan proyek untuk resolusi, fisika, perataan grid, dan batas debug. |
| Back to Dashboard | Menutup editor dan kembali ke dashboard proyek. |

> [!TIP]
> Klik tab yang sedang aktif di bottom bar (**Assets**, **Scripts**, **Console**, atau **Prefabs**) untuk melipat bottom dock dan memberi ruang vertikal lebih luas bagi kanvas.

## Tugas umum {#common-tasks}

Gunakan overlay bar bawah di [Scene Viewport](interface/scene_viewport) untuk menguji game dan menerapkan perubahan tanpa mengulang dari awal.

:::steps
1. Di overlay bar bawah pada **Scene Viewport**, klik **Play**. Preview game terbuka.
2. Pindahkan sebuah entity atau ubah nilai properti komponen di [Property Inspector](interface/property_inspector).
3. Di overlay bar bawah, klik **Update**. Preview yang sedang berjalan dimuat ulang dengan perubahan terbarumu.
4. Tekan **Ctrl** + **S** atau buka **Project Menu** lalu klik **Save Project** untuk menyimpan pekerjaanmu.
:::

Gunakan panel **Assets** di bottom dock untuk mengimpor file media dan memasangnya ke entity.

:::steps
1. Di bottom bar, klik **Assets** untuk membuka panel **Assets**.
2. Seret file gambar (**.png**, **.jpg**, **.webp**), font (**.ttf**, **.otf**), atau audio (**.ogg**, **.mp3**, **.wav**) dari komputermu ke dalam panel, atau klik **+** untuk memilih file.
3. Pilih entity tujuan di [Scene Hierarchy](interface/scene_hierarchy).
4. Klik kanan asset di panel **Assets**, lalu klik **Apply to SpriteRenderer**, **Apply to Tilemap**, **Apply to TextRenderer**, atau **Apply to Audio Component**.
:::

> [!NOTE]
> Seret garis pembatas pada panel kiri, panel kanan, atau bottom dock untuk mengubah ukurannya. Klik ikon lipat di bagian atas panel samping untuk melipatnya menjadi bar sempit.

## Shortcut {#shortcuts}

Shortcut global ini berfungsi di seluruh area editor selama kolom input teks tidak sedang aktif. Lihat [Referensi Shortcut](interface/shortcuts) untuk daftar lengkapnya.

:::shortcuts
- `Ctrl` + `S`: Simpan proyek
- `Ctrl` + `Z`: Undo action terakhir
- `Ctrl` + `Y`: Redo action terakhir yang di-undo
- `Ctrl` + `Shift` + `Z`: Redo action (alternatif)
- `Ctrl` + `F2`: Tampilkan atau sembunyikan mini console saat preview
- `Esc`: Bersihkan pilihan atau tutup dialog yang sedang terbuka
:::

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Scene Viewport](interface/scene_viewport) | Kamu ingin bernavigasi di kanvas, meratakan posisi ke grid, dan mengubah transformasi entity. |
| [Scene Hierarchy](interface/scene_hierarchy) | Kamu ingin mengelola scene, layer, dan struktur parent-child tree entity. |
| [Property Inspector](interface/property_inspector) | Kamu ingin mengedit komponen entity, tag, dan override prefab. |
| [Referensi Shortcut](interface/shortcuts) | Kamu ingin melihat shortcut keyboard dan mouse untuk setiap alat di editor. |
| [Mulai Cepat](getting_started/quick_start) | Kamu ingin membuat dan menjalankan scene game pertamamu. |
