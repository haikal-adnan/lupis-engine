---
title: "Referensi Shortcut"
category: "Antarmuka"
description: "Daftar lengkap shortcut keyboard dan mouse untuk editor Lupis Engine. Gunakan referensi ini untuk mempercepat navigasi, pengeditan scene, pelukisan tile, penggambaran bentuk, dan visual scripting."
---

## Gambaran umum {#overview}

Shortcut keyboard dan mouse membantumu bernavigasi di kanvas, mengganti alat, dan mengedit item di seluruh [Gambaran Umum Editor](interface/editor_overview). Daftar shortcut di bawah ini dikelompokkan berdasarkan panel atau tab workspace tempat shortcut tersebut aktif.

> [!NOTE]
> Shortcut tool satu tombol (seperti **V**, **B**, atau **E**) dinonaktifkan selama kamu sedang mengetik di dalam kolom input teks atau angka.

## Shortcut global {#global-shortcuts}

Shortcut ini berfungsi di seluruh bagian editor.

:::shortcuts
- `Ctrl` + `S`: Simpan proyek
- `Ctrl` + `Z`: Undo action terakhir
- `Ctrl` + `Y`: Redo action terakhir yang di-undo
- `Ctrl` + `Shift` + `Z`: Redo action (alternatif)
- `Ctrl` + `F2`: Tampilkan atau sembunyikan mini console debug saat preview berjalan
- `Esc`: Bersihkan pilihan di [Property Inspector](interface/property_inspector) atau tutup modal yang sedang terbuka
:::

## Scene Viewport {#scene-viewport}

Gunakan shortcut ini untuk mengendalikan kamera dan mengubah transformasi entity di [Scene Viewport](interface/scene_viewport) serta editor UI.

:::shortcuts
- `Space` + `Left Click`: Geser kamera viewport (tahan **Space** lalu seret)
- `Scroll`: Perbesar atau perkecil tampilan ke arah kursor
- `Ctrl` + `Scroll`: Perbesar atau perkecil cepat dengan kecepatan 2x
- `Shift` + `Scroll`: Gulir kamera secara vertikal
- `Alt` + `Scroll`: Gulir kamera secara horizontal
- `Left Click`: Pilih root parent entity (atau seret di ruang kosong untuk memilih dengan selection box (box select))
- `Ctrl` + `Left Click`: Pilih child entity di dalam grup secara langsung
- `Shift` + `Left Click`: Tambahkan atau hapus entity dari pilihan saat ini
- `Shift`: Kunci rasio aspek saat menyeret titik pengubah ukuran
- `Ctrl`: Balikkan perataan grid dan garis bantu pintar saat menyeret
- `Right Click`: Buka menu konteks entity atau kanvas
:::

## Hierarchy dan bottom dock {#hierarchy-and-dock}

Gunakan shortcut ini di [Scene Hierarchy](interface/scene_hierarchy), daftar klip di [Sprite Animator](components/sprite_animator), serta panel **Assets**, **Prefabs**, dan **Scripts** pada bottom dock.

:::shortcuts
- `Ctrl` + `C`: Salin entity, layer, klip, atau item dock yang dipilih
- `Ctrl` + `X`: Potong item yang dipilih
- `Ctrl` + `V`: Tempelkan item dari clipboard ke dalam layer atau folder aktif
- `Ctrl` + `D`: Gandakan entity, layer, atau klip animasi yang dipilih
- `F2`: Ubah nama entity, layer, atau item dock yang dipilih
- `Delete`: Hapus item yang dipilih
- `F5`: Refresh panel bottom dock yang sedang aktif
:::

## Tilemap Editor {#tilemap-editor}

Shortcut ini aktif saat kamu mengedit [Tilemap](components/renderers/tilemap) di tab **Tilemap Editor**.

