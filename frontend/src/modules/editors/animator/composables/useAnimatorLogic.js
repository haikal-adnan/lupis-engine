import { ref, computed, watch } from 'vue';
import { useSceneStore } from '@/stores/scene/useSceneStore.js';
import { useEditorStore } from '@/stores/useEditorStore.js';
import { usePopAlert } from '@/composables/usePopAlert';
import { usePrompt } from '@/composables/usePrompt';

const activeClipId = ref(null);
let lastEntityId = null;

export function useAnimatorLogic() {
  const sceneStore = useSceneStore();
  const editorStore = useEditorStore();
  const { showPop } = usePopAlert();
  const { prompt } = usePrompt();

  const selectedEntity = computed(() => {
    const tabId = editorStore.activeTab?.id;
    if (!tabId || !sceneStore.activeScene) return null;
    return sceneStore.activeScene.entities.find(e => e._id === tabId) || null;
  });

  const selectedEntityForOpenTab = computed(() => {
    if (!sceneStore.activeScene) return null;

    const id = sceneStore.selectedEntityIds[0];
    if (!id) return null;
    
    return sceneStore.activeScene.entities.find(e => e._id === id) || null;
  });

  const activeEntityId = computed(() => selectedEntity.value?._id);

  watch(activeEntityId, (newId) => {
    if (newId !== lastEntityId) {
      activeClipId.value = null;
      lastEntityId = newId;
    }
  }, { immediate: true });

  const realClipsData = computed(() => {
    return selectedEntity.value?.components?.SpriteAnimator?.clips || [];
  });

  const activeClipData = computed(() => {
    if (!activeClipId.value) return null;
    return realClipsData.value.find(n => n.id === activeClipId.value) || null;
  });

  const syncAnimatorData = () => {
    if (activeEntityId.value) {
      sceneStore._saveAnimatorClips(activeEntityId.value, realClipsData.value);
    }
  };

  const toggleCategory = (categoryId) => {
    if (!activeEntityId.value) return;
    const clips = [...realClipsData.value]; 
    const catIndex = clips.findIndex(c => c.id === categoryId);
    if (catIndex !== -1) {
      clips[catIndex] = { ...clips[catIndex], isOpen: !clips[catIndex].isOpen };
      sceneStore._saveAnimatorClips(activeEntityId.value, clips);
    }
  };

  const moveNode = (draggedId, targetId, position) => {
    if (!activeEntityId.value || draggedId === targetId) return;

    const clips = [...realClipsData.value];
    const dragIdx = clips.findIndex(c => c.id === draggedId);
    if (dragIdx === -1) return;
    
    const draggedNode = { ...clips[dragIdx] };

    if (position === 'root' || !targetId) {
      draggedNode.parentId = null;
      clips.splice(dragIdx, 1);
      clips.push(draggedNode);
      sceneStore._saveAnimatorClips(activeEntityId.value, clips);
      return;
    }

    const targetIdx = clips.findIndex(c => c.id === targetId);
    if (targetIdx === -1) return;
    
    const targetNode = clips[targetIdx];

    if (draggedNode.type === 'category' && position === 'inside') {
      position = 'bottom';
    }

    if (position === 'inside' && targetNode.type === 'category') {
      draggedNode.parentId = targetNode.id;
      clips[targetIdx] = { ...targetNode, isOpen: true };
    } else if (position === 'top' || position === 'bottom') {
      draggedNode.parentId = targetNode.parentId;
    }

    clips.splice(dragIdx, 1);
    
    const newTargetIdx = clips.findIndex(c => c.id === targetId);
    let insertIdx = newTargetIdx;
    
    if (position === 'bottom' || position === 'inside') {
      insertIdx += 1;
    }

    clips.splice(insertIdx, 0, draggedNode);
    sceneStore._saveAnimatorClips(activeEntityId.value, clips);
  };

  const createCategory = (targetId) => { if (activeEntityId.value) sceneStore.animatorCreateCategory(activeEntityId.value, targetId); };
  const createClip = (targetId) => { if (activeEntityId.value) sceneStore.animatorCreateClip(activeEntityId.value, targetId); };

  const deleteNode = (id) => {
    if (activeEntityId.value) {
      sceneStore.animatorDeleteNode(activeEntityId.value, id);
      if (activeClipId.value === id) activeClipId.value = null; 
    }
  };

  const duplicateNode = (id) => {
    if (activeEntityId.value) {
      const nodeData = sceneStore.animatorGetNodeClone(activeEntityId.value, id);
      if (nodeData) sceneStore.animatorPasteNode(activeEntityId.value, id, nodeData);
    }
  };

  const copyNode = (id) => {
    if (!activeEntityId.value) return;
    const nodeData = sceneStore.animatorGetNodeClone(activeEntityId.value, id);
    if (nodeData) {
      editorStore.setClipboard('animator_node', nodeData, 'copy');
      showPop({ title: 'Copied', message: 'Node copied to clipboard.', type: 'info' });
    }
  };

  const cutNode = (id) => {
    if (!activeEntityId.value) return;
    const deletedNode = sceneStore.animatorDeleteNode(activeEntityId.value, id);
    if (deletedNode) {
      editorStore.setClipboard('animator_node', { node: deletedNode, children: [] }, 'cut');
      if (activeClipId.value === id) activeClipId.value = null;
      showPop({ title: 'Cut', message: 'Node cut to clipboard.', type: 'info' });
    }
  };

  const pasteNode = (targetId) => {
    if (!activeEntityId.value) return;
    const { type, data, mode } = editorStore.clipboard;
    if (type !== 'animator_node' || !data) return;

    sceneStore.animatorPasteNode(activeEntityId.value, targetId, data);
    if (mode === 'cut') editorStore.clearClipboard();
  };

  const currentFrameIndex = computed({
      get: () => activeClipData.value?.frameIndex || 0,
      set: (val) => {
        if (activeClipData.value) {
          activeClipData.value.frameIndex = val;
          syncAnimatorData(); // Otomatis tersimpan ke komponen setiap bergeser
        }
      }
    });

    
  const hasClipboard = computed(() => {
    return editorStore.hasClipboardData && editorStore.clipboard.type === 'animator_node';
  });

  function openAnimatorEditor() {
    console.log(selectedEntityForOpenTab)
    const entity = selectedEntityForOpenTab.value;
    if (!entity) return;

    editorStore.openTab({
        id: entity._id,
        name: entity.name || 'Animator',
        type: 'animator',
        fixed: false
    });
  }

  const renameNode = async (id) => {
    if (!activeEntityId.value) return;

    // Cari node yang ingin direname untuk mendapatkan nama saat ini
    const nodeToRename = realClipsData.value.find(c => c.id === id);
    if (!nodeToRename) return;

    const isCategory = nodeToRename.type === 'category';
    const labelType = isCategory ? 'Kategori' : 'Klip';

    // Panggil usePrompt
    const newName = await prompt({
      title: `Ganti Nama ${labelType}`,
      message: `Masukkan nama baru untuk ${labelType.toLowerCase()} ini:`,
      defaultValue: nodeToRename.name,
      confirmText: 'Simpan'
    });

    // Validasi hasil input (tidak null, tidak kosong, dan tidak sama dengan sebelumnya)
    if (newName !== null && newName.trim() !== '' && newName !== nodeToRename.name) {
      sceneStore.animatorRenameNode(activeEntityId.value, id, newName.trim());
      showPop({
        title: 'Berhasil!',
        message: `Nama ${labelType.toLowerCase()} telah diubah.`,
        type: 'success'
      });
    }
  };

  return {
    hasAnimator: computed(() => !!selectedEntity.value?.components?.SpriteAnimator),
    activeClipId,
    activeClipData,
    selectedEntity,
    currentFrameIndex,
    realClipsData,
    openAnimatorEditor,
    selectClip: (id) => { activeClipId.value = id; },
    syncAnimatorData,
    toggleCategory,
    moveNode,renameNode,
    createCategory, createClip, deleteNode, duplicateNode, copyNode, cutNode, pasteNode, hasClipboard
  };
}