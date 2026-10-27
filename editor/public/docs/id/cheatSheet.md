---
title: "Cheat Sheet Dokumentasi"
category: "Referensi"
description: "Halaman referensi lengkap untuk melihat seluruh komponen blok yang tersedia di dalam sistem dokumentasi **Lupis Engine**."
---

## Komponen Teks & Alert {#komponen-dasar}

Ini adalah blok **text**. Mendukung format **Bold** serta **Smart Link**, baik [Internal](#komponen-media) maupun [Eksternal](https://google.com).

> [!NOTE]
> Varian **Info**: Gunakan untuk memberikan informasi tambahan yang relevan.

> [!TIP]
> Varian **Tip**: Gunakan untuk memberikan saran atau trik cepat.

> [!WARNING]
> Varian **Warning**: Berikan peringatan agar pengguna lebih berhati-hati.

> [!CAUTION]
> Varian **Danger**: Gunakan untuk mencegah kesalahan fatal atau kerusakan sistem.

## Fitur & Langkah {#fitur-dan-langkah}

:::features
- **Sangat Cepat**: Rendering berbasis **WebGL 2.0**.
- **Logika Node**: Sistem **Visual Scripting**.
:::

:::steps
1. Instal paket melalui **NPM** atau **Yarn**.
2. Inisialisasi engine pada elemen **Canvas**.
3. Buat **Entity** pertamamu.
:::

:::shortcuts
- `Ctrl` + `S`: Simpan Proyek
- `Space`: Putar / Jeda Preview
:::

## Kode & Tabel API {#kode-dan-data}

```javascript
import { Engine } from '@lupis/core';
const game = new Engine();
game.start();
```

| Properti | Tipe | Nilai Default | Deskripsi |
| --- | --- | --- | --- |
| position | Vector2 | {x:0, y:0} | Posisi entity. |
| visible | Boolean | true | Status render. |
| tag | String | "Untagged" | Label identifikasi. |

## Komponen Media {#komponen-media}

![Lupis Engine Logo](/assets/logo.png "Contoh penggunaan blok gambar lokal.")

:::video
url: https://vjs.zencdn.net/v/oceans.mp4
poster: https://placehold.co/800x450/1e1e2e/indigo?text=Video+Preview
caption: Contoh penggunaan blok video eksternal.
controls: true
autoplay: false
:::
