import { Box } from 'lucide-vue-next';

export const basicObject = {
  id: 'game_object_basic',
  label: 'Basic Entity',
  color: '#607D8B',
  icon: Box,
  items: [
    { 
      type: 'get_entity_info', 
      label: 'Get Entity Info', 
      description: 'Get basic information of an entity like ID and Tag', 
      defaultData: { 
        settings: { 
          headerTitle: 'Object Info', 
          headerColor: '#455A64', 
          category: 'Basic Entity' 
        },
        inputs: [
          { _id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }
        ], 
        outputs: [
          { _id: 'entityId', label: 'Entity ID', dataType: 'string', color: '#FFF' },
          { _id: 'tagName', label: 'Tag', dataType: 'string', color: '#FF9800' },
          { _id: 'name', label: 'Name', dataType: 'string', color: '#FFF' }
        ]
      } 
    }
  ]
};