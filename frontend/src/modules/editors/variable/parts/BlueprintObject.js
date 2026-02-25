import { Box, Scan, Settings2 } from 'lucide-vue-next';
export const BlueprintObject = {
  _id: 'game_object_basic',
  label: 'Basic Entity',
  color: '#607D8B',
  icon: Box,
  items: [
    { 
      type: 'get_object', 
      label: 'Get Object Info', 
      description: 'Get generic info like ID, Name, Tag, Active', 
      icon: Scan, 
      allowDynamicInputs: false, 
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Get Object', headerColor: '#455A64', category: 'General' },
        data: {
          propertyOptions: [
            { value: 'entityId', label: 'Entity ID', type: 'string', color: '#FFF' },
            { value: 'name', label: 'Name', type: 'string', color: '#FFF' },
            { value: 'tag', label: 'Tag', type: 'string', color: '#FF9800' },
            { value: 'active', label: 'Active', type: 'boolean', color: '#4CAF50' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#2196F3' },
          ]
        },
        inputs: [{ _id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }], 
        outputs: [] 
      } 
    },
    { 
      type: 'set_object', 
      label: 'Set Object Info', 
      description: 'Set generic info like Name, Tag, Active', 
      icon: Settings2,
      allowDynamicInputs: true, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set Object', headerColor: '#455A64', category: 'General' },
        data: {
          propertyOptions: [
            { value: 'name', label: 'Name', type: 'string', color: '#FFF' },
            { value: 'tag', label: 'Tag', type: 'string', color: '#FF9800' },
            { value: 'active', label: 'Active', type: 'boolean', color: '#4CAF50' },
            { value: 'visible', label: 'Visible', type: 'boolean', color: '#2196F3' },
          ]
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }
        ], 
        outputs: [{ _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }]
      } 
    }
  ]
};