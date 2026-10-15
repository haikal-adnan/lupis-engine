import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Edit2, Type, Trash2, FolderOpen, ExternalLink, 
  Activity, FileEdit, Clock, Save 
} from 'lucide-vue-next';

import { 
  useConfirm,
  usePopAlert,
  usePrompt
} from '@composables/composables.js';

import { useProjectActions } from '@projects/projects.js';
import { useOPFSActions } from '@opfs/opfs.js';

export function useProjectMenu(refreshListCallback, openProjectCallback) {
  const router = useRouter();
  const { prompt } = usePrompt();
  const { confirm } = useConfirm();
  const { showPop } = usePopAlert(); 
  
  const { updateProject, deleteProject } = useProjectActions();
  const { exportToLupisProject } = useOPFSActions();

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

  const handleSaveProject = async (project) => {
    closeMenu();
    await exportToLupisProject(project.id);
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
        // Pass project.id as first argument
        await updateProject(project.id, { name: newName.trim() });
        
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
      placeholder: 'Short description...',
      confirmText: 'Save'
    });

    if (newDesc !== null && newDesc.trim() !== project.description) {
      try {
        await updateProject(project.id, { description: newDesc.trim() });
        if (refreshListCallback) refreshListCallback();
        
        showPop({
          title: 'Success',
          message: 'Project description updated successfully.',
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
      message: `Are you sure you want to delete "${project.name}"? This action will permanently delete the project folder from OPFS.`,
      type: 'danger',
      confirmText: 'Delete'
    });

    if (isConfirmed) {
      try {
        await deleteProject(project.id);
        if (refreshListCallback) refreshListCallback();
        
        showPop({
          title: 'Deleted',
          message: `Project "${project.name}" has been successfully deleted from OPFS.`,
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
      await updateProject(project.id, { status: newStatus });
      if (refreshListCallback) refreshListCallback();
      
      showPop({
        title: 'Status Updated',
        message: `Project status successfully changed to ${newStatus.replace('_', ' ')}.`,
        type: 'success'
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      showPop({
        title: 'Error',
        message: error.message || 'Failed to update project status.',
        type: 'error'
      });
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
          if (openProjectCallback) openProjectCallback(targetProject.id, false);
        }
      },
      {
        label: 'Open in New Tab',
        icon: ExternalLink,
        action: () => {
          closeMenu();
          if (openProjectCallback) openProjectCallback(targetProject.id, true);
        }
      },
      {
        label: 'Save Project',
        icon: Save,
        action: () => handleSaveProject(targetProject)
      },
      { separator: true },
      {
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