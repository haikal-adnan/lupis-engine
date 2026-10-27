import { GenerateUUID, sanitizeScriptId } from '@utils/utils.js';

// Constructs and normalizes rendering and simulation layer parameters
export const layerSchema = (data = {}) => {
  const scriptId = sanitizeScriptId(
    data.scriptId || `layer_${GenerateUUID().slice(0, 8)}`,
    `layer_${GenerateUUID().slice(0, 8)}`
  );

  const layer = {
    id: data.id || `layer_${GenerateUUID()}`,
    scriptId: scriptId,
    zIndex: Number(data.zIndex ?? 0), 
    orderIndex: Number(data.orderIndex ?? 0),
    active: data.active ?? true,
    visible: data.visible ?? true,
    locked: data.locked ?? false,
    opacity: Number(data.opacity ?? 1.0),
    freezeInput: typeof data.freezeInput === 'boolean' ? data.freezeInput : Boolean(data.freezeInput?.active ?? false),
    freezeInputType: data.freezeInputType || (typeof data.freezeInput === 'object' && data.freezeInput?.type) || 'all'
  };

  return layer;
};
