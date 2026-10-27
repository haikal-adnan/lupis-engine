---
title: "Scene Viewport"
category: "Antarmuka"
description: "Kanvas interaktif tempat kamu menempatkan, memindahkan, memutar, dan mengubah ukuran entity secara langsung. Gunakan Scene Viewport untuk menyusun scene, meratakan tata letak ke grid, dan menjalankan preview game."
---

## Gambaran umum {#overview}

**Scene Viewport** berada di bagian tengah [Gambaran Umum Editor](interface/editor_overview) dan menampilkan scene aktifmu secara langsung. Kamu bisa memilih entity di atas kanvas, mengubah transformasinya menggunakan handle visual, dan menguji game dari overlay toolbar di bagian bawah.

:::features
- **Transform Gizmo**: Memindahkan, mengubah ukuran, dan memutar entity yang dipilih langsung di atas kanvas.
- **Grid dan Perataan**: Meratakan entity ke grid piksel dan garis bantu pintar untuk tata letak yang rapi.
- **Pembuatan Cepat**: Mengklik kanan di bagian mana pun pada kanvas untuk membuat atau menempelkan entity di posisi kursor.
- **Live Preview**: Mengklik **Play** atau **Update** di bottom bar untuk menguji perubahan secara langsung.
:::

## Tata letak {#layout}

Viewport mencakup kanvas interaktif dan toolbar melayang di bagian tengah bawah.

| Area / Kontrol | Deskripsi |
| --- | --- |
| Canvas | Menampilkan layer **World** dan **User Interface** yang terlihat, selection box, serta wireframe collider. |
| Transform Gizmo | Bounding box di sekeliling entity yang dipilih. Seret bagian dalamnya untuk memindahkan, seret titik di tepi atau sudut untuk mengubah ukuran, atau seret titik rotasi untuk memutar. |
| X / Y Coordinates | Menampilkan koordinat kursor secara langsung dalam satuan piksel dunia di sisi kiri overlay bar bawah. |
| Snap On / Snap Off | Tombol magnet di overlay bar bawah untuk mengaktifkan atau menonaktifkan perataan ke grid dan garis bantu pintar. |
| Toggle Grid | Tombol grid di overlay bar bawah untuk menampilkan atau menyembunyikan grid perataan. |
| Play / Update | Menjalankan preview game, atau memperbarui preview yang sedang berjalan dengan perubahan scene terbarumu. |

Mengklik kanan pada kanvas membuka menu konteks. Pilihan action yang muncul menyesuaikan apakah kamu mengklik kanan ruang kosong atau entity yang sedang dipilih.

| Item Menu Konteks | Target | Deskripsi |
| --- | --- | --- |
| Create Entity | Kanvas kosong | Membuat **Empty Entity**, **Sprite**, **Shape**, **Text**, [Tilemap](components/renderers/tilemap), atau elemen user interface (UI) di posisi kursor. |
| Paste Here | Kanvas kosong | Menempelkan entity yang disalin tepat di titik koordinat yang diklik. |
| Copy / Cut / Duplicate | Entity terpilih | Menyalin, memotong, atau menggandakan entity yang dipilih. |
| Bring to Front / Send to Back | Entity terpilih | Menaikkan atau menurunkan nilai **Z-Index** entity sebesar 1 di dalam layernya. |
| Use as Prefab | Entity terpilih | Menyimpan entity beserta child-nya sebagai [prefab](components/entities_and_prefabs) yang dapat dipakai ulang. |
| Lock | Entity terpilih | Mencegah entity terpilih atau tergeser secara tidak sengaja di atas kanvas. |
| Hidden Entity | Entity terpilih | Menyembunyikan atau menampilkan entity di viewport. |
| Inactive Entity | Entity terpilih | Mengaktifkan atau menonaktifkan entity saat game berjalan. |
| Delete | Entity terpilih | Menghapus entity yang dipilih beserta child-nya dari scene. |

> [!TIP]
> Tekan **Esc** untuk membersihkan pilihanmu, lalu gunakan **Quick Actions** di [Property Inspector](interface/property_inspector) untuk menampilkan atau menyembunyikan batas kamera, batas (bounds) UI, dan wireframe collider.

## Tugas umum {#common-tasks}

Kamu bisa membuat entity baru secara langsung di titik koordinat dunia mana pun melalui menu konteks kanvas.

:::steps
1. Tahan **Space** dan seret dengan tombol kiri mouse untuk menggeser tampilan **Scene Viewport** ke area tujuanmu.
2. Klik kanan pada ruang kanvas yang kosong.
3. Arahkan kursor ke **Create Entity**, pilih layer tujuan, lalu klik **Sprite**, **Shape**, **Text**, atau **Tilemap**. Entity baru muncul di posisi yang diklik.
:::

Gunakan gizmo transformasi dan perataan grid untuk mengatur posisi serta ukuran entity.

:::steps
1. Di overlay bar bawah, klik tombol magnet untuk mengaktifkan **Snap On**.
2. Klik sebuah entity di atas kanvas untuk memilihnya dan menampilkan gizmo transformasinya.
3. Seret bagian dalam selection box untuk memindahkan entity mengikuti grid. Tahan **Ctrl** saat menyeret untuk mengabaikan perataan grid sementara.
4. Seret handle sudut sambil menahan **Shift** untuk mengubah ukuran entity dengan rasio aspek yang terkunci.
:::

> [!NOTE]
> Mengklik child entity di atas kanvas memilih root parent entity-nya secara bawaan. Tahan **Ctrl** lalu klik child entity tersebut untuk memilihnya secara langsung.

## Shortcut {#shortcuts}

Gunakan shortcut mouse dan keyboard ini di **Scene Viewport** serta editor UI. Untuk shortcut **Tilemap Editor** dan **Shape Editor**, lihat [Referensi Shortcut](interface/shortcuts).

:::shortcuts
- `Space` + `Left Click`: Geser kamera viewport (tahan **Space** lalu seret)
- `Scroll`: Perbesar atau perkecil tampilan ke arah kursor
- `Ctrl` + `Scroll`: Perbesar atau perkecil cepat dengan kecepatan 2x
- `Shift` + `Scroll`: Gulir kamera secara vertikal
- `Alt` + `Scroll`: Gulir kamera secara horizontal
- `Left Click`: Pilih entity (atau seret di ruang kosong untuk memilih dengan selection box (box select))
- `Ctrl` + `Left Click`: Pilih child entity di dalam grup secara langsung
- `Shift` + `Left Click`: Tambahkan atau hapus entity dari pilihan saat ini
- `Shift`: Kunci rasio aspek saat menyeret titik pengubah ukuran
- `Ctrl`: Balikkan perilaku perataan grid saat memindahkan atau mengubah ukuran
- `Ctrl` + `D`: Gandakan entity yang dipilih
- `Delete`: Hapus entity yang dipilih
:::

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Gambaran Umum Editor](interface/editor_overview) | Kamu ingin mempelajari bagaimana viewport terhubung dengan panel editor lainnya. |
| [Scene Hierarchy](interface/scene_hierarchy) | Kamu ingin mengelola layer, perpindahan scene, dan struktur parent-child tree. |
| [Property Inspector](interface/property_inspector) | Kamu ingin memasukkan angka transformasi secara presisi atau mengatur batas debug. |
| [Transform & UI Transform](components/transform) | Kamu ingin mengatur posisi, pivot, skala, dan anchor UI. |
| [Referensi Shortcut](interface/shortcuts) | Kamu ingin melihat shortcut untuk Tilemap Editor, Shape Editor, dan Graph Editor. |
