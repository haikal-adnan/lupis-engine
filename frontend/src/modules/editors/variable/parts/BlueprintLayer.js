import { Layers, Scan, Settings2 } from 'lucide-vue-next';

export const BlueprintLayer = {
  _id: 'game_layer_basic',
  label: 'Basic Layer',
  color: '#8E24AA',
  icon: Layers,
  items: [
    { 
      type: 'get_layer', 
      label: 'Get Layer Info', 
      description: 'Get layer info like ID, Name, Visible, Locked, Z-Index, Opacity', 
      icon: Scan, 
      allowDynamicInputs: false, 
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Get Layer', headerColor: '#6A1B9A', category: 'General' },
        data: {
          values: {
             target_in: '',
          },
          propertyOptions: [
            { value: 'layerId', label: 'Layer ID', type: 'string', color: '#FFF' },
            { value: 'name', label: 'Name', type: 'string', color: '#FFF' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#2196F3' },
            { value: 'active', label: 'Active', type: 'boolean', color: '#4CAF50' },
            { value: 'locked', label: 'Locked', type: 'boolean', color: '#F44336' },
            { value: 'zIndex', label: 'Z-Index', type: 'number', color: '#00BCD4' },
            { value: 'opacity', label: 'Opacity (%)', type: 'number', color: '#00BCD4' },
          ]
        },
        inputs: [{ _id: 'target_in', label: 'Layer ID (Self)', dataType: 'string', color: '#ffffff' }], 
        outputs: [] 
      } 
    },
    { 
      type: 'set_layer', 
      label: 'Set Layer Info', 
      description: 'Set layer info like Name, Visible, Locked, Z-Index, Opacity', 
      icon: Settings2,
      allowDynamicInputs: true, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set Layer', headerColor: '#6A1B9A', category: 'General' },
        data: {
          values: {
             target_in: '',
          },
          propertyOptions: [
            { value: 'name', label: 'Name', type: 'string', color: '#FFF' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#2196F3' },
            { value: 'active', label: 'Active', type: 'boolean', color: '#4CAF50' },
            { value: 'locked', label: 'Locked', type: 'boolean', color: '#F44336' },
            { value: 'zIndex', label: 'Z-Index', type: 'number', color: '#00BCD4' },
            { value: 'opacity', label: 'Opacity (%)', type: 'number', color: '#00BCD4' }, 
          ]
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'target_in', label: 'Layer ID (Self)', dataType: 'string', color: '#E040FB' }
        ], 
        outputs: [{ _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }]
      } 
    }
  ]
};
