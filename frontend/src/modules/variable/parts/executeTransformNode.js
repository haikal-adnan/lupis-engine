import { useSceneStore } from '@/stores/scene/useSceneStore';

/**
 * Menangani eksekusi node Get/Set Transform
 * @param {Object} node - Data node (type, id, dll)
 * @param {Object} inputs - Key-value pair dari input yang masuk
 * @param {String} contextEntityId - ID Entity pemilik script (self)
 */
export function executeTransform(node, inputs, contextEntityId) {
  const sceneStore = useSceneStore();
  
  // Tentukan target: Bisa dari input 'target_id' (jika ada) atau diri sendiri
  const targetId = inputs.target_id || contextEntityId;
  
  // Ambil referensi data saat ini dari store
  const scene = sceneStore.activeScene;
  const entity = scene?.entities.find(e => e._id === targetId);
  
  if (!entity || !entity.components.Transform) {
    console.warn(`[ExecuteTransform] Entity or Transform not found: ${targetId}`);
    return {}; 
  }

  const currentT = entity.components.Transform;

  // --- LOGIC: GET TRANSFORM ---
  if (node.type === 'get_transform') {
    return {
      x: currentT.x,
      y: currentT.y,
      rotation: currentT.rotation,
      width: currentT.width,
      height: currentT.height,
      pivotX: currentT.pivotX ?? 0.5,
      pivotY: currentT.pivotY ?? 0.5
    };
  }

  // --- LOGIC: SET TRANSFORM ---
  if (node.type === 'set_transform') {
    const updates = {};
    
    // Fungsi helper: Pastikan undefined tidak mereset jadi 0
    // Kita hanya update jika input !== undefined
    const checkVal = (val) => (val !== undefined && val !== null) ? Number(val) : undefined;

    const newX = checkVal(inputs.x);
    const newY = checkVal(inputs.y);
    const newRot = checkVal(inputs.rotation);
    const newW = checkVal(inputs.width);
    const newH = checkVal(inputs.height);
    const newPx = checkVal(inputs.pivotX);
    const newPy = checkVal(inputs.pivotY);

    // Susun objek update (hanya yg ada nilainya)
    if (newX !== undefined) updates.x = newX;
    if (newY !== undefined) updates.y = newY;
    if (newRot !== undefined) updates.rotation = newRot;
    if (newW !== undefined) updates.width = newW;
    if (newH !== undefined) updates.height = newH;
    if (newPx !== undefined) updates.pivotX = newPx;
    if (newPy !== undefined) updates.pivotY = newPy;

    // Lakukan Patch ke Store jika ada update
    if (Object.keys(updates).length > 0) {
      sceneStore.patchComponent(targetId, 'Transform', updates);
    }

    // Return Output (Pass-through)
    // Jika ada update, gunakan nilai baru. Jika tidak, gunakan nilai lama dari store.
    return {
      out: true, // Trigger execution flow
      x: newX !== undefined ? newX : currentT.x,
      y: newY !== undefined ? newY : currentT.y,
      rotation: newRot !== undefined ? newRot : currentT.rotation,
      width: newW !== undefined ? newW : currentT.width,
      height: newH !== undefined ? newH : currentT.height,
      pivotX: newPx !== undefined ? newPx : currentT.pivotX,
      pivotY: newPy !== undefined ? newPy : currentT.pivotY
    };
  }

  return {};
}