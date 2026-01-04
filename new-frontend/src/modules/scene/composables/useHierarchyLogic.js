import { ref, computed } from 'vue';

// ==========================================
// 1. DATA DUMMY RAMAI (Simulasi Proyek Riil)
// ==========================================

const dummyLayers = [
  { id: "layer_bg", name: "01. Background", order: 0 },
  { id: "layer_env", name: "02. Environment", order: 1 },
  { id: "layer_entities", name: "03. Entities", order: 2 },
  { id: "layer_vfx", name: "04. VFX & Lights", order: 3 },
  { id: "layer_ui", name: "05. User Interface", order: 4 }
];

const dummyEntities = [
  // --- LAYER: BACKGROUND ---
  { _id: "ent_sky", type: "entity", name: "Sky_Parallax", layerId: "layer_bg", parentId: null, transform: { zIndex: 0 } },
  { _id: "ent_clouds", type: "group", name: "Clouds_Group", layerId: "layer_bg", parentId: null, transform: { zIndex: 1 }, _editor: { expanded: true } },
  { _id: "ent_cloud_1", type: "entity", name: "Cloud_Large_01", layerId: "layer_bg", parentId: "ent_clouds", transform: { zIndex: 0 } },
  { _id: "ent_cloud_2", type: "entity", name: "Cloud_Small_01", layerId: "layer_bg", parentId: "ent_clouds", transform: { zIndex: 1 } },

  // --- LAYER: ENVIRONMENT ---
  { _id: "ent_tilemap", type: "entity", name: "Ground_Tilemap", layerId: "layer_env", parentId: null, transform: { zIndex: 0 } },
  { _id: "ent_trees", type: "group", name: "Forest_Props", layerId: "layer_env", parentId: null, transform: { zIndex: 1 }, _editor: { expanded: false } },
  { _id: "ent_tree_1", type: "entity", name: "Oak_Tree_A", layerId: "layer_env", parentId: "ent_trees", transform: { zIndex: 0 } },
  { _id: "ent_tree_2", type: "entity", name: "Oak_Tree_B", layerId: "layer_env", parentId: "ent_trees", transform: { zIndex: 1 } },
  { _id: "ent_bush", type: "entity", name: "Bush_Green", layerId: "layer_env", parentId: null, transform: { zIndex: 2 } },

  // --- LAYER: ENTITIES ---
  { _id: "ent_player_grp", type: "group", name: "Player_Character", layerId: "layer_entities", parentId: null, transform: { zIndex: 0 }, _editor: { expanded: true } },
  { _id: "ent_player_sprite", type: "entity", name: "Hero_Sprite", layerId: "layer_entities", parentId: "ent_player_grp", transform: { zIndex: 0 } },
  { _id: "ent_player_weapon", type: "entity", name: "Sword_Equipped", layerId: "layer_entities", parentId: "ent_player_grp", transform: { zIndex: 1 } },
  
  { _id: "ent_enemy_spawner", type: "group", name: "Enemies_Container", layerId: "layer_entities", parentId: null, transform: { zIndex: 1 }, _editor: { expanded: true } },
  { _id: "ent_slime_1", type: "entity", name: "Blue_Slime_Lv1", layerId: "layer_entities", parentId: "ent_enemy_spawner", transform: { zIndex: 0 } },
  { _id: "ent_slime_2", type: "entity", name: "Blue_Slime_Lv1_Var", layerId: "layer_entities", parentId: "ent_enemy_spawner", transform: { zIndex: 1 } },
  { _id: "ent_boss", type: "entity", name: "Skeleton_King_Boss", layerId: "layer_entities", parentId: "ent_enemy_spawner", transform: { zIndex: 2 } },

  // --- LAYER: VFX ---
  { _id: "ent_torch_1", type: "group", name: "Torch_Point_Light", layerId: "layer_vfx", parentId: null, transform: { zIndex: 0 } },
  { _id: "ent_torch_fire", type: "entity", name: "Fire_Particles", layerId: "layer_vfx", parentId: "ent_torch_1", transform: { zIndex: 0 } },
  { _id: "ent_torch_light", type: "entity", name: "Light_Radius", layerId: "layer_vfx", parentId: "ent_torch_1", transform: { zIndex: 1 } },
  { _id: "ent_fog", type: "entity", name: "Global_Fog_Overlay", layerId: "layer_vfx", parentId: null, transform: { zIndex: 1 } },

  // --- LAYER: UI ---
  { _id: "ent_canvas", type: "group", name: "Main_Canvas", layerId: "layer_ui", parentId: null, transform: { zIndex: 0 }, _editor: { expanded: true } },
  { _id: "ent_hp_bar", type: "group", name: "HP_Bar_Widget", layerId: "layer_ui", parentId: "ent_canvas", transform: { zIndex: 0 } },
  { _id: "ent_hp_bg", type: "entity", name: "Bar_Background", layerId: "layer_ui", parentId: "ent_hp_bar", transform: { zIndex: 0 } },
  { _id: "ent_hp_fill", type: "entity", name: "Bar_Fill_Red", layerId: "layer_ui", parentId: "ent_hp_bar", transform: { zIndex: 1 } },
  { _id: "ent_score", type: "entity", name: "Score_Label_Text", layerId: "layer_ui", parentId: "ent_canvas", transform: { zIndex: 1 } },
  { _id: "ent_pause_btn", type: "entity", name: "Button_Pause", layerId: "layer_ui", parentId: "ent_canvas", transform: { zIndex: 2 } }
];

