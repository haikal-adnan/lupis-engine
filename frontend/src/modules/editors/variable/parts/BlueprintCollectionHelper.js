import { 
  ListTree, 
  Network, 
  Copy, 
  BoxSelect 
} from 'lucide-vue-next';

export const BlueprintCollectionHelper = {
  _id: 'helper_list_map',
  label: 'Collection Helpers',
  color: '#673AB7', 
  icon: Network,
  items: [
    { 
      type: 'get_from_path', 
      label: 'Get From Path', 
      description: 'Retrieves nested data using a path string (e.g., players[0].stats.hp).',
      icon: ListTree,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Get Path', headerColor: '#673AB7', category: 'Helper' },
        data: {
          values: { path: "" }
        },
        inputs: [
          { _id: 'collection', label: 'Collection (List/Map)', dataType: 'any', color: '#673AB7' },
          { _id: 'path_in', label: 'Path 0', dataType: 'string', color: '#FFB74D' }
        ], 
        outputs: [
          { _id: 'result', label: 'Value', dataType: 'any', color: '#FFFFFF' }
        ]
      } 
    },
    { 
      type: 'set_from_path', 
      label: 'Set From Path', 
      description: 'Updates nested data using a path. If the path does not exist, it will be automatically created.',
      icon: Network,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set Path', headerColor: '#673AB7', category: 'Helper' },
        data: {
          values: { path: "", value: "" }
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'collection', label: 'Collection (List/Map)', dataType: 'any', color: '#673AB7' },
          { _id: 'path_in', label: 'Path String', dataType: 'string', color: '#FFB74D' },
          { _id: 'value', label: 'New Value', dataType: 'any', color: '#FFFFFF' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'collection_out', label: 'Collection', dataType: 'any', color: '#673AB7' },
          { _id: 'value_out', label: 'Value', dataType: 'any', color: '#FFFFFF' }
        ]
      } 
    },
    { 
      type: 'clone_collection', 
      label: 'Clone Collection', 
      description: 'Duplicates (Deep Copy) a List or Map so the original reference remains unchanged when modified.',
      icon: Copy,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Clone Data', headerColor: '#673AB7', category: 'Helper' },
        data: {},
        inputs: [
          { _id: 'collection', label: 'Input Collection', dataType: 'any', color: '#673AB7' }
        ], 
        outputs: [
          { _id: 'cloned', label: 'Cloned Collection', dataType: 'any', color: '#673AB7' }
        ]
      } 
    },
    { 
      type: 'is_collection_empty', 
      label: 'Is Empty', 
      description: 'Checks whether a List is empty (length 0) or a Map is empty (has no keys).',
      icon: BoxSelect,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Is Empty', headerColor: '#673AB7', category: 'Helper' },
        data: {},
        inputs: [
          { _id: 'collection', label: 'Collection', dataType: 'any', color: '#673AB7' }
        ], 
        outputs: [
          { _id: 'result', label: 'Is Empty', dataType: 'boolean', color: '#4CAF50' }
        ]
      } 
    }
  ]
};