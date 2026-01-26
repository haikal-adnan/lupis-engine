import { useSceneStore } from '@/stores/scene/useSceneStore.js';
import { useConfirm } from '@/composables/useConfirm.js';

export function useEditorActions() {
  const sceneStore = useSceneStore();
  const { confirm } = useConfirm();

  // Handle Delete Entity dengan Konfirmasi
  const handleDeleteEntity = async (entity) => {
    if (!entity) return;

    const isConfirmed = await confirm({
      title: 'Delete Entity?',
      message: `Are you sure you want to delete "${entity.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger' // Memberikan warna merah pada tombol konfirmasi
    });

    if (isConfirmed) {
      sceneStore.deleteEntity(entity._id);
    }
  };

  // Handle Copy ID ke Clipboard
  const handleCopyId = async (id) => {
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      // Opsional: Jika Anda punya toast notification, bisa dipanggil di sini
      // console.log('ID Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy ID:', err);
    }
  };

  return {
    handleDeleteEntity,
    handleCopyId
  };
}