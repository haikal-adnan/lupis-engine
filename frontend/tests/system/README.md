STANDAR SYSTEM TEST

1. TUJUAN

Menguji fitur secara utuh dari sudut pandang pengguna atau berdasarkan alur bisnis utama.

System Test berfokus pada alur end-to-end dan hasil akhir, bukan pengujian setiap fungsi internal.

2. ATURAN

* Uji fitur berdasarkan alur pengguna nyata.
* Fokus pada behavior dan hasil akhir sistem.
* Gunakan Bahasa Indonesia yang jelas untuk describe() dan it().
* Deskripsi it() tidak diawali kata "harus".
* Gunakan pola AAA: Arrange, Act, Assert.
* Setiap test harus independen dan deterministik.
* Gunakan kondisi sedekat mungkin dengan lingkungan penggunaan sebenarnya.
* Jangan menguji fungsi internal secara terpisah jika behavior tersebut sudah tercakup dalam alur.
* Mock hanya dependency eksternal yang memang diperlukan untuk menjaga test tetap stabil.

3. MINIMUM TEST

Setiap fitur yang memiliki alur end-to-end minimal mencakup:

* Alur Berhasil: proses utama berjalan dari awal hingga akhir.
* Alur Gagal: kegagalan menghasilkan error, feedback, atau indikator UI yang sesuai.
* State Akhir: kondisi sistem setelah proses selesai sesuai dengan ekspektasi bisnis.

Contoh alur:

Pengguna membuat proyek → mengubah pengaturan → menyimpan proyek → memuat ulang proyek → data tetap sesuai.

4. TAMBAHKAN JIKA RELEVAN

* Input kosong atau tidak valid.
* Boundary value.
* Kegagalan penyimpanan.
* Kegagalan jaringan.
* Cancellation.
* Perubahan state setelah reload.
* Data tetap konsisten setelah proses selesai.

5. STRUKTUR

JavaScript

```javascript
describe('Manajemen Proyek', () => {
  describe('Penyimpanan Proyek', () => {
    it('membuat, menyimpan, dan memuat kembali proyek', async () => {
      const project = {
        name: 'Project Baru',
        settings: {
          width: 1920,
          height: 1080
        }
      }

      const created = await createProject(project)
      await saveProject(created)
      const loaded = await loadProject(created.id)

      expect(loaded.name).toBe('Project Baru')
      expect(loaded.settings.width).toBe(1920)
      expect(loaded.settings.height).toBe(1080)
    })

    it('menampilkan feedback ketika penyimpanan gagal', async () => {
      await expect(saveProject(null)).rejects.toThrow()
    })
  })
})
```

6. BATASAN

System Test tidak perlu menguji:

* Setiap fungsi internal secara terpisah.
* Setiap kombinasi implementasi internal.
* Detail struktur state yang tidak terlihat dari behavior sistem.

Fokus pada milestone dan hasil yang dapat diamati pengguna.

7. KUALITAS

Test harus:

* Mewakili alur pengguna atau bisnis yang nyata.
* Memvalidasi hasil akhir sistem.
* Independen dan deterministik.
* Mendeteksi kegagalan yang berdampak pada alur pengguna.
* Tidak terlalu bergantung pada detail implementasi internal.