:::shortcuts
- `V`: Select tool (pilih dengan kotak dan pindahkan tile)
- `B`: Brush tool (lukis tile)
- `E`: Eraser tool (hapus tile)
- `G`: Bucket fill tool (isi area yang saling terhubung)
- `I`: Picker tool (eyedropper) (ambil sampel tile di bawah kursor)
- `Space`: Tahan untuk menggeser kanvas tilemap
- `Ctrl` + `Left Click`: Seret untuk memilih tile dengan kotak tanpa berpindah dari brush tool
- `Delete`: Hapus seluruh tile di dalam area pilihan aktif
:::

## Shape Editor {#shape-editor}

Shortcut ini aktif saat kamu menggambar atau mengedit geometri untuk [Shape Renderer](components/renderers/shape_renderer) di tab **Shape Editor**.

:::shortcuts
- `V`: Pilih dan pindahkan vertex
- `E`: Hapus vertex yang diklik
- `P`: Point tool
- `S`: Segment tool (garis berantai yang saling terhubung)
- `L`: Line tool (garis tunggal dua titik)
- `G`: Polygon tool (bentuk tertutup)
- `C`: Circle tool
- `Space`: Tahan untuk menggeser kanvas bentuk
- `Enter`: Terapkan draf segmen atau poligon yang sedang dibuat
- `Esc`: Batalkan draf bentuk yang sedang dibuat
:::

## Visual scripting dan kode {#visual-scripting-and-code}

Gunakan shortcut ini di kanvas graph [visual scripting](visual_scripting/graph_concepts) dan [Custom Node & Code Panel](visual_scripting/custom_node_and_code).

:::shortcuts
- `Left Click`: Seret pada ruang kosong di graph untuk menggeser kanvas
- `Scroll`: Perbesar atau perkecil tampilan graph di posisi kursor
- `Shift` + `Scroll`: Gulir graph secara vertikal
- `Alt` + `Scroll`: Gulir graph secara horizontal
- `Ctrl` + `Left Click`: Seret untuk memilih beberapa node dengan kotak (atau klik untuk menambah/menghapus node)
- `Ctrl` + `Shift` + `Left Click`: Seret untuk menambahkan node ke pilihan saat ini
- `Right Click`: Buka menu pencarian node di kanvas kosong, atau opsi node pada sebuah node
- `Ctrl` + `D`: Gandakan node yang dipilih
- `Delete`: Hapus node atau wire yang dipilih
- `Ctrl` + `S`: Simpan dan kompilasi kode JavaScript di Code Panel
:::

## Modal dan popup {#modals-and-popups}

Gunakan shortcut ini di dalam modal crop sprite untuk [Image Renderer](components/renderers/sprite_renderer) dan pada popup preview media.

| Modal / Popup | Shortcut | Action |
| --- | --- | --- |
| Sprite Crop Modal | **Space** + seret | Menggeser viewport tekstur. |
| Sprite Crop Modal | **Arrow Keys** | Menggeser kotak crop sebesar 1 piksel (tahan **Shift** untuk 10 piksel). |
| Sprite Crop Modal | **Enter** / **Esc** | Menyimpan hasil crop (**Enter**) atau membatalkan dan menutup modal (**Esc**). |
| Audio Preview Popup | **Space** / **Esc** | Memutar atau menjeda audio (**Space**) atau menutup popup (**Esc**). |
| Settings & Image Popups | **Esc** | Menutup jendela dialog yang sedang aktif. |

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Gambaran Umum Editor](interface/editor_overview) | Kamu ingin melihat gambaran umum panel editor dan top bar. |
| [Scene Viewport](interface/scene_viewport) | Kamu ingin mempelajari cara menggunakan gizmo transformasi dan alat grid. |
| [Scene Hierarchy](interface/scene_hierarchy) | Kamu ingin mengelola scene, layer, dan struktur parent-child tree entity. |
| [Property Inspector](interface/property_inspector) | Kamu ingin memeriksa dan mengedit komponen entity. |
