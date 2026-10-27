// Top-level workspace shell actions, deletion prompts, and clipboard helpers.

import { useEntityActions } from '@scenes/scenes.js';
import { useConfirm } from '@composables/composables.js';

export function useWorkspaceActions() {
  const { deleteEntity } = useEntityActions();
  const { confirm } = useConfirm();

  // Prompts for confirmation before deleting an entity
  const handleDeleteEntity = async (entity) => {
    if (!entity) return;

    const isConfirmed = await confirm({
      title: 'Delete Entity?',
      message: `Are you sure you want to delete "${entity.scriptId}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (isConfirmed) {
      deleteEntity(entity.id);
    }
  };

  // Copies an identifier string to system clipboard
  const handleCopyId = async (id) => {
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
    } catch (err) {
      console.error('Failed to copy ID:', err);
    }
  };

  return {
    handleDeleteEntity,
    handleCopyId
  };
}
