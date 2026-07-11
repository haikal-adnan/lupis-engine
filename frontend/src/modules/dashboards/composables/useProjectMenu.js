import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Edit2, Type, Trash2, FolderOpen, ExternalLink, 
  Activity, FileEdit, Clock, Globe, Settings, Globe2, UploadCloud 
} from 'lucide-vue-next';
import { usePrompt } from '@/composables/usePrompt';
import { useConfirm } from '@/composables/useConfirm';
import { usePopAlert } from '@/composables/usePopAlert'; 
import { useProjectBackend } from '@/services/api/backend/useProjectBackend.js';
import { usePublishBackend } from '@/services/api/backend/usePublishBackend.js';

export function useProjectMenu(refreshListCallback, openProjectCallback) {
  const router = useRouter();
  const { prompt } = usePrompt();
  const { confirm } = useConfirm();
  const { showPop } = usePopAlert(); 
  
  const { updateProject, deleteProject } = useProjectBackend();
  const { republishGame } = usePublishBackend();

  const menu = ref({ visible: false, x: 0, y: 0, item: null });

  const handleContextMenu = (e, project) => {
    menu.value = { 
      visible: true, 
      x: e.clientX, 
      y: e.clientY, 
      item: project 
    };
  };

  const closeMenu = () => {
    menu.value.visible = false;
  };

  const handleEditName = async (project) => {
    closeMenu();
    const newName = await prompt({
      title: 'Ubah Nama Proyek',
      message: 'Masukkan nama baru untuk proyek Anda:',
      defaultValue: project.name,
      placeholder: 'Nama Proyek...',
      confirmText: 'Simpan'
    });

  if (newName && newName.trim() !== "" && newName !== project.name) {
      try {
        await updateProject(project._id, { name: newName.trim() });
        if (refreshListCallback) refreshListCallback();
        
        showPop({
          title: 'Sukses',
          message: 'Nama proyek berhasil diperbarui.',
          type: 'success'
        });
      } catch (error) {
        console.error("Failed to rename project:", error);
        showPop({
          title: 'Error',
          message: error.message || 'Gagal mengubah nama proyek.',
          type: 'error'
        });
      }
    }
  };

  const handleEditDescription = async (project) => {
    closeMenu();
    const newDesc = await prompt({
      title: 'Ubah Deskripsi',
      message: 'Masukkan deskripsi baru:',
      defaultValue: project.description || '',
      placeholder: 'Deskripsi singkat...',
      confirmText: 'Simpan'
    });

    if (newDesc !== null && newDesc.trim() !== project.description) {
      try {
        await updateProject(project._id, { description: newDesc.trim() });
        if (refreshListCallback) refreshListCallback();
        
        showPop({
          title: 'Sukses',
          message: 'Deskripsi proyek berhasil diperbarui.',
          type: 'success'
        });
      } catch (error) {
        console.error("Failed to update description:", error);
        showPop({
          title: 'Error',
          message: error.message || 'Gagal memperbarui deskripsi.',
          type: 'error'
        });
      }
    }
  };

  const handleDelete = async (project) => {
    closeMenu();
    const isConfirmed = await confirm({
      title: 'Hapus Proyek?',
      message: `Apakah Anda yakin ingin menghapus "${project.name}"? Tindakan ini tidak dapat dibatalkan.`,
      type: 'danger',
      confirmText: 'Hapus'
    });

    if (isConfirmed) {
      try {
        await deleteProject(project._id);
        if (refreshListCallback) refreshListCallback();
        
        showPop({
          title: 'Terhapus',
          message: `Proyek "${project.name}" telah berhasil dihapus.`,
          type: 'success'
        });
      } catch (error) {
        console.error("Failed to delete project:", error);
        showPop({
          title: 'Error',
          message: error.message || 'Gagal menghapus proyek.',
          type: 'error'
        });
      }
    }
  };

  const handleChangeStatus = async (project, newStatus) => {
    closeMenu();
    if (project.status === newStatus) return;

    try {
      await updateProject(project._id, { status: newStatus });
      if (refreshListCallback) refreshListCallback();
      
      showPop({
        title: 'Status Diperbarui',
        message: `Status proyek berhasil diubah menjadi ${newStatus.replace('_', ' ')}.`,
        type: 'success'
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      showPop({
        title: 'Error',
        message: error.message || 'Gagal mengubah status proyek.',
        type: 'error'
      });
    }
  };

  const handleRepublish = async (project) => {
    closeMenu();
    const isConfirmed = await confirm({
      title: 'Perbarui Game yang Dipublish?',
      message: `PERINGATAN: Semua data game "${project.name}" yang telah dipublish akan dihapus dan ditimpa dengan data proyek (draft) terbaru. Apakah Anda yakin ingin melanjutkan?`,
      type: 'warning',
      confirmText: 'Ya, Timpa Data'
    });

    if (isConfirmed) {
      try {
        showPop({ title: 'Memperbarui...', message: 'Sedang memperbarui game dengan data terbaru...', type: 'info' });
        
        await republishGame(project._id);
        
        showPop({
          title: 'Sukses',
          message: 'Game berhasil diperbarui ke versi terbaru!',
          type: 'success'
        });
      } catch (error) {
        console.error("Failed to republish game:", error);
        showPop({
          title: 'Error',
          message: error.message || 'Gagal memperbarui game.',
          type: 'error'
        });
      }
    }
  };

  const contextMenuItems = computed(() => {
    const targetProject = menu.value.item;
    if (!targetProject) return [];

    const isPublished = targetProject.status === 'PUBLISHED';

    let items = [
      {
        label: targetProject.name,
        disabled: true,
        icon: null
      },
      { separator: true },
      {
        label: 'Buka',
        icon: FolderOpen,
        action: () => {
          closeMenu();
          if (openProjectCallback) openProjectCallback(targetProject._id, false);
        }
      },
      {
        label: 'Buka di Tab Baru',
        icon: ExternalLink,
        action: () => {
          closeMenu();
          if (openProjectCallback) openProjectCallback(targetProject._id, true);
        }
      },
      { separator: true }
    ];

    if (isPublished) {
      items.push(
        {
          label: 'Lihat Game yang Dipublish',
          icon: Globe2,
          action: () => {
            closeMenu();
            const gameSlug = targetProject.settings?.publishedSlug || targetProject._id; 
            router.push(`/game/${gameSlug}`); 
          }
        },
        {
          label: 'Perbarui Game yang Dipublish',
          icon: UploadCloud,
          action: () => handleRepublish(targetProject)
        },
        {
          label: 'Ubah Data Publikasi',
          icon: Settings,
          action: () => {
            closeMenu();
            router.push(`/publish/${targetProject._id}`);
          }
        }
      );
    } else {
      items.push({
        label: 'Publish Game',
        icon: Globe,
        action: () => {
          closeMenu();
          router.push(`/publish/${targetProject._id}`);
        }
      });

      items.push({
        label: 'Ubah Status',
        icon: Activity,
        children: [
          {
            label: 'Draft',
            icon: FileEdit,
            action: () => handleChangeStatus(targetProject, 'DRAFT')
          },
          {
            label: 'In Progress',
            icon: Clock,
            action: () => handleChangeStatus(targetProject, 'IN_PROGRESS')
          }
        ]
      });
    }

    items.push(
      { separator: true },
      { 
        label: 'Ubah Nama', 
        icon: Edit2, 
        action: () => handleEditName(targetProject) 
      },
      { 
        label: 'Ubah Deskripsi', 
        icon: Type, 
        action: () => handleEditDescription(targetProject) 
      },
      { separator: true },
      { 
        label: 'Hapus Proyek', 
        icon: Trash2, 
        action: () => handleDelete(targetProject) 
      }
    );

    return items;
  });

  return {
    menu,
    handleContextMenu,
    closeMenu,
    contextMenuItems
  };
}