const entities = ref(dummyEntities);
const layers = ref(dummyLayers);

export function useHierarchyLogic() {

  // ==========================================
  // 2. TREE BUILDER (Sama seperti sebelumnya)
  // ==========================================
  const treeData = computed(() => {
    const map = {};
    const processedEntities = entities.value.map(e => {
      const copy = { ...e, children: [] };
      map[e._id] = copy;
      return copy;
    });

    processedEntities.forEach(ent => {
      if (ent.parentId && map[ent.parentId]) {
        map[ent.parentId].children.push(ent);
      }
    });

    Object.values(map).forEach(node => {
      node.children.sort((a, b) => (a.transform?.zIndex || 0) - (b.transform?.zIndex || 0));
    });

    return layers.value.map(layer => {
      const layerChildren = processedEntities.filter(e => e.layerId === layer.id && !e.parentId);
      layerChildren.sort((a, b) => (a.transform?.zIndex || 0) - (b.transform?.zIndex || 0));

      return {
        id: layer.id,
        _id: layer.id,
        name: layer.name,
        type: 'layer',
        children: layerChildren
      };
    });
  });

  // ==========================================
  // 3. VALIDATION: IS ANCESTOR
  // ==========================================
  const isAncestor = (ancestorId, potentialDescendantId) => {
    if (ancestorId === potentialDescendantId) return true;

    let current = entities.value.find(e => e._id === potentialDescendantId);
    
    while (current && current.parentId) {
      if (current.parentId === ancestorId) return true;
      current = entities.value.find(e => e._id === current.parentId);
    }
    
    return false;
  };

  // ==========================================
  // 4. CORE ACTION: MOVE ENTITY
  // ==========================================
  const moveEntity = (draggedId, targetNode, position) => {
    if (!draggedId || !targetNode) return;
    const targetId = targetNode._id || targetNode.id;
    if (draggedId === targetId) return;

    // Block Circular Parenting
    if (targetNode.type !== 'layer' && isAncestor(draggedId, targetId)) {
        console.warn("🚫 Blocked: Cannot move parent into child.");
        return; 
    }

    const draggedItem = entities.value.find(e => e._id === draggedId);
    if (!draggedItem) return;

    let newParentId = null;
    let newLayerId = null;
    let insertionType = 'append'; 
    let referenceSiblingId = null;

    if (targetNode.type === 'layer') {
      newParentId = null;
      newLayerId = targetNode.id;
      insertionType = 'append';
    } else {
      if (position === 'inside') {
        newParentId = targetNode._id;
        newLayerId = targetNode.layerId;
        insertionType = 'append';
      } else {
        newParentId = targetNode.parentId || null;
        newLayerId = targetNode.layerId;
        referenceSiblingId = targetNode._id;
        insertionType = position === 'top' ? 'before' : 'after';
      }
    }

    // Get current target context
    let targetSiblings = entities.value.filter(e => 
      e.layerId === newLayerId && 
      e.parentId === newParentId && 
      e._id !== draggedId 
    );

    targetSiblings.sort((a, b) => (a.transform?.zIndex || 0) - (b.transform?.zIndex || 0));

    // Insertion logic
    if (insertionType === 'append') {
      targetSiblings.push(draggedItem);
    } else {
      const targetIndex = targetSiblings.findIndex(e => e._id === referenceSiblingId);
      if (targetIndex !== -1) {
        if (insertionType === 'before') targetSiblings.splice(targetIndex, 0, draggedItem);
        else targetSiblings.splice(targetIndex + 1, 0, draggedItem);
      } else {
        targetSiblings.push(draggedItem);
      }
    }

    // Update dragged object properties
    draggedItem.parentId = newParentId;
    draggedItem.layerId = newLayerId;

    // Reset Z-Index siblings
    targetSiblings.forEach((item, index) => {
      if (!item.transform) item.transform = { zIndex: 0 };
      item.transform.zIndex = index;
    });

    // Reassign array to trigger Vue reactivity
    entities.value = [...entities.value];
  };

  return {
    treeData,
    moveEntity
  };
}