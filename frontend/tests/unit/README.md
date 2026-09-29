STANDAR UNIT TEST

1. TUJUAN

Menguji satu fungsi, modul, atau komponen secara terisolasi. Fokus pada behavior dan hasil akhir, bukan detail implementasi internal.

2. ATURAN

* Gunakan Bahasa Indonesia yang jelas untuk describe() dan it().
* Deskripsi it() tidak diawali kata "harus".
* Gunakan pola AAA: Arrange, Act, Assert.
* Setiap test harus independen dan deterministik.
* Bersihkan state, mock, dan resource setelah setiap test.
* Dependency eksternal wajib di-mock menggunakan vi.fn(), vi.mock(), atau mock factory.
* Impor modul target langsung dari file sumber, bukan barrel file atau re-export.
* vi.mock() diarahkan langsung ke file tempat dependency didefinisikan.
* Web API seperti Storage, OPFS, WebGL, Canvas, atau Worker yang tidak tersedia harus menggunakan stub/mock atau in-memory simulator.

3. MINIMUM TEST

Setiap unit minimal mencakup:

* Happy Path: kondisi normal dengan data valid.
* Error Path: input tidak valid atau terjadi kegagalan.
* Validation Path: aturan validasi berjalan sesuai batasan.

Tambahkan jika relevan:

* null / undefined.
* Boundary value.
* Operasi async.
* Cancellation dan race condition.
* Resource cleanup atau $reset.

4. STRUKTUR

Gunakan describe() untuk kelompok modul/fitur dan it() untuk satu behavior spesifik.

JavaScript

```javascript
describe('Manajemen Profil', () => {
  describe('Pembaruan Data Pengguna', () => {
    it('memperbarui profil saat data valid', async () => {
      const user = { id: 1, name: 'Budi' }
      const saveService = vi.fn().mockResolvedValue({ success: true })

      const result = await saveService(user)

      expect(result.success).toBe(true)
      expect(saveService).toHaveBeenCalledWith(user)
    })

    it('menangani kegagalan penyimpanan', async () => {
      const saveService = vi.fn().mockRejectedValue(new Error('Koneksi terputus'))

      await expect(saveService()).rejects.toThrow('Koneksi terputus')
    })
  })
})
```

5. KUALITAS

Test harus:

* Mudah dipahami.
* Independen dari test lain.
* Deterministik.
* Gagal ketika behavior yang diuji rusak.
* Tetap berhasil setelah refactoring internal yang tidak mengubah behavior.
* Menguji behavior nyata, bukan sekadar mengejar code coverage.
