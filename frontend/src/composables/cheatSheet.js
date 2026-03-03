import { useAlert } from '@/composables/useAlert';
import { useConfirm } from '@/composables/useConfirm';
import { usePopAlert } from '@/composables/usePopAlert';
import { usePrompt } from '@/composables/usePrompt';

const { alert } = useAlert();
const { confirm } = useConfirm();
const { showPop } = usePopAlert();
const { prompt } = usePrompt();

/*

Alert: info, success, warning, error

Confirm: info, danger, warning

PopAlert: info, success, warning, error

*/

const handleProjectActions = async () => {
  
  // --- A. ALERT (Peringatan Tunggal) ---
  // Digunakan untuk validasi yang menghentikan alur kerja
  const isDuplicate = checkDuplicate(newId);
  if (isDuplicate) {
    await alert({
      title: 'ID Duplikat',
      message: `ID "${newId}" sudah digunakan di scene ini.`,
      type: 'warning'
    });
    return resetInput(); // Dijalankan SETELAH user klik OK
  }

  // --- B. PROMPT (Input User) ---
  // Digunakan untuk mengambil input teks singkat
  const newName = await prompt({
    title: 'Ganti Nama Proyek',
    message: 'Masukkan nama baru untuk proyek ini:',
    defaultValue: 'Proyek Baru',
    confirmText: 'Simpan'
  });

  if (newName !== null && newName.trim() !== '') {
    
    // --- C. CONFIRM (Konfirmasi Aksi) ---
    // Digunakan untuk aksi berbahaya/irreversible (seperti hapus)
    const isConfirmed = await confirm({
      title: 'Konfirmasi Perubahan',
      message: `Apakah Anda yakin ingin mengganti nama menjadi "${newName}"?`,
      type: 'info',
      confirmText: 'Ya, Ubah'
    });

    if (isConfirmed) {
      try {
        await api.updateProject(newName);

        // --- D. POPALERT (Notifikasi Toast/Pop-up) ---
        // Tidak bersifat blocking (tidak perlu await)
        showPop({
          title: 'Berhasil!',
          message: 'Nama proyek telah diperbarui.',
          type: 'success'
        });
      } catch (error) {
        showPop({
          title: 'Gagal',
          message: error.message || 'Terjadi kesalahan server.',
          type: 'error'
        });
      }
    }
  }
};