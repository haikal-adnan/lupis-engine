import { ref, computed } from 'vue';
import { Edit2, Type, Trash2, FolderOpen, ExternalLink } from 'lucide-vue-next';
import { usePrompt } from '@/composables/usePrompt';
import { useConfirm } from '@/composables/useConfirm';
import { usePopAlert } from '@/composables/usePopAlert'; 
import { useProjectBackend } from '@/services/api/backend/useProjectBackend.js';

export function useProjectMenu(refreshListCallback, openProjectCallback) {
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

  const contextMenuItems = computed(() => {
    const targetProject = menu.value.item;
    
    if (!targetProject) return [];

    return [
      {
        label: targetProject.name,
        disabled: true,
        icon: null
      },
      { separator: true },
      {
        label: 'Open',
        icon: FolderOpen,
        action: () => {
          closeMenu();
          if (openProjectCallback) openProjectCallback(targetProject._id, false);
        }
      },
      {
        label: 'Open in New Tab',
        icon: ExternalLink,
        action: () => {
          closeMenu();
          if (openProjectCallback) openProjectCallback(targetProject._id, true);
        }
      },
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
    ];
  });

  return {
    menu,
    handleContextMenu,
    closeMenu,
    contextMenuItems
  };
}