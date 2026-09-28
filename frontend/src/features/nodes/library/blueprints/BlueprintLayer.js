import { Layers, Scan, Settings2 } from 'lucide-vue-next';

export const BlueprintLayer = {
  id: 'game_layer_basic',
  label: 'Basic Layer',
  color: '#8E24AA',
  icon: Layers,
  items: [
    // 1. GET LAYER INFO (Pure Node - Dynamic Outputs)
    { 
      type: 'get_layer', 
      label: 'Get Layer Info', 
      description: 'Get layer info like ID, Name, Visible, Locked, Z-Index, Opacity', 
      icon: Scan, 
      allowDynamicInputs: false, 
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Get Layer', headerColor: '#6A1B9A', category: 'General' },
        inputs: [
          { id: 'target_in', label: 'Layer Target', dataType: 'string', color: '#FFB74D', defaultValue: 'self' }
        ], 
        outputs: [],
        data: {
          values: {
            target_in: 'self',
          },
          propertyOptions: [
            { value: 'layerId', label: 'Layer ID', type: 'string', color: '#FFB74D' },
            { value: 'name', label: 'Name', type: 'string', color: '#FFB74D' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#f472b6' },
            { value: 'active', label: 'Active', type: 'boolean', color: '#f472b6' },
            { value: 'locked', label: 'Locked', type: 'boolean', color: '#f472b6' },
            { value: 'zIndex', label: 'Z-Index', type: 'number', color: '#B2FF59' },
            { value: 'opacity', label: 'Opacity (%)', type: 'number', color: '#B2FF59' },
          ],
          code: `const targetId = inputs['Layer Target'];
const layer = context.layer.get(targetId);

if (layer) {
    outputs['Layer ID'] = layer.scriptId || layer.id || 'Unknown_ID';
    outputs['Name'] = layer.name || 'Unknown';
    outputs['Visible'] = layer.visible;
    outputs['Active'] = layer.active;
    outputs['Locked'] = layer.locked;
    outputs['Z-Index'] = layer.zIndex;
    outputs['Opacity (%)'] = Math.round((layer.opacity ?? 1.0) * 100);
}
return;`
        }
      } 
    },

    // 2. SET LAYER INFO (Action Node - Dynamic Inputs)
    { 
      type: 'set_layer', 
      label: 'Set Layer Info', 
      description: 'Set layer info like Name, Visible, Locked, Z-Index, Opacity', 
      icon: Settings2,
      allowDynamicInputs: true, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set Layer', headerColor: '#6A1B9A', category: 'General' },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'target_in', label: 'Layer Target', dataType: 'string', color: '#FFB74D', defaultValue: 'self' }
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ],
        data: {
          values: {
            target_in: 'self',
          },
          propertyOptions: [
            { value: 'name', label: 'Name', type: 'string', color: '#FFB74D' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#f472b6' },
            { value: 'active', label: 'Active', type: 'boolean', color: '#f472b6' },
            { value: 'locked', label: 'Locked', type: 'boolean', color: '#f472b6' },
            { value: 'zIndex', label: 'Z-Index', type: 'number', color: '#B2FF59' },
            { value: 'opacity', label: 'Opacity (%)', type: 'number', color: '#B2FF59' }, 
          ],
          code: `const targetId = inputs['Layer Target'];
const layer = context.layer.get(targetId);

if (layer) {
    const newName = inputs['Name'];
    const newVisible = inputs['Visible'];
    const newActive = inputs['Active'];
    const newLocked = inputs['Locked'];
    const newZIndex = inputs['Z-Index'];
    const newOpacity = inputs['Opacity (%)'];

    if (newName !== undefined && newName !== null) {
        layer.name = String(newName);
    }
    if (newVisible !== undefined && newVisible !== null) {
        layer.visible = Boolean(newVisible);
    }
    if (newActive !== undefined && newActive !== null) {
        layer.active = Boolean(newActive);
    }
    if (newLocked !== undefined && newLocked !== null) {
        layer.locked = Boolean(newLocked);
    }
    if (newZIndex !== undefined && newZIndex !== null) {
        layer.zIndex = Number(newZIndex);
    }
    if (newOpacity !== undefined && newOpacity !== null) {
        layer.opacity = Math.max(0, Math.min(100, Number(newOpacity))) / 100;
    }
}

outputs['Out'] = true;
return;`
        }
      } 
    }
  ]
};