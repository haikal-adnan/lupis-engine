---
title: "Custom Node & Code Panel"
category: "Visual Scripting"
description: "Periksa kode JavaScript di balik node mana pun atau bangun Custom Node milikmu sendiri lengkap dengan port khusus, peran, dan blueprint yang dapat dipakai ulang di Code Panel."
---

## Gambaran umum {#overview}

Setiap node di Lupis Engine menjalankan kode JavaScript saat game berjalan. Kamu bisa membuka node mana pun di **Code Panel** untuk memeriksa cara kerjanya, membuka kunci node bawaan untuk menyesuaikan perilakunya, atau membuat [Custom Node](node_library/custom) dengan port input dan output milikmu sendiri.

:::features
- **Kode Transparan**: Mengklik dua kali node mana pun di dalam graph untuk melihat implementasi kode JavaScript di **Code Panel**.
- **Port dan Peran Khusus**: Memilih peran **Action**, **Event**, atau **Pure** serta menambahkan pin input dan output bertipe.
- **Validasi Langsung**: Mendeteksi kesalahan sintaks, port yang belum terpakai, dan variabel yang hilang secara langsung saat kamu mengetik.
- **Blueprint Siap Pakai Ulang**: Mengklik **Save as Blueprint** untuk menambahkan custom node buatanmu ke **Node Library** proyek.
:::

## Konsep utama {#key-concepts}

Saat kamu memilih **Custom Node** di dalam graph atau mengeditnya di **Code Panel**, kamu mengatur antarmukanya di [Property Inspector](interface/property_inspector) dan menulis logikanya menggunakan empat objek runtime bawaan.

| Kontrol Inspector | Bagian | Deskripsi |
| --- | --- | --- |
| Title / Color / Description | Header | Mengatur label judul node, warna aksen, dan catatan ringkasan. |
| Role | Header | Berpindah antara **Action (Exec In + Out)**, **Event (Exec Out only)**, dan **Pure (Data only)**. |
| Header Menu (3-dots) | Header | Menyediakan opsi **Save as Blueprint**, **Edit Node Script**, **Revert to Preset** (untuk node sistem yang dibuka kuncinya), dan **Delete Node**. |
| + Add Input / Output Port | Ports Configuration | Membuat port data khusus baru. Klik nama port untuk mengubah namanya menggunakan karakter alfanumerik. |
| Port Options (3-dots) | Ports Configuration | Mengatur **Data Type** port (**number**, **string**, atau **boolean**), mengubah urutan port dengan **Move Up** dan **Move Down**, atau menghapus port. |

Di dalam **Code Panel**, script-mu memiliki akses ke **inputs**, **outputs**, **context**, dan **node**. Status bar di bagian atas memvalidasi kodemu secara otomatis saat kamu mengetik.

| Objek / Pernyataan | Penggunaan | Deskripsi |
| --- | --- | --- |
| inputs | inputs.portName | Objek read-only yang berisi nilai saat ini dari seluruh port input pada node. |
| outputs | outputs.portName = val | Objek yang dapat ditulis untuk mengirim nilai ke port output dan melanjutkan alur eksekusi melalui **outputs.execOut = true**. |
| context | context.entity, context.dt | Menyediakan akses aman ke domain engine, variabel, pemeriksaan validasi, dan memori per node **context.state**. Lihat [Context System API](visual_scripting/context_system_api). |
| return; | Akhir script | Setiap script node harus diakhiri dengan pernyataan **return;** secara eksplisit. |

> [!WARNING]
> Nama port khusus hanya boleh menggunakan karakter alfanumerik (seperti **damageAmount** atau **isCritical**) tanpa spasi, tanda hubung, atau garis bawah. **Code Panel** menampilkan peringatan jika ada port yang didefinisikan tetapi tidak pernah dibaca atau diisi di dalam kodemu.

## Cara kerja {#how-it-works}

Ikuti langkah berikut untuk membuat custom node, mengatur portnya, dan menyimpannya sebagai blueprint yang dapat dipakai ulang.

:::steps
1. Di dalam graph script yang sedang terbuka, klik **+ Add Custom Node** di panel **Node Library** (atau klik kanan ruang kosong di kanvas lalu pilih **Add Custom Node**).
2. Di bagian **Header** pada [Property Inspector](interface/property_inspector), atur **Title** node dan pilih **Role** yang sesuai.
3. Di **Ports Configuration**, klik **+ Add Input Port** atau **+ Add Output Port**, ubah nama setiap port, lalu buka menu 3 titik untuk mengatur **Data Type**.
4. Klik dua kali bagian judul node (atau klik kanan node lalu klik **Edit Code**) untuk membuka tab **Code Panel**.
5. Tulis logika JavaScript milikmu, baca setiap port input melalui **inputs**, isi setiap port output melalui **outputs**, dan pastikan badge di bagian atas menampilkan **No Issues**.
6. Untuk memakai ulang node ini di script lain dalam proyekmu, klik ikon 3 titik di bagian **Header** lalu pilih **Save as Blueprint**.
:::

> [!TIP]
> Untuk menyesuaikan node bawaan, klik dua kali node tersebut untuk membuka **Code Panel**, lalu klik **Unlock** di status bar kanan bawah. Kamu bisa mengembalikan perilaku asli node bawaan kapan saja dengan mengklik **Revert to Preset** di menu 3 titik pada **Header**.

## Contoh {#example}

Custom node **Action** ini menghitung damage dengan crit multiplier, mencatat hasilnya ke **Console**, dan mengeluarkan nilai damage akhir. Tambahkan dua input **number** (**baseDamage** dan **critMultiplier**), satu input **boolean** (**isCrit**), serta satu output **number** (**finalDamage**), lalu masukkan kode berikut di **Code Panel**:

```javascript
const baseDamage = context.assert.isNumber(inputs.baseDamage, 'baseDamage must be a number');
const critMultiplier = context.assert.isNumber(inputs.critMultiplier, 'critMultiplier must be a number');
const isCrit = Boolean(inputs.isCrit);

const finalDamage = isCrit ? baseDamage * critMultiplier : baseDamage;
context.console.log('Dealt damage:', finalDamage);

outputs.finalDamage = finalDamage;
outputs.execOut = true;
return;
```

Untuk node perhitungan **Pure (Data only)** yang tidak memiliki pin eksekusi, hilangkan baris **outputs.execOut = true;** dan isi output data milikmu saja sebelum **return;**.

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Context System API](visual_scripting/context_system_api) | Kamu memerlukan referensi lengkap untuk seluruh properti context, metode, dan domain API. |
| [Konsep Graph & Node](visual_scripting/graph_concepts) | Kamu ingin menghubungkan custom node buatanmu ke dalam graph eksekusi. |
| [Variabel & Koleksi](visual_scripting/variables_and_collections) | Kamu ingin membaca atau menulis variabel lokal dan global dari dalam node. |
| [Custom Node](node_library/custom) | Kamu ingin melihat spesifikasi blueprint Custom Node bawaan. |
| [Referensi Shortcut](interface/shortcuts#visual-scripting-and-code) | Kamu ingin melihat shortcut keyboard untuk kanvas graph dan Code Panel. |
