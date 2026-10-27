import { Box, Scan, Settings2, PackagePlus, Copy, Trash2 } from 'lucide-vue-next';

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
          ],
          values: {
            target_in: ''
          }
        },
        inputs: [{ _id: 'target_in', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }], 
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
          ],
          values: {
            target_in: ''
          }
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'target_in', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }
        ], 
        outputs: [{ _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }]
      } 
    },
    { 
      type: 'find_closest_by_tag', 
      label: 'Find Closest by Tag', 
      description: 'Get the closest active entity ID based on tag and origin position', 
      icon: Scan, 
      allowDynamicInputs: false, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Find Closest', headerColor: '#455A64', category: 'General' },
        data: {
          values: {
            tag: '',
            from_x: 0,
            from_y: 0
          }
        },
        inputs: [
          { _id: 'tag', label: 'Tag Target', dataType: 'string', color: '#FF9800' },
          { _id: 'from_x', label: 'From X', dataType: 'number', color: '#69F0AE' },
          { _id: 'from_y', label: 'From Y', dataType: 'number', color: '#69F0AE' }
        ], 
        outputs: [
          { _id: 'target_id', label: 'Target ID', dataType: 'string', color: '#E040FB' },
          { _id: 'found', label: 'Is Found', dataType: 'boolean', color: '#4CAF50' }
        ] 
      } 
    },
  ]
};