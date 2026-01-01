import { ref, computed, triggerRef } from "vue";
import { useSelection } from "@/composables/useSelection.js"; // Pastikan path sesuai
import { bus } from "@engine/Util/EventBus.js";

// Global Drag State (Agar bisa diakses lintas komponen jika perlu)
const dragHoverState = ref({
  targetId: null,
  position: null, // 'top', 'bottom', 'inside'
});

export function useHierarchyLogic() {
  const { selectedEntity, selectEntity } = useSelection();

  // --- Helper: Notifikasi Perubahan ke Engine ---
  const notifyHierarchyChange = (entityId, newParentId, newLayerId, newZIndex) => {
    bus.emit("entity:update-hierarchy", {
      _id: entityId,
      parentId: newParentId,
      layerId: newLayerId,
      transform: { zIndex: newZIndex },
    });
  };

  // --- Helper: Reset Drag State ---
  const resetDragState = () => {
    dragHoverState.value = { targetId: null, position: null };
  };

  // --- Core Logic: Handle Drop Event ---
  const handleDrop = (payload, allEntities, layers) => {
    // 1. Handle Hover State (Visual Only)
    if (payload.isHovering) {
      dragHoverState.value = {
        targetId: payload.targetId,
        position: payload.position,
      };
      return;
    }

    // 2. Handle Final Drop (Logic Update)
    const { draggedId, targetNode, isLayer, position } = payload;
    resetDragState();

    // Prevent Drop ke Diri Sendiri
    if (draggedId === targetNode.id) return;

    // Prevent Circular Dependency (Anak jadi Bapak)
    if (isDescendant(draggedId, targetNode.id, allEntities)) {
      console.warn("⚠️ Cannot move parent inside its own child.");
      return;
    }

    console.log(`Hierarchy: Moving ${draggedId} -> ${targetNode.name} (${position})`);

    let newParentId = null;
    let newLayerId = targetNode.layerId; // Default ikut target
    let newZIndex = 0;

    // --- LOGIC PENENTUAN POSISI ---
    if (position === "inside") {
      // Masuk ke dalam Folder/Layer
      newParentId = isLayer ? null : targetNode.id;
      newLayerId = isLayer ? targetNode.id : targetNode.layerId;

      // Cari Max Z-Index di anak-anak target untuk ditaruh paling atas
      const siblings = allEntities.filter(e => e.parentId === newParentId && e.layerId === newLayerId);
      const maxZ = siblings.length > 0 ? Math.max(...siblings.map(c => c.transform?.zIndex || 0)) : -1;
      newZIndex = maxZ + 1;

    } else {
      // Insert Before (Top) atau After (Bottom) -> Jadi Sibling Target
      newParentId = targetNode.parentId;
      newLayerId = targetNode.layerId;

      // Simple Reordering Logic (Idealnya backend melakukan Linked List reordering)
      // Disini kita ambil zIndex target. 
      // Backend/Engine nanti harus geser zIndex entity lain yang >= nilai ini.
      const targetZ = targetNode.transform?.zIndex || 0;
      newZIndex = position === "top" ? targetZ : targetZ + 1;
    }

    // --- EXECUTE UPDATE ---
    notifyHierarchyChange(draggedId, newParentId, newLayerId, newZIndex);
  };

  // --- Helper: Cek Circular Dependency ---
  function isDescendant(parentId, childId, entities) {
    let current = entities.find(e => e._id === childId);
    while (current && current.parentId) {
      if (current.parentId === parentId) return true;
      current = entities.find(e => e._id === current.parentId);
    }
    return false;
  }

  // --- Action: Create New Entity ---
  const createEntity = (type, parentId, layerId) => {
    bus.emit("entity:create", { type, parentId, layerId });
  };

  // --- Action: Delete Entity ---
  const deleteEntity = (id) => {
    if (confirm("Are you sure you want to delete this entity?")) {
      bus.emit("entity:delete", id);
      if (selectedEntity.value?._id === id) selectEntity(null); // Deselect jika yang dihapus aktif
    }
  };

  // --- Action: Rename Entity ---
  const renameEntity = (id, newName) => {
      // Kirim event update partial
      bus.emit("entity:modified", [{ _id: id, name: newName }]); 
  };
  
  return {
    dragHoverState,
    handleDrop,
    resetDragState,
    createEntity,
    deleteEntity,
    renameEntity,
    notifyHierarchyChange
  };
}