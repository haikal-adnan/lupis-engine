STANDAR INTEGRATION TEST

1. TUJUAN

Menguji interaksi dan aliran data antar beberapa modul yang bekerja bersama, seperti Store dengan Service, Service dengan Repository, atau Store dengan Store lainnya.

2. ATURAN

* Fokus pada behavior dan aliran data antar-modul.
* Gunakan Bahasa Indonesia yang jelas untuk describe() dan it().
* Deskripsi it() tidak diawali kata "harus".
* Gunakan pola AAA: Arrange, Act, Assert.
* Setiap test harus independen dan deterministik.
* Bersihkan state, mock, dan resource setelah setiap test.
* Impor modul yang diuji langsung dari file sumber, bukan barrel file atau re-export.
* Dependency di luar batas sistem yang diuji tetap di-mock menggunakan vi.fn(), vi.mock(), atau mock factory.
* API server, database eksternal, file system, I/O disk, Web Bridge, dan layanan eksternal tidak perlu benar-benar digunakan.
* Web API yang tidak tersedia di lingkungan test dapat disimulasikan menggunakan stub/mock atau in-memory simulator.
* Untuk pengujian buruk tambahkan di awal dengan [Bad Path].

3. MINIMUM TEST

Setiap integration minimal mencakup:

* Integrasi Berhasil: data dari satu modul diterima dan diproses modul lain dengan benar.
* Kegagalan Dependency: error dari dependency ditangani dan state/UI diperbarui dengan benar.
* Konsistensi State: perubahan pada satu modul memperbarui modul terkait.

Tambahkan jika relevan:

* null / undefined.
* Boundary value.
* Operasi async.
* Race condition dan cancellation.
* Reset atau synchronization.
* Resource cleanup.

4. BATAS MOCKING

Mock hanya dependency yang berada di luar sistem yang sedang diuji.

Contoh:

Store → Service → Repository

Jika yang diuji adalah interaksi Store dengan Service, Repository dapat di-mock.

Jika yang diuji adalah interaksi Service dengan Repository, Service dan Repository dapat digunakan secara nyata sementara API atau database eksternal di-mock.

5. STRUKTUR

JavaScript

```javascript
describe('Manajemen Profil', () => {
  describe('Integrasi Store dengan Service', () => {
    it('memperbarui state setelah data berhasil disimpan', async () => {
      const saveService = vi.fn().mockResolvedValue({
        success: true,
        data: { id: 1, name: 'Budi' }
      })

      const result = await saveService({ id: 1, name: 'Budi' })

      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Budi')
      expect(saveService).toHaveBeenCalled()
    })

    it('memperbarui state error ketika service gagal', async () => {
      const saveService = vi.fn().mockRejectedValue(new Error('Koneksi terputus'))

      await expect(saveService()).rejects.toThrow('Koneksi terputus')
    })
  })
})
```

6. KUALITAS

Test harus:

* Menguji interaksi antar-modul yang nyata.
* Tidak terlalu bergantung pada detail implementasi.
* Independen dan deterministik.
* Mendeteksi kesalahan pada aliran data.
* Tetap valid setelah refactoring internal.
* Tidak berubah menjadi Unit Test dengan terlalu banyak mocking.
