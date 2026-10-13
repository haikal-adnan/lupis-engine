import { Layers } from 'lucide-vue-next';

export const BlueprintLayer = {
  id: 'game_layer_basic',
  label: 'Basic Layer',
  color: '#8E24AA',
  icon: Layers,
  items: [
    {
      type: 'get_layer',
      label: 'Get Layer Info',
      description: 'Get layer info like ID, Name, Visible, Locked, Z-Index, Opacity',
      dynamicMode: 'outputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Get Layer',
          headerColor: '#6A1B9A',
          category: 'Basic Layer'
        },
        inputs: [
          { id: 'target_in', label: 'Layer Target', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [],
        data: {
          values: {
            target_in: 'self'
          },
          propertyOptions: [
            { value: 'layerId', label: 'Layer ID', type: 'string', color: '#F48FB1' },
            { value: 'name', label: 'Name', type: 'string', color: '#F48FB1' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#E57373' },
            { value: 'active', label: 'Active', type: 'boolean', color: '#E57373' },
            { value: 'locked', label: 'Locked', type: 'boolean', color: '#E57373' },
            { value: 'zIndex', label: 'Z-Index', type: 'number', color: '#64B5F6' },
            { value: 'opacity', label: 'Opacity (%)', type: 'number', color: '#64B5F6' }
          ],
          code: 
`const targetId = inputs['Layer Target'] ?? inputs['target_in'] ?? 'self';
const layer = context.layer.get(targetId);

if (layer) {
  const layerIdVal = layer.scriptId || layer.id || 'Unknown_ID';
  const nameVal = layer.name || 'Unknown';
  const visibleVal = Boolean(layer.visible);
  const activeVal = Boolean(layer.active);
  const lockedVal = Boolean(layer.locked);
  const zIndexVal = Number(layer.zIndex ?? 0);
  const opacityVal = Math.round((layer.opacity ?? 1.0) * 100);

  outputs['Layer ID'] = layerIdVal;
  outputs['layerId'] = layerIdVal;
  outputs['Name'] = nameVal;
  outputs['name'] = nameVal;
  outputs['Visible'] = visibleVal;
  outputs['visible'] = visibleVal;
  outputs['Active'] = activeVal;
  outputs['active'] = activeVal;
  outputs['Locked'] = lockedVal;
  outputs['locked'] = lockedVal;
  outputs['Z-Index'] = zIndexVal;
  outputs['zIndex'] = zIndexVal;
  outputs['Opacity (%)'] = opacityVal;
  outputs['opacity'] = opacityVal;
}
return;`
        }
      }
    },
    {
      type: 'set_layer',
      label: 'Set Layer Info',
      description: 'Set layer info like Name, Visible, Locked, Z-Index, Opacity',
      dynamicMode: 'inputProperty',
      defaultData: {
        settings: {
          headerTitle: 'Set Layer',
          headerColor: '#6A1B9A',
          category: 'Basic Layer'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'target_in', label: 'Layer Target', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            target_in: 'self'
          },
          propertyOptions: [
            { value: 'name', label: 'Name', type: 'string', color: '#F48FB1' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#E57373' },
            { value: 'active', label: 'Active', type: 'boolean', color: '#E57373' },
            { value: 'locked', label: 'Locked', type: 'boolean', color: '#E57373' },
            { value: 'zIndex', label: 'Z-Index', type: 'number', color: '#64B5F6' },
            { value: 'opacity', label: 'Opacity (%)', type: 'number', color: '#64B5F6' }
          ],
          code: 
`const targetId = inputs['Layer Target'] ?? inputs['target_in'] ?? 'self';
const layer = context.layer.get(targetId);

if (layer) {
  const newName = inputs['Name'] ?? inputs['name'];
  const newVisible = inputs['Visible'] ?? inputs['visible'];
  const newActive = inputs['Active'] ?? inputs['active'];
  const newLocked = inputs['Locked'] ?? inputs['locked'];
  const newZIndex = inputs['Z-Index'] ?? inputs['zIndex'];
  const newOpacity = inputs['Opacity (%)'] ?? inputs['opacity'];

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
outputs['exec_out'] = true;
return;`
        }
      }
    }
  ]
};

