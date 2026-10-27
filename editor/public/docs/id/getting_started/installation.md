---
title: "Instalasi & Pengaturan Awal"
category: "Memulai"
description: "Jalankan Lupis Engine langsung di web browser, download aplikasi desktop standalone dari GitHub, luncurkan dengan Docker, atau jalankan server lokal sendiri."
---

## Gambaran umum {#overview}

Kamu bisa menggunakan **Lupis Engine** dengan empat cara sesuai alur kerjamu. Pilih versi browser untuk akses instan, aplikasi desktop untuk pembuatan game secara offline, atau Docker dan server lokal saat kamu memerlukan pengemasan aplikasi desktop **.EXE**.

:::features
- **Studio Web**: Membuka editor langsung di browser yang mendukung WebGL 2.0 tanpa instalasi.
- **Aplikasi Desktop**: Men-download rilis siap pakai dari GitHub untuk pengembangan game desktop secara offline.
- **Docker Compose**: Menjalankan editor, runtime, dan layanan ekspor backend sekaligus dengan satu perintah.
- **Self-Hosted Server**: Menjalankan editor Node.js dan layanan backend langsung di komputermu.
:::

| Metode | Paling cocok untuk | Persyaratan |
| --- | --- | --- |
| [Jalankan di browser](#launch-in-the-browser) | Pembuatan prototipe cepat dan belajar tanpa menginstal software. | Chrome, Edge, atau Firefox dengan WebGL 2.0 aktif. |
| [Download aplikasi desktop](#download-the-desktop-executable) | Alur kerja desktop offline tanpa setup command line (CLI). | Paket rilis Windows 10/11 (64-bit) dari GitHub. |
| [Jalankan dengan Docker](#run-with-docker) | Lingkungan lokal lengkap termasuk build desktop **.EXE** standalone. | Docker Desktop dan Git. |
| [Jalankan server sendiri](#run-your-own-server) | Hosting lokal dan konfigurasi server khusus tanpa Docker. | Node.js 20.19+ atau 22.12+ dan npm 10+. |

## Jalankan di browser {#launch-in-the-browser}

Cara tercepat untuk memulai adalah melalui [Lupis Engine Web Studio](https://haikal-adnan.github.io/lupis-engine-link?go=web). Proyek dan asset milikmu disimpan secara lokal di dalam browser menggunakan Origin Private File System (OPFS).

:::steps
1. Buka link **Lupis Engine Web Studio** di atas menggunakan browser modern seperti Google Chrome, Microsoft Edge, atau Mozilla Firefox.
2. Di dashboard **My Projects**, klik **New** untuk membuat proyek baru atau seret dan lepas file **.lupisproject** yang sudah ada ke halaman tersebut.
3. Klik proyekmu untuk membuka workspace [Gambaran Umum Editor](interface/editor_overview) dan mulai membuat game.
:::

> [!NOTE]
> Penyimpanan browser terikat pada profil browser yang sedang kamu gunakan. Ekspor arsip **.lupisproject** secara berkala (lihat [Proyek & Ekspor](getting_started/project_and_export)) untuk mem-backup pekerjaanmu atau memindahkannya ke perangkat lain.

## Download aplikasi desktop {#download-the-desktop-executable}

Jika kamu memilih aplikasi desktop khusus yang bekerja secara offline, download paket aplikasi resmi dari [Lupis Engine GitHub Releases](https://github.com/haikal-adnan/lupis-engine/releases).

:::steps
1. Buka halaman **GitHub Releases** pada link di atas melalui browsermu.
2. Di bagian **Assets** pada rilis terbaru, download file aplikasi desktop atau arsip untuk sistem operasimu.
3. Ekstrak arsip tersebut (jika berbentuk zip) ke sebuah folder di komputermu, lalu jalankan aplikasi **Lupis Engine**.
4. Saat dashboard **My Projects** muncul, klik **New** untuk membuat proyek offline pertamamu.
:::

## Jalankan dengan Docker {#run-with-docker}

Menjalankan dengan [Docker](https://www.docker.com/) meluncurkan editor visual, core runtime standalone, dan layanan pengemasan backend dalam satu tahap. Clone [Lupis Engine GitHub Repository](https://github.com/haikal-adnan/lupis-engine), lalu jalankan perintah berikut di terminalmu:

```bash
git clone https://github.com/haikal-adnan/lupis-engine.git
cd lupis-engine
docker compose -f start.yml up
```

Setelah container selesai dijalankan, buka editor di browser menggunakan port di bawah ini:

| Layanan | URL Lokal | Fungsi |
| --- | --- | --- |
| **Visual Editor** | http://localhost:37600 | Dashboard utama, editor scene, dan studio visual scripting. |
| **Core Runtime** | http://localhost:37601 | Server runtime game WebGL standalone. |
| **Backend Service** | http://localhost:37602 | Mengompilasi dan mengemas aplikasi desktop **.EXE** Windows. |

## Jalankan server sendiri {#run-your-own-server}

Kamu juga bisa menjalankan seluruh layanan langsung di komputermu menggunakan [Node.js](https://nodejs.org/) (versi **20.19+** atau **22.12+**) tanpa Docker.

:::steps
1. Clone [Lupis Engine GitHub Repository](https://github.com/haikal-adnan/lupis-engine) ke komputermu.
2. Buka terminal di folder **service**, instal dependensi, dan jalankan server backend pada port **37602**.
3. Buka terminal kedua di folder **editor**, instal dependensi, dan jalankan editor visual pada port **37600**.
4. Sebagai opsi tambahan, buka terminal ketiga di folder **core** dan jalankan runtime standalone pada port **37601**.
5. Buka **http://localhost:37600** di browsermu untuk mengakses studio.
:::

```bash
# Terminal 1: Layanan backend (http://localhost:37602)
cd service && npm install && npm run dev

# Terminal 2: Editor visual (http://localhost:37600)
cd editor && npm install && npm run dev

# Terminal 3: Core runtime standalone (opsional, http://localhost:37601)
cd core && npx serve -l 37601 .
```

> [!TIP]
> Biarkan terminal **service** backend tetap berjalan pada port **37602** setiap kali kamu membangun paket aplikasi desktop **.EXE** Windows.

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Mulai Cepat](getting_started/quick_start) | Kamu sudah menjalankan Lupis Engine dan ingin membuat scene pertamamu yang bisa dimainkan. |
| [Proyek & Ekspor](getting_started/project_and_export) | Kamu ingin mengatur pengaturan proyek, auto-save, atau mengekspor hasil build. |
| [Gambaran Umum Editor](interface/editor_overview) | Kamu ingin mempelajari tata letak panel workspace dan toolbar. |
| [Pengenalan](getting_started/introduction) | Kamu ingin melihat gambaran umum tentang scene, entity, komponen, dan visual scripting. |
