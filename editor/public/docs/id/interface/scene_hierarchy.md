---
title: "Scene Hierarchy"
category: "Antarmuka"
description: "Menampilkan setiap layer dan entity di dalam scene aktif sebagai tree yang terorganisasi. Gunakan Scene Hierarchy untuk berpindah scene, menyusun grup parent-child, dan mengatur urutan render."
---

## Gambaran umum {#overview}

Panel **Scene Hierarchy** di sisi kiri editor menampilkan daftar setiap layer dan entity di dalam scene aktifmu. Panel ini memisahkan scene menjadi layer **World** yang bergerak mengikuti kamera dan layer **User Interface** yang tetap menempel di layar.

:::features
- **Pemilih Scene**: Membuat, mengubah nama, menggandakan, dan berpindah scene dari toolbar atas.
- **Layer World dan UI**: Memisahkan entity game di camera-space dari elemen user interface (UI) di screen-space.
- **Parent-Child Tree**: Menyarangkan entity sehingga child entity ikut bergerak, berputar, berubah skala, dan disembunyikan bersama parent-nya.
- **Filter Langsung**: Mencari entity berdasarkan **ID** sambil tetap menampilkan layer dan parent di atasnya.
:::

## Tata letak {#layout}

Panel ini berisi toolbar scene di bagian atas, kolom pencarian langsung, dan layer tree di bagian bawah.

| Area / Kontrol | Deskripsi |
| --- | --- |
| Select Scene... | Dropdown di bagian atas panel untuk mengganti scene yang aktif di [Scene Viewport](interface/scene_viewport). |
| Scene Options (3-dots) | Menu di samping pemilih scene yang berisi **New Scene**, **Rename Scene**, **Duplicate Scene**, **Set as Initial Scene**, dan **Delete Scene**. |
| Search... | Menyaring hierarchy tree berdasarkan **ID** entity atau layer saat kamu mengetik. Klik **X** untuk menghapus pencarian. |
| World | Bagian untuk layer game yang ikut bergerak, diperbesar, dan berputar mengikuti kamera scene. |
| User Interface | Bagian untuk layer HUD dan menu yang ditambatkan ke layar. Menu bagiannya menyediakan tombol **Open UI Editor**. |
| Tree Row | Menampilkan panah pembuka, ikon tipe (seperti kotak biru untuk [prefab](components/entities_and_prefabs)), **ID** unik, badge **Z-Index**, serta tombol kunci dan visibilitas saat di-hover. |

Mengklik kanan baris layer atau entity membuka context action untuk membuat, mengelompokkan, dan mengonversi item.

| Item Menu Konteks | Target | Deskripsi |
| --- | --- | --- |
| Add Entity / Add UI Element | Baris layer | Membuat **Empty Entity**, **Sprite**, **Shape**, **Text**, [Tilemap](components/renderers/tilemap), atau elemen UI di dalam layer tersebut. |
| Add Child / Add Child UI | Baris entity | Membuat entity baru yang langsung menjadi child dari entity yang diklik. |
| Use as Prefab | Baris entity | Menyimpan entity beserta child-nya sebagai prefab yang dapat dipakai ulang di dock **Prefabs**. |
| Change Z-Index | Baris layer | Memperbarui angka urutan layer. Layer dengan angka lebih tinggi dirender di bagian depan. |
| Rename Layer / Rename Entity | Baris layer atau entity | Meminta **ID** unik baru (atau tekan **F2**). |
| Lock / Visibility Icons | Baris layer atau entity | Arahkan kursor ke sisi kanan baris untuk mengunci pemilihan di kanvas atau mengatur visibilitas. Mengunci atau menyembunyikan parent juga berlaku pada seluruh child-nya. |

> [!WARNING]
> Entity **World** dan elemen **User Interface** menggunakan komponen transformasi yang berbeda ([Transform & UI Transform](components/transform)). Kamu tidak bisa menyeret entity **World** ke dalam layer **User Interface**, begitu pula sebaliknya.

## Tugas umum {#common-tasks}

Gunakan menu **Scene Options** di bagian atas panel untuk menambahkan scene dan memilih scene mana yang dimuat pertama kali saat game dijalankan.

:::steps
1. Di bagian atas **Scene Hierarchy**, klik tombol **Scene Options** (ikon 3 titik) di samping dropdown scene.
2. Klik **New Scene**, ketik nama scene, lalu klik **Create**. Editor berpindah ke scene baru tersebut.
3. Klik **Scene Options** lagi, lalu pilih **Set as Initial Scene** untuk menjadikan scene ini sebagai titik awal saat game dimulai.
:::

Seret baris di dalam tree untuk mengelompokkan child entity di bawah parent entity atau mengubah urutan antar-entity sejajar.

:::steps
1. Di **Scene Hierarchy**, seret entity yang ingin kamu pasangkan ke atas parent entity tujuan.
2. Arahkan kursor ke bagian tengah baris tujuan hingga outline biru menyorot baris tersebut, lalu lepaskan tombol mouse. Entity masuk menjorok di bawah parent-nya.
3. Untuk mengubah urutan entity yang sejajar, arahkan kursor ke dekat tepi atas atau bawah sebuah baris hingga garis biru horizontal muncul, lalu lepaskan.
4. Untuk melepaskan child entity kembali ke tingkat dasar layer, seret entity tersebut ke baris layer tempatnya berada lalu lepaskan.
:::

> [!TIP]
> Memilih entity parent di **Scene Hierarchy** menyorot seluruh child-nya di dalam tree sembari tetap menampilkan properti parent tersebut di [Property Inspector](interface/property_inspector).

## Shortcut {#shortcuts}

Gunakan shortcut ini saat bekerja di **Scene Hierarchy**. Untuk daftar lengkap shortcut editor, lihat [Referensi Shortcut](interface/shortcuts).

:::shortcuts
- `Ctrl` + `Left Click`: Tambahkan atau hapus baris dari pilihan saat ini
- `Ctrl` + `C`: Salin entity atau subtree layer yang dipilih
- `Ctrl` + `X`: Potong entity atau subtree layer yang dipilih
- `Ctrl` + `V`: Tempelkan entity dari clipboard ke dalam layer atau parent yang dipilih
- `Ctrl` + `D`: Gandakan entity atau layer yang dipilih
- `F2`: Ubah nama entity atau layer yang dipilih
- `Delete`: Hapus entity yang dipilih beserta seluruh child-nya
:::

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Entity & Prefab](components/entities_and_prefabs) | Kamu ingin membuat template entity yang dapat dipakai ulang dan mengelola instance prefab. |
| [Transform & UI Transform](components/transform) | Kamu ingin mempelajari cara kerja transformasi parent dan anchor UI. |
| [Scene Viewport](interface/scene_viewport) | Kamu ingin memilih dan memindahkan entity di atas kanvas. |
| [Property Inspector](interface/property_inspector) | Kamu ingin mengatur properti layer, tag entity, dan komponen. |
