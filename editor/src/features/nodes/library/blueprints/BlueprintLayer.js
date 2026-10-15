import { Layers } from 'lucide-vue-next';

export const BlueprintLayer = {
  id: 'game_layer_basic',
  label: 'Basic Layer',
  color: '#8E24AA',
  icon: Layers,
  items: [
    {
      type: 'getLayer',
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
          { id: 'targetLayer', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [],
        data: {
          values: {
            targetLayer: 'self'
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
`const layer = context.assert.exists(context.layer.get(inputs.targetLayer));

outputs.layerId = layer.scriptId;
outputs.name = layer.name;
outputs.visible = layer.visible;
outputs.active = layer.active;
outputs.locked = layer.locked;
outputs.zIndex = layer.zIndex;
outputs.opacity = Math.round(layer.opacity * 100);
return;`
        }
      }
    },
    {
      type: 'setLayer',
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
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetLayer', dataType: 'string', color: '#F48FB1', defaultValue: 'self' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            targetLayer: 'self'
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
`const layer = context.assert.exists(context.layer.get(inputs.targetLayer));

const propKeys = ['name', 'visible', 'active', 'locked', 'zIndex'];
for (const key of propKeys) {
  if (key in inputs) {
    layer[key] = inputs[key];
  }
}
if ('opacity' in inputs) {
  layer.opacity = Math.max(0, Math.min(100, inputs.opacity)) / 100;
}

outputs.execOut = true;
return;`
        }
      }
    }
  ]
};