import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Edit2, Type, Trash2, FolderOpen, ExternalLink, 
  Activity, FileEdit, Clock, Globe, Settings, Globe2 // Tambahkan Globe dan Settings
} from 'lucide-vue-next';
import { usePrompt } from '@/composables/usePrompt';
import { useConfirm } from '@/composables/useConfirm';
import { usePopAlert } from '@/composables/usePopAlert'; 
import { useProjectBackend } from '@/services/api/backend/useProjectBackend.js';

export function useProjectMenu(refreshListCallback, openProjectCallback) {
  const router = useRouter();
  const { prompt } = usePrompt();
  const { confirm } = useConfirm();
  const { showPop } = usePopAlert(); 
  
  const { updateProject, deleteProject } = useProjectBackend();

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
      title: 'Rename Project',
      message: 'Enter a new name for your project:',
      defaultValue: project.name,
      placeholder: 'Project Name...',
      confirmText: 'Save'
    });

    if (newName && newName.trim() !== "" && newName !== project.name) {
      try {
        await updateProject(project._id, { name: newName.trim() });
        if (refreshListCallback) refreshListCallback();
        
        showPop({
          title: 'Success',
          message: 'Project name updated successfully.',
          type: 'success'
        });
      } catch (error) {
        console.error("Failed to rename project:", error);
        showPop({
          title: 'Error',
          message: error.message || 'Failed to rename project.',
          type: 'error'
        });
      }
    }
  };

  const handleEditDescription = async (project) => {
    closeMenu();
    const newDesc = await prompt({
      title: 'Edit Description',
      message: 'Enter a new description:',
      defaultValue: project.description || '',
      placeholder: 'A short description...',
      confirmText: 'Save'
    });

    if (newDesc !== null && newDesc.trim() !== project.description) {
      try {
        await updateProject(project._id, { description: newDesc.trim() });
        if (refreshListCallback) refreshListCallback();
        
        showPop({
          title: 'Success',
          message: 'Project description updated.',
          type: 'success'
        });
      } catch (error) {
        console.error("Failed to update description:", error);
        showPop({
          title: 'Error',
          message: error.message || 'Failed to update description.',
          type: 'error'
        });
      }
    }
  };

  const handleDelete = async (project) => {
    closeMenu();
    const isConfirmed = await confirm({
      title: 'Delete Project?',
      message: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete'
    });

    if (isConfirmed) {
      try {
        await deleteProject(project._id);
        if (refreshListCallback) refreshListCallback();
        
        showPop({
          title: 'Deleted',
          message: `Project "${project.name}" has been deleted.`,
          type: 'success'
        });
      } catch (error) {
        console.error("Failed to delete project:", error);
        showPop({
          title: 'Error',
          message: error.message || 'Failed to delete project.',
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
        title: 'Status Updated',
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

  const contextMenuItems = computed(() => {
    const targetProject = menu.value.item;
    if (!targetProject) return [];

    const isPublished = targetProject.status === 'PUBLISHED';

    let items = [
      // ... (Menu Open, dll aslinya)
    ];

    // [UBAH BAGIAN INI] Logika Menu Publish / Edit Published
    if (isPublished) {
      items.push(
        {
          label: 'View Published Game',
          icon: Globe2,
          action: () => {
            closeMenu();
            // Cek jika kita menyimpan publishedSlug di settings, jika tidak gunakan ID project/slug dummy
            const gameSlug = targetProject.settings?.publishedSlug || targetProject._id; 
            router.push(`/game/${gameSlug}`); // Sesuaikan route detail publisnya
          }
        },
        {
          label: 'Edit Published Data',
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

      // Logika Change Status HANYA jika belum published
      items.push({
        label: 'Change Status',
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
        label: 'Rename', 
        icon: Edit2, 
        action: () => handleEditName(targetProject) 
      },
      { 
        label: 'Edit Description', 
        icon: Type, 
        action: () => handleEditDescription(targetProject) 
      },
      { separator: true },
      { 
        label: 'Delete Project', 
